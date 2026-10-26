import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // quick client-side checks; the server validates again
    if (form.name.trim().length < 2) return setError("Name must be at least 2 characters");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError("Password must contain a letter and a number");
    }

    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err, "Could not create account"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="logo big">QUANT<span>LAB</span></div>
        <h2>Create account</h2>
        {error && <p className="error-text">{error}</p>}
        <input className="input" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
        <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input" type="password" name="password" placeholder="Password (8+ chars, letter and number)" value={form.password} onChange={handleChange} required />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        <p className="muted small">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;