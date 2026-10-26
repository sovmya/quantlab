const config = require("./config/env"); // loads .env and validates it first
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.set("trust proxy", 1); // running behind Render's proxy in production
app.use(helmet()); // secure HTTP headers
app.use(express.json({ limit: "1mb" })); // body-size limit
app.use(cookieParser());

const tooMany = { success: false, message: "Too many requests. Please slow down." };

// Generous general limit, strict limit on credential endpoints (brute-force protection).
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, message: tooMany })
);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/datasets", require("./routes/dataset.routes"));
app.use("/api/backtests", require("./routes/backtest.routes"));

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
});