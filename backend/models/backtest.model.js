const mongoose = require("mongoose");

const backtestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset" },
    datasetName: { type: String, required: true }, // snapshot: survives dataset deletion
    strategy: {
      type: { type: String, required: true },
      params: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    initialCapital: { type: Number, required: true },
    feePercent: { type: Number, required: true },
    metrics: { type: mongoose.Schema.Types.Mixed, required: true },
    benchmark: { type: mongoose.Schema.Types.Mixed, required: true },
    equityCurve: [
      { _id: false, date: String, equity: Number, benchmark: Number },
    ],
    trades: [
      {
        _id: false,
        entryDate: String,
        exitDate: String,
        entryPrice: Number,
        exitPrice: Number,
        returnPct: Number,
        open: Boolean,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Backtest", backtestSchema);