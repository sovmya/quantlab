export const fmtPct = (v) => `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
export const fmtMoney = (v) =>
  "$" + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const STRATEGY_LABELS = {
  sma_cross: "SMA Crossover",
  rsi: "RSI Mean Reversion",
  bollinger: "Bollinger Bands",
};

export const tone = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");