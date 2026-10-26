import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MetricCard from "../components/MetricCard";
import { Loading, ErrorBox, Empty } from "../components/Status";
import { fmtPct, fmtDate, STRATEGY_LABELS, tone } from "../utils/format";

function Dashboard() {
  const { user } = useAuth();
  const [backtests, setBacktests] = useState([]);
  const [datasetCount, setDatasetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bt, ds] = await Promise.all([api.get("/backtests"), api.get("/datasets")]);
      setBacktests(bt.data.backtests);
      setDatasetCount(ds.data.count);
    } catch (err) {
      setError(errorMessage(err, "Could not load dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading text="Loading dashboard..." />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  // derived values, calculated from state rather than stored
  const bestReturn = backtests.length ? Math.max(...backtests.map((b) => b.metrics.totalReturn)) : null;
  const bestSharpe = backtests.length ? Math.max(...backtests.map((b) => b.metrics.sharpe)) : null;

  return (
    <>
      <div className="page-head">
        <h1>Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="muted">Your research desk at a glance.</p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Datasets" value={datasetCount} />
        <MetricCard label="Backtests run" value={backtests.length} />
        <MetricCard label="Best return" value={bestReturn === null ? "-" : fmtPct(bestReturn)} tone={bestReturn === null ? "" : tone(bestReturn)} />
        <MetricCard label="Best Sharpe" value={bestSharpe === null ? "-" : bestSharpe.toFixed(2)} />
      </div>

      <h2 className="section">Recent backtests</h2>
      {backtests.length === 0 ? (
        <Empty title="No backtests yet" text={datasetCount === 0 ? "Start by creating a dataset." : "Run your first strategy."}>
          <Link className="btn btn-primary" to={datasetCount === 0 ? "/datasets" : "/backtests/new"}>
            {datasetCount === 0 ? "Create dataset" : "New backtest"}
          </Link>
        </Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Strategy</th><th>Dataset</th><th>Return</th><th>Sharpe</th><th>Max DD</th><th>Date</th></tr>
            </thead>
            <tbody>
              {backtests.slice(0, 5).map((b) => (
                <tr key={b._id}>
                  <td><Link to={`/backtests/${b._id}`}>{STRATEGY_LABELS[b.strategy.type] || b.strategy.type}</Link></td>
                  <td>{b.datasetName}</td>
                  <td className={`mono ${tone(b.metrics.totalReturn)}`}>{fmtPct(b.metrics.totalReturn)}</td>
                  <td className="mono">{b.metrics.sharpe.toFixed(2)}</td>
                  <td className="mono neg">{fmtPct(b.metrics.maxDrawdown)}</td>
                  <td className="muted">{fmtDate(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Dashboard;