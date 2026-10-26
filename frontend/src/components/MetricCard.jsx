function MetricCard({ label, value, tone = "", sub }) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className={`metric-value mono ${tone}`}>{value}</p>
      {sub && <p className="metric-sub muted">{sub}</p>}
    </div>
  );
}

export default MetricCard;