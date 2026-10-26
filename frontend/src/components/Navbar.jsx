import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="nav">
      <span className="logo">
        QUANT<span>LAB</span>
      </span>
      <div className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/datasets">Datasets</NavLink>
        <NavLink to="/backtests">Backtests</NavLink>
        <NavLink to="/backtests/new" className="nav-cta">+ New Backtest</NavLink>
        <span className="muted nav-user">{user.name}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;