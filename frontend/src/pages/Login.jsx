import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err, "Could not sign in"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="logo big">QUANT<span>LAB</span></div>
        <h2>Sign in</h2>
        <p className="muted">Backtest strategies before risking capital.</p>
        {error && <p className="error-text">{error}</p>}
        <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <p className="muted small">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;