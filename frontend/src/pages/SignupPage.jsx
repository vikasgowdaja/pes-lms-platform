import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

export const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate",
    adminCode: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleFromUrl = searchParams.get("role");
    const adminCodeFromUrl = searchParams.get("adminCode");

    if (roleFromUrl || adminCodeFromUrl) {
      setForm((prev) => ({
        ...prev,
        role: roleFromUrl === "admin" ? "admin" : prev.role,
        adminCode: adminCodeFromUrl || prev.adminCode
      }));
    }
  }, [searchParams]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.signup(form);
      login(data);
      navigate(data.user.role === "admin" ? "/admin" : "/candidate");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <h1>Create Account</h1>
      <form onSubmit={onSubmit} className="form-grid">
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
        >
          <option value="candidate">Candidate</option>
          <option value="admin">Admin</option>
        </select>
        {form.role === "candidate" ? (
          <input
            placeholder="Admin registration code"
            value={form.adminCode}
            onChange={(e) => setForm((prev) => ({ ...prev, adminCode: e.target.value.toUpperCase() }))}
            required
          />
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn" disabled={loading}>
          {loading ? "Please wait..." : "Signup"}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
};
