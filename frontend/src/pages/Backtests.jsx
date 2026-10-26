import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { Loading, ErrorBox, Empty } from "../components/Status";
import { fmtPct, fmtDate, STRATEGY_LABELS, tone } from "../utils/format";

function Backtests() {
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/backtests");
      setBacktests(res.data.backtests);
    } catch (err) {
      setError(errorMessage(err, "Could not load backtests"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this backtest?")) return;
    try {
      await api.delete(`/backtests/${id}`);
      setBacktests((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Backtests</h1>
        <p className="muted">Every run is saved, so you can revisit and compare results.</p>
      </div>

      {loading && <Loading text="Loading backtests..." />}
      {!loading && error && <ErrorBox message={error} onRetry={load} />}
      {!loading && !error && backtests.length === 0 && (
        <Empty title="No backtests yet" text="Run your first strategy.">
          <Link className="btn btn-primary" to="/backtests/new">New backtest</Link>
        </Empty>
      )}
      {!loading && !error && backtests.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Strategy</th><th>Dataset</th><th>Return</th><th>vs Buy&amp;Hold</th><th>Sharpe</th><th>Max DD</th><th>Trades</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {backtests.map((b) => {
                const edge = b.metrics.totalReturn - b.benchmark.totalReturn;
                return (
                  <tr key={b._id}>
                    <td><Link to={`/backtests/${b._id}`}>{STRATEGY_LABELS[b.strategy.type] || b.strategy.type}</Link></td>
                    <td>{b.datasetName}</td>
                    <td className={`mono ${tone(b.metrics.totalReturn)}`}>{fmtPct(b.metrics.totalReturn)}</td>
                    <td className={`mono ${tone(edge)}`}>{fmtPct(edge)}</td>
                    <td className="mono">{b.metrics.sharpe.toFixed(2)}</td>
                    <td className="mono neg">{fmtPct(b.metrics.maxDrawdown)}</td>
                    <td className="mono">{b.metrics.numTrades}</td>
                    <td className="muted">{fmtDate(b.createdAt)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(b._id)}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Backtests;