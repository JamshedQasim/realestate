import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Login failed");

      login(data.user, data.token);

      const role = data.user?.role;
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "agent") {
        navigate("/agent-dashboard");
      } else if (role === "seller") {
        navigate("/seller-dashboard");
      } else {
        navigate("/buyer-dashboard");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to manage saved homes, viewing requests, and alerts.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-row">
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="input"
              placeholder="Enter your password"
            />
          </div>

          <div className="form-row form-row-inline">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="section-link">
              Forgot password?
            </button>
          </div>

          {error ? <div className="section-panel">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          New to EstateHub?
          <button
            type="button"
            className="section-link"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </p>
      </section>
    </main>
  );
}

