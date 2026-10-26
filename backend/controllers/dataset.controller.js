const crypto = require("crypto");
const Dataset = require("../models/dataset.model");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { str, num, objectId } = require("../utils/validate");
const { generateGBM } = require("../services/dataGenerator");

const MAX_DATASETS_PER_USER = 20;

const enforceLimit = async (userId) => {
  const count = await Dataset.countDocuments({ user: userId });
  if (count >= MAX_DATASETS_PER_USER) {
    throw new HttpError(400, `Dataset limit reached (${MAX_DATASETS_PER_USER}). Delete one first.`);
  }
};

const summary = (d) => ({
  _id: d._id,
  name: d.name,
  source: d.source,
  points: d.points,
  startDate: d.startDate,
  endDate: d.endDate,
  params: d.params,
  createdAt: d.createdAt,
});

// POST /api/datasets/generate
const generate = asyncHandler(async (req, res) => {
  const b = req.body;
  const name = str(b.name, "Name", { max: 60 });
  const days = num(b.days, "Trading days", { min: 60, max: 3000, integer: true });
  const startPrice = num(b.startPrice, "Start price", { min: 1, max: 100000 });
  const drift = num(b.drift, "Annual drift", { min: -0.5, max: 1 });
  const vol = num(b.vol, "Annual volatility", { min: 0.05, max: 1.5 });
  const seed =
    b.seed === undefined
      ? crypto.randomInt(0, 2147483647)
      : num(b.seed, "Seed", { min: 0, max: 2147483647, integer: true });

  await enforceLimit(req.user._id);

  const prices = generateGBM({ days, startPrice, drift, vol, seed });
  const dataset = await Dataset.create({
    user: req.user._id,
    name,
    source: "synthetic",
    params: { days, startPrice, drift, vol, seed },
    points: prices.length,
    startDate: prices[0].date,
    endDate: prices[prices.length - 1].date,
    prices,
  });

  res.status(201).json({ success: true, dataset: summary(dataset) });
});

// POST /api/datasets/upload   body: { name, candles: [{ date, close }] }
const upload = asyncHandler(async (req, res) => {
  const name = str(req.body.name, "Name", { max: 60 });
  const { candles } = req.body;

  if (!Array.isArray(candles) || candles.length < 60 || candles.length > 5000) {
    throw new HttpError(400, "Provide between 60 and 5000 rows");
  }

  const prices = candles.map((row, i) => {
    if (!row || typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || isNaN(Date.parse(row.date))) {
      throw new HttpError(400, `Row ${i + 1}: date must be YYYY-MM-DD`);
    }
    if (typeof row.close !== "number" || !Number.isFinite(row.close) || row.close <= 0) {
      throw new HttpError(400, `Row ${i + 1}: close must be a positive number`);
    }
    return { date: row.date, close: row.close };
  });

  prices.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < prices.length; i++) {
    if (prices[i].date === prices[i - 1].date) {
      throw new HttpError(400, `Duplicate date found: ${prices[i].date}`);
    }
  }

  await enforceLimit(req.user._id);

  const dataset = await Dataset.create({
    user: req.user._id,
    name,
    source: "upload",
    points: prices.length,
    startDate: prices[0].date,
    endDate: prices[prices.length - 1].date,
    prices,
  });

  res.status(201).json({ success: true, dataset: summary(dataset) });
});

// GET /api/datasets  (no price arrays: keeps the list light)
const list = asyncHandler(async (req, res) => {
  const datasets = await Dataset.find({ user: req.user._id })
    .select("-prices")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: datasets.length, datasets });
});

// GET /api/datasets/:id
const getOne = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id, "dataset id");
  const dataset = await Dataset.findOne({ _id: id, user: req.user._id }).lean();
  if (!dataset) throw new HttpError(404, "Dataset not found");
  res.json({ success: true, dataset });
});

// DELETE /api/datasets/:id
const remove = asyncHandler(async (req, res) => {
  const id = objectId(req.params.id, "dataset id");
  const deleted = await Dataset.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) throw new HttpError(404, "Dataset not found");
  res.json({ success: true, message: "Dataset deleted" });
});

module.exports = { generate, upload, list, getOne, remove };