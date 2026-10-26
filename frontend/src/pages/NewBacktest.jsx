import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { Loading, ErrorBox, Empty } from "../components/Status";

function NewBacktest() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [datasetId, setDatasetId] = useState("");
  const [strategyKey, setStrategyKey] = useState("");
  const [params, setParams] = useState({});
  const [capital, setCapital] = useState(10000);
  const [fee, setFee] = useState(0.1);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const defaultsFor = (s) => Object.fromEntries(s.params.map((p) => [p.key, p.default]));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [ds, st] = await Promise.all([api.get("/datasets"), api.get("/backtests/strategies")]);
      setDatasets(ds.data.datasets);
      setStrategies(st.data.strategies);
      if (ds.data.datasets.length) setDatasetId(ds.data.datasets[0]._id);
      if (st.data.strategies.length) {
        setStrategyKey(st.data.strategies[0].key);
        setParams(defaultsFor(st.data.strategies[0]));
      }
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load form data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = strategies.find((s) => s.key === strategyKey);

  const pickStrategy = (key) => {
    setStrategyKey(key);
    setParams(defaultsFor(strategies.find((s) => s.key === key)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRunning(true);
    try {
      const numericParams = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Number(v)]));
      const res = await api.post("/backtests", {
        datasetId,
        strategy: { type: strategyKey, params: numericParams },
        initialCapital: Number(capital),
        feePercent: Number(fee),
      });
      navigate(`/backtests/${res.data.backtest._id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Loading text="Loading..." />;
  if (loadError) return <ErrorBox message={loadError} onRetry={load} />;
  if (datasets.length === 0) {
    return (
      <Empty title="You need a dataset first" text="Backtests run on a price series.">
        <Link className="btn btn-primary" to="/datasets">Create a dataset</Link>
      </Empty>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>New backtest</h1>
        <p className="muted">Signals are decided at one close and executed at the next, so there's no look-ahead bias.</p>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit}>
        {error && <p className="error-text span-2">{error}</p>}

        <label>Dataset
          <select className="input" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
            {datasets.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.points} pts)</option>)}
          </select>
        </label>

        <label>Strategy
          <select className="input" value={strategyKey} onChange={(e) => pickStrategy(e.target.value)}>
            {strategies.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>

        {selected && <p className="muted span-2">{selected.description}</p>}

        {selected?.params.map((p) => (
          <label key={p.key}>{p.label}
            <input
              className="input"
              type="number"
              min={p.min}
              max={p.max}
              step={p.integer ? 1 : "any"}
              value={params[p.key] ?? ""}
              onChange={(e) => setParams({ ...params, [p.key]: e.target.value })}
            />
          </label>
        ))}

        <label>Initial capital ($)
          <input className="input" type="number" min="100" value={capital} onChange={(e) => setCapital(e.target.value)} />
        </label>
        <label>Fee per trade (%)
          <input className="input" type="number" min="0" max="5" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
        </label>

        <button className="btn btn-primary span-2" disabled={running}>{running ? "Running..." : "Run backtest"}</button>
      </form>
    </>
  );
}

export default NewBacktest;