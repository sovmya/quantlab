import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import api, { errorMessage } from "../services/api";
import MetricCard from "../components/MetricCard";
import { Loading, ErrorBox } from "../components/Status";
import { fmtPct, fmtMoney, STRATEGY_LABELS, tone } from "../utils/format";

function BacktestDetail() {
  const { id } = useParams();
  const [bt, setBt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/backtests/${id}`);
      setBt(res.data.backtest);
    } catch (err) {
      setError(errorMessage(err, "Could not load backtest"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <Loading text="Loading backtest..." />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const m = bt.metrics;
  const b = bt.benchmark;
  const paramText = Object.entries(bt.strategy.params).map(([k, v]) => `${k}=${v}`).join(", ");

  return (
    <>
      <Link className="back" to="/backtests">← All backtests</Link>
      <div className="page-head">
        <h1>{STRATEGY_LABELS[bt.strategy.type] || bt.strategy.type}</h1>
        <p className="muted">
          {bt.datasetName} · {paramText} · {fmtMoney(bt.initialCapital)} start · {bt.feePercent}% fee
        </p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total return" value={fmtPct(m.totalReturn)} tone={tone(m.totalReturn)} sub={`Buy & Hold ${fmtPct(b.totalReturn)}`} />
        <MetricCard label="CAGR" value={fmtPct(m.cagr)} tone={tone(m.cagr)} sub={`Buy & Hold ${fmtPct(b.cagr)}`} />
        <MetricCard label="Sharpe ratio" value={m.sharpe.toFixed(2)} sub={`Buy & Hold ${b.sharpe.toFixed(2)}`} />
        <MetricCard label="Max drawdown" value={fmtPct(m.maxDrawdown)} tone="neg" sub={`Buy & Hold ${fmtPct(b.maxDrawdown)}`} />
        <MetricCard label="Volatility (ann.)" value={`${m.volatility.toFixed(2)}%`} sub={`Buy & Hold ${b.volatility.toFixed(2)}%`} />
        <MetricCard label="Final value" value={fmtMoney(m.finalValue)} sub={`Buy & Hold ${fmtMoney(b.finalValue)}`} />
        <MetricCard label="Trades" value={m.numTrades} />
        <MetricCard label="Win rate" value={`${m.winRate}%`} sub={`Avg trade ${fmtPct(m.avgTradeReturn)}`} />
      </div>

      <h2 className="section">Equity curve</h2>
      <div className="panel chart">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={bt.equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#243042" />
            <XAxis dataKey="date" tick={{ fill: "#8b98a9", fontSize: 11 }} minTickGap={60} />
            <YAxis tick={{ fill: "#8b98a9", fontSize: 11 }} domain={["auto", "auto"]} width={70} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <Tooltip contentStyle={{ background: "#121826", border: "1px solid #243042", borderRadius: 8 }} formatter={(v) => fmtMoney(v)} />
            <Legend />
            <Line type="monotone" dataKey="equity" name="Strategy" stroke="#00d68f" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="benchmark" name="Buy & Hold" stroke="#f5a524" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="section">Trade log ({bt.trades.length})</h2>
      {bt.trades.length === 0 ? (
        <p className="muted">The strategy never entered a position on this dataset.</p>
      ) : (
        <div className="table-wrap scroll">
          <table>
            <thead>
              <tr><th>#</th><th>Entry</th><th>Exit</th><th>Entry price</th><th>Exit price</th><th>Return</th></tr>
            </thead>
            <tbody>
              {bt.trades.map((t, i) => (
                <tr key={i}>
                  <td className="muted">{i + 1}</td>
                  <td>{t.entryDate}</td>
                  <td>{t.exitDate} {t.open && <span className="pill">open</span>}</td>
                  <td className="mono">{t.entryPrice}</td>
                  <td className="mono">{t.exitPrice}</td>
                  <td className={`mono ${tone(t.returnPct)}`}>{fmtPct(t.returnPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default BacktestDetail;