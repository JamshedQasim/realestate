import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("buyer");

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fullName = form.fullName.value;
    const email = form.email.value;
    const password = form.password.value;

    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      // Registration succeeded; send user to login page
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">
          Save favorite homes, track viewings, and receive alerts.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-row">
            <label className="field-label" htmlFor="register-name">
              Full name
            </label>
            <input
              id="register-name"
              name="fullName"
              type="text"
              className="input"
              placeholder="Jane Doe"
            />
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              className="input"
              placeholder="Create a strong password"
              required
            />
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="register-role">
              I am a
            </label>
            <select
              id="register-role"
              className="select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          {error ? <div className="section-panel">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

