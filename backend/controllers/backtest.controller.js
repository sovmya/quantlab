const Backtest = require("../models/backtest.model");
const Dataset = require("../models/dataset.model");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { num, objectId } = require("../utils/validate");
const { strategies, listStrategies, validateParams } = require("../services/strategies");
const { runBacktest } = require("../services/backtestEngine");

const MAX_BACKTESTS_PER_USER = 200;

// GET /api/backtests/strategies
const getStrategies = (req, res) => res.json({ success: true, strategies: listStrategies() });

// POST /api/backtests
const run = asyncHandler(async (req, res) => {
  const b = req.body;
  const datasetId = objectId(b.datasetId, "dataset id");

  const s = b.strategy;
  if (!s || typeof s !== "object" || typeof s.type !== "string") {
    throw new HttpError(400, "Strategy type is required");
  }
  // Object.hasOwn: blocks keys like "constructor" or "__proto__"
  if (!Object.hasOwn(strategies, s.type)) throw new HttpError(400, "Unknown strategy");
  const def = strategies[s.type];
  const params = validateParams(def, s.params === undefined ? {} : s.params);

  const initialCapital = num(b.initialCapital ?? 10000, "Initial capital", { min: 100, max: 1e9 });
  const feePercent = num(b.feePercent ?? 0.1, "Fee %", { min: 0, max: 5 });

  const dataset = await Dataset.findOne({ _id: datasetId, user: req.user._id }).lean();
  if (!dataset) throw new HttpError(404, "Dataset not found");

  const count = await Backtest.countDocuments({ user: req.user._id });
  if (count >= MAX_BACKTESTS_PER_USER) {
    throw new HttpError(400, "Backtest limit reached. Delete old runs first.");
  }

  // The SERVER runs the engine. The client never supplies results.
  const closes = dataset.prices.map((p) => p.close);
  const signals = def.signals(closes, params);
  const result = runBacktest({ prices: dataset.prices, signals, initialCapital, feePercent });

  const backtest = await Backtest.create({
    user: req.user._id,
    dataset: dataset._id,
    datasetName: dataset.name,
    strategy: { type: s.type, params },
    initialCapital,
    feePercent,
    ...result,
  });

  res.status(201).json({ success: true, backtest });
});

// GET /api/backtests (summaries only)
const list = asyncHandler(async (req, res) => {
  const backtests = await Backtest.find({ user: req.user._id })
    .select("-equityCurve -trades")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: backtests.length, backtests });
});

// GET /api/backtests/:id
const getOne = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id, "backtest id");
  const backtest = await Backtest.findOne({ _id: id, user: req.user._id }).lean();
  if (!backtest) throw new HttpError(404, "Backtest not found");
  res.json({ success: true, backtest });
});

// DELETE /api/backtests/:id
const remove = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id, "backtest id");
  const deleted = await Backtest.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) throw new HttpError(404, "Backtest not found");
  res.json({ success: true, message: "Backtest deleted" });
});

module.exports = { getStrategies, run, list, getOne, remove };