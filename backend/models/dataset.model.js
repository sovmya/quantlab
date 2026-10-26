const mongoose = require("mongoose");

const datasetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    source: { type: String, enum: ["synthetic", "upload"], required: true },
    params: { type: mongoose.Schema.Types.Mixed }, // generator settings, for reproducibility
    points: { type: Number, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    prices: [
      {
        _id: false,
        date: { type: String, required: true },
        close: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dataset", datasetSchema);