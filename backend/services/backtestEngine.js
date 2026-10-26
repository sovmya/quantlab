const TRADING_DAYS = 252;
const round2 = (n) => Math.round(n * 100) / 100;

// Risk/return statistics from a series of portfolio values.
function computeMetrics(equity) {
  const n = equity.length;
  const first = equity[0];
  const last = equity[n - 1];

  const returns = [];
  for (let i = 1; i < n; i++) returns.push(equity[i] / equity[i - 1] - 1);

  const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance =
    returns.length > 1
      ? returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1)
      : 0;
  const std = Math.sqrt(variance);

  const years = (n - 1) / TRADING_DAYS;
  const totalReturn = last / first - 1;
  const cagr = years > 0 ? Math.pow(last / first, 1 / years) - 1 : 0;
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(TRADING_DAYS) : 0; // risk-free rate = 0
  const volatility = std * Math.sqrt(TRADING_DAYS);

  let peak = equity[0];
  let maxDrawdown = 0;
  for (const value of equity) {
    if (value > peak) peak = value;
    const drawdown = (value - peak) / peak;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }

  return {
    finalValue: round2(last),
    totalReturn: round2(totalReturn * 100),
    cagr: round2(cagr * 100),
    volatility: round2(volatility * 100),
    sharpe: round2(sharpe),
    maxDrawdown: round2(maxDrawdown * 100),
  };
}

/**
 * prices:  [{ date, close }]
 * signals: signals[i] is decided at the close of day i.
 * To avoid look-ahead bias, the trade for day i uses signals[i - 1]
 * and executes at day i's close (one bar of delay).
 */
function runBacktest({ prices, signals, initialCapital, feePercent }) {
  const fee = feePercent / 100;
  let cash = initialCapital;
  let shares = 0;
  let entry = null;

  const equityCurve = [];
  const trades = [];

  const benchmarkShares = (initialCapital * (1 - fee)) / prices[0].close;

  for (let i = 0; i < prices.length; i++) {
    const { date, close } = prices[i];
    const desired = i === 0 ? 0 : signals[i - 1];

    if (desired === 1 && shares === 0) {
      shares = (cash * (1 - fee)) / close;
      entry = { date, price: close, cost: cash };
      cash = 0;
    } else if (desired === 0 && shares > 0) {
      cash = shares * close * (1 - fee);
      trades.push({
        entryDate: entry.date,
        exitDate: date,
        entryPrice: round2(entry.price),
        exitPrice: round2(close),
        returnPct: round2((cash / entry.cost - 1) * 100),
        open: false,
      });
      shares = 0;
      entry = null;
    }

    equityCurve.push({
      date,
      equity: round2(cash + shares * close),
      benchmark: round2(benchmarkShares * close),
    });
  }

  // Position still open at the end: report it, marked to market.
  if (shares > 0) {
    const last = prices[prices.length - 1];
    trades.push({
      entryDate: entry.date,
      exitDate: last.date,
      entryPrice: round2(entry.price),
      exitPrice: round2(last.close),
      returnPct: round2(((shares * last.close) / entry.cost - 1) * 100),
      open: true,
    });
  }

  const metrics = computeMetrics(equityCurve.map((p) => p.equity));
  const benchmark = computeMetrics(equityCurve.map((p) => p.benchmark));

  const closed = trades.filter((t) => !t.open);
  const wins = closed.filter((t) => t.returnPct > 0).length;
  metrics.numTrades = closed.length;
  metrics.winRate = closed.length ? round2((wins / closed.length) * 100) : 0;
  metrics.avgTradeReturn = closed.length
    ? round2(closed.reduce((a, t) => a + t.returnPct, 0) / closed.length)
    : 0;

  return { equityCurve, trades, metrics, benchmark };
}

module.exports = { runBacktest, computeMetrics };