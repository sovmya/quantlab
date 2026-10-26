// Reusable loading / error / empty states, used by every page.
export function Loading({ text = "Loading..." }) {
  return <p className="state muted">{text}</p>;
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state">
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, text, children }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      {children}
    </div>
  );
}