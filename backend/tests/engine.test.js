const test = require("node:test");
const assert = require("node:assert");
const { sma, rsi } = require("../services/indicators");
const { runBacktest, computeMetrics } = require("../services/backtestEngine");

const prices = (closes) => closes.map((close, i) => ({ date: `2024-01-${String(i + 1).padStart(2, "0")}`, close }));

test("sma gives null during warm-up then the correct average", () => {
  assert.deepStrictEqual(sma([1, 2, 3, 4], 2), [null, 1.5, 2.5, 3.5]);
});

test("rsi is 100 when price only goes up", () => {
  const out = rsi([1, 2, 3, 4, 5, 6], 3);
  assert.strictEqual(out[3], 100);
});

test("signal at day t executes on day t+1 (no look-ahead)", () => {
  // Always-long signal, no fees. Position opens on day 2 (index 1), at price 110.
  const result = runBacktest({
    prices: prices([100, 110, 121]),
    signals: [1, 1, 1],
    initialCapital: 10000,
    feePercent: 0,
  });
  assert.strictEqual(result.equityCurve[0].equity, 10000); // day 1: no position yet
  assert.strictEqual(result.equityCurve[1].equity, 10000); // bought at 110, no gain yet
  assert.strictEqual(result.equityCurve[2].equity, 11000); // 110 -> 121 = +10%
});

test("fees reduce final value", () => {
  const args = { prices: prices([100, 100, 110, 110]), signals: [1, 1, 0, 0], initialCapital: 10000 };
  const free = runBacktest({ ...args, feePercent: 0 });
  const paid = runBacktest({ ...args, feePercent: 1 });
  assert.ok(paid.metrics.finalValue < free.metrics.finalValue);
});

test("max drawdown is measured from the running peak", () => {
  const m = computeMetrics([100, 120, 90, 110]);
  assert.strictEqual(m.maxDrawdown, -25); // (90 - 120) / 120
});