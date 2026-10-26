import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { Loading, ErrorBox, Empty } from "../components/Status";
import { fmtDate } from "../utils/format";

// Reads a Yahoo-Finance-style CSV and returns [{ date, close }].
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header row and data rows");

  const clean = (s) => s.trim().replace(/"/g, "");
  const header = lines[0].split(",").map((h) => clean(h).toLowerCase());
  const dateIdx = header.indexOf("date");
  let closeIdx = header.indexOf("close");
  if (closeIdx === -1) closeIdx = header.findIndex((h) => h.includes("close"));
  if (dateIdx === -1 || closeIdx === -1) throw new Error('CSV must have "Date" and "Close" columns');

  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map(clean);
    const close = Number(cols[closeIdx]);
    if (!Number.isFinite(close)) throw new Error(`Row ${i + 2}: invalid close value`);
    return { date: (cols[dateIdx] || "").slice(0, 10), close };
  });
}

function Datasets() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("generate");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const [gen, setGen] = useState({ name: "", days: 750, startPrice: 100, drift: 0.1, vol: 0.2, seed: "" });
  const [upName, setUpName] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/datasets");
      setDatasets(res.data.datasets);
    } catch (err) {
      setError(errorMessage(err, "Could not load datasets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      const body = {
        name: gen.name,
        days: Number(gen.days),
        startPrice: Number(gen.startPrice),
        drift: Number(gen.drift),
        vol: Number(gen.vol),
      };
      if (gen.seed !== "") body.seed = Number(gen.seed);
      await api.post("/datasets/generate", body);
      setGen({ ...gen, name: "", seed: "" });
      await load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!file) return setFormError("Choose a CSV file first");
    setBusy(true);
    try {
      const candles = parseCsv(await file.text());
      await api.post("/datasets/upload", { name: upName, candles });
      setUpName("");
      setFile(null);
      e.target.reset();
      await load();
    } catch (err) {
      setFormError(err.response ? errorMessage(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dataset? Saved backtests are kept.")) return;
    try {
      await api.delete(`/datasets/${id}`);
      setDatasets((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const setG = (e) => setGen({ ...gen, [e.target.name]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Datasets</h1>
        <p className="muted">Price series to test strategies on: simulated markets or your own CSV.</p>
      </div>

      <div className="panel">
        <div className="tabs">
          <button className={tab === "generate" ? "active" : ""} onClick={() => setTab("generate")}>Generate (GBM)</button>
          <button className={tab === "upload" ? "active" : ""} onClick={() => setTab("upload")}>Upload CSV</button>
        </div>

        {formError && <p className="error-text">{formError}</p>}

        {tab === "generate" ? (
          <form className="form-grid" onSubmit={handleGenerate}>
            <label className="span-2">Name<input className="input" name="name" value={gen.name} onChange={setG} placeholder="e.g. Bull market 2020" required /></label>
            <label>Trading days<input className="input" type="number" name="days" value={gen.days} onChange={setG} min="60" max="3000" /></label>
            <label>Start price<input className="input" type="number" name="startPrice" value={gen.startPrice} onChange={setG} min="1" step="any" /></label>
            <label>Annual drift (0.1 = 10%)<input className="input" type="number" name="drift" value={gen.drift} onChange={setG} step="0.01" /></label>
            <label>Annual volatility (0.2 = 20%)<input className="input" type="number" name="vol" value={gen.vol} onChange={setG} step="0.01" /></label>
            <label className="span-2">Seed (optional, same seed gives the same market)<input className="input" type="number" name="seed" value={gen.seed} onChange={setG} placeholder="random" /></label>
            <button className="btn btn-primary span-2" disabled={busy}>{busy ? "Generating..." : "Generate dataset"}</button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleUpload}>
            <label className="span-2">Name<input className="input" value={upName} onChange={(e) => setUpName(e.target.value)} placeholder="e.g. AAPL daily" required /></label>
            <label className="span-2">CSV file (needs Date and Close columns, 60+ rows)
              <input className="input" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            </label>
            <button className="btn btn-primary span-2" disabled={busy}>{busy ? "Uploading..." : "Upload dataset"}</button>
          </form>
        )}
      </div>

      <h2 className="section">Your datasets</h2>
      {loading && <Loading text="Loading datasets..." />}
      {!loading && error && <ErrorBox message={error} onRetry={load} />}
      {!loading && !error && datasets.length === 0 && (
        <Empty title="No datasets yet" text="Generate or upload one above." />
      )}
      {!loading && !error && datasets.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Source</th><th>Points</th><th>Range</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {datasets.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td><span className="pill">{d.source}</span></td>
                  <td className="mono">{d.points}</td>
                  <td className="muted">{d.startDate} → {d.endDate}</td>
                  <td className="muted">{fmtDate(d.createdAt)}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Datasets;