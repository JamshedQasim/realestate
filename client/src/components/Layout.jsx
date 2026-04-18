import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
      end={to === "/"}
    >
      {children}
    </NavLink>
  );
}

function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!token) return;
    function load() {
      fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setNotifications(Array.isArray(d) ? d : [])).catch(() => {});
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [token]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  async function markRead(id) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }

  const TYPE_ICONS = { transaction: "💼", viewing: "📅", message: "💬" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", padding: "6px 12px", cursor: "pointer", fontSize: "1rem", position: "relative", display: "flex", alignItems: "center", gap: 4 }}
      >
        🔔
        {unread > 0 && (
          <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "50%", fontSize: "0.65rem", fontWeight: 700, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "0 24px 60px rgba(15,23,42,0.18)", zIndex: 200, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "transparent", border: "none", fontSize: "0.75rem", color: "var(--accent-dark)", cursor: "pointer", fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto" }}>
            {notifications.length === 0 && (
              <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No notifications yet</div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: n.is_read ? "transparent" : "var(--accent-soft)", transition: "background 0.15s" }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{TYPE_ICONS[n.type] || "📌"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: "0.85rem" }}>{n.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith("/login");
  const navigate = useNavigate();
  const { user, token, logout: authLogout } = useAuth();

  const isLoggedIn = !!user;
  const role = user?.role || "";
  const displayName = user?.fullName || user?.email || "";

  function goToDashboard() {
    if (!role) return;
    if (role === "admin") navigate("/admin-dashboard");
    else if (role === "agent") navigate("/agent-dashboard");
    else if (role === "seller") navigate("/seller-dashboard");
    else navigate("/buyer-dashboard");
  }

  function logout() {
    authLogout();
    navigate("/login");
  }

  return (
    <>
      <header className="main-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-logo">EH</div>
            <div className="brand-text">
              <span className="brand-name">EstateHub</span>
              <span className="brand-tagline">Find your next home</span>
            </div>
          </div>
          <nav className="main-nav">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/properties">Properties</NavItem>
            <NavItem to="/agents">Agents</NavItem>
            <NavItem to="/services">Services</NavItem>
            <NavItem to="/blog">Blog</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </nav>
          {!isAuthRoute && !isLoggedIn && (
            <NavLink to="/login" className="btn btn-login">Login</NavLink>
          )}
          {!isAuthRoute && isLoggedIn && (
            <>
              <NotificationBell token={token} />
              <button type="button" className="btn btn-login" onClick={goToDashboard}>My dashboard</button>
              <button type="button" className="btn btn-login" onClick={logout}>{displayName} · Logout</button>
            </>
          )}
        </div>
      </header>
      <Outlet />
    </>
  );
}
