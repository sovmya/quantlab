const { sma, bollinger, rsi } = require("./indicators");
const { num } = require("../utils/validate");
const HttpError = require("../utils/httpError");

// Each strategy returns a signal array: signal[i] = 1 (hold) or 0 (cash),
// decided using ONLY data up to and including day i.
const strategies = {
  sma_cross: {
    label: "SMA Crossover",
    description: "Hold while the fast moving average is above the slow one, otherwise stay in cash.",
    params: [
      { key: "fast", label: "Fast period", default: 10, min: 2, max: 100, integer: true },
      { key: "slow", label: "Slow period", default: 30, min: 5, max: 250, integer: true },
    ],
    check: (p) => (p.fast >= p.slow ? "Fast period must be smaller than slow period" : null),
    signals(closes, p) {
      const fast = sma(closes, p.fast);
      const slow = sma(closes, p.slow);
      return closes.map((_, i) =>
        fast[i] !== null && slow[i] !== null && fast[i] > slow[i] ? 1 : 0
      );
    },
  },

  rsi: {
    label: "RSI Mean Reversion",
    description: "Buy when RSI drops below the oversold level, sell when it rises above overbought.",
    params: [
      { key: "period", label: "RSI period", default: 14, min: 2, max: 50, integer: true },
      { key: "oversold", label: "Oversold level", default: 30, min: 5, max: 50, integer: true },
      { key: "overbought", label: "Overbought level", default: 70, min: 50, max: 95, integer: true },
    ],
    check: (p) => (p.oversold >= p.overbought ? "Oversold must be below overbought" : null),
    signals(closes, p) {
      const values = rsi(closes, p.period);
      let position = 0;
      return closes.map((_, i) => {
        const v = values[i];
        if (v === null) return position;
        if (position === 0 && v < p.oversold) position = 1;
        else if (position === 1 && v > p.overbought) position = 0;
        return position;
      });
    },
  },

  bollinger: {
    label: "Bollinger Bands",
    description: "Buy when price closes below the lower band, sell when it returns to the middle band.",
    params: [
      { key: "period", label: "Band period", default: 20, min: 5, max: 100, integer: true },
      { key: "mult", label: "Std-dev multiplier", default: 2, min: 0.5, max: 4, integer: false },
    ],
    check: () => null,
    signals(closes, p) {
      const { mid, lower } = bollinger(closes, p.period, p.mult);
      let position = 0;
      return closes.map((close, i) => {
        if (mid[i] === null) return position;
        if (position === 0 && close < lower[i]) position = 1;
        else if (position === 1 && close > mid[i]) position = 0;
        return position;
      });
    },
  },
};

// Public description (no functions) so the frontend can build forms dynamically.
const listStrategies = () =>
  Object.entries(strategies).map(([key, s]) => ({
    key,
    label: s.label,
    description: s.description,
    params: s.params,
  }));

// Validates user-supplied params against the strategy's own spec.
const validateParams = (def, input) => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Strategy params must be an object");
  }
  const clean = {};
  for (const spec of def.params) {
    const raw = input[spec.key] === undefined ? spec.default : input[spec.key];
    clean[spec.key] = num(raw, spec.label, {
      min: spec.min,
      max: spec.max,
      integer: spec.integer,
    });
  }
  const problem = def.check(clean);
  if (problem) throw new HttpError(400, problem);
  return clean;
};

module.exports = { strategies, listStrategies, validateParams };