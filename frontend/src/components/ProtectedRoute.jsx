import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import { Loading } from "./Status";

// Wraps every private page: waits for the session check, then allows or redirects.
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loading text="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

export default ProtectedRoute;