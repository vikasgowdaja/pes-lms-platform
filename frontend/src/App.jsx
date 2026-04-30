import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CandidateDashboard } from "./pages/CandidateDashboard";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TestTakingPage } from "./pages/TestTakingPage";

const TopNav = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-nav">
      <div className="brand">PES Assess</div>
      <nav>
        {isAuthenticated ? (
          <>
            <span className="user-pill">{user.name} ({user.role})</span>
            <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </nav>
    </header>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="center-state">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === "admin" ? "/admin" : "/candidate"} replace />;
};

export default function App() {
  return (
    <div className="app-root">
      <TopNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate"
            element={
              <ProtectedRoute role="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidate/tests/:testId"
            element={
              <ProtectedRoute role="candidate">
                <TestTakingPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
