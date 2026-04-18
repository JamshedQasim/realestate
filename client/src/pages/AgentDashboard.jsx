import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_COLORS = {
  pending:   { bg: "#fff8ec", color: "#c98240" },
  approved:  { bg: "#ecf8f0", color: "#2a7d4a" },
  completed: { bg: "#eaf0ff", color: "#1a4fbd" },
  cancelled: { bg: "#fff0f0", color: "#c0392b" },
  confirmed: { bg: "#ecf8f0", color: "#2a7d4a" },
};

export default function AgentDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("transactions");

  const [transactions, setTransactions] = useState([]);
  const [viewings, setViewings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/agent/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/agent/viewings",     { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([txs, views]) => {
      setTransactions(Array.isArray(txs)   ? txs   : []);
      setViewings(Array.isArray(views) ? views : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  async function updateTxStatus(id, status) {
    setUpdating(id + "-tx");
    await fetch(`/api/agent/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setUpdating(null);
  }

  async function updateViewingStatus(id, status) {
    setUpdating(id + "-v");
    await fetch(`/api/agent/viewings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setViewings(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    setUpdating(null);
  }

  // Commission stats (3% per completed deal)
  const COMMISSION_RATE = 0.03;
  const completedTx = transactions.filter(t => t.status === "completed");
  const totalCommission = completedTx.reduce((s, t) => s + Number(t.property_price || 0) * COMMISSION_RATE, 0);
  const pendingTx   = transactions.filter(t => t.status === "pending").length;
  const pendingViews = viewings.filter(v => v.status === "pending").length;

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <h1 className="page-title">Agent Dashboard</h1>
          <p className="page-subtitle">Manage transactions, viewings, and track your commission.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { value: transactions.length,   label: "Total deals" },
            { value: pendingTx,             label: "Pending approval" },
            { value: completedTx.length,    label: "Completed deals" },
            { value: `$${Math.round(totalCommission).toLocaleString()}`, label: "Commission earned (3%)" },
            { value: pendingViews,          label: "Viewing requests" },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <span className="stat-value" style={{ fontSize: s.value.toString().length > 6 ? "1.2rem" : undefined }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            ["transactions", `Deals (${transactions.length})`],
            ["viewings",     `Viewings (${viewings.length})`],
            ["commission",   `Commission`],
          ].map(([key, label]) => (
            <button key={key} className={`chip ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {loading && <div className="section-panel">Loading…</div>}

        {/* ── Deals tab ── */}
        {!loading && tab === "transactions" && (
          transactions.length === 0
            ? <div className="section-panel"><p style={{ margin: 0 }}>No deals assigned yet.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {transactions.map(tx => {
                  const c = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
                  const isBusy = updating === tx.id + "-tx";
                  return (
                    <div className="section-panel" key={tx.id} style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
                        {tx.property_image && (
                          <img src={tx.property_image} alt={tx.property_title} style={{ width: 86, height: 66, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{tx.property_title}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{tx.property_city} · ${Number(tx.property_price).toLocaleString()}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ background: "var(--accent-soft)", color: "var(--accent-dark)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{tx.transaction_type}</span>
                              <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{tx.status}</span>
                              {tx.payment_method && <span style={{ background: "var(--surface-soft)", color: "var(--text-muted)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", textTransform: "capitalize" }}>{tx.payment_method}</span>}
                            </div>
                          </div>

                          <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Buyer: {tx.buyer_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tx.buyer_email}</div>
                            {tx.notes && <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>Note: {tx.notes}</p>}
                          </div>

                          {/* Commission badge */}
                          {tx.status === "completed" && (
                            <div style={{ marginTop: 8, display: "inline-block", background: "#eaf0ff", color: "#1a4fbd", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600 }}>
                              💰 Commission: ${Math.round(Number(tx.property_price) * COMMISSION_RATE).toLocaleString()}
                            </div>
                          )}

                          {/* Action buttons */}
                          {tx.status === "pending" && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "6px 14px" }} disabled={isBusy} onClick={() => updateTxStatus(tx.id, "approved")}>
                                {isBusy ? "…" : "✓ Approve"}
                              </button>
                              <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", color: "#c0392b", borderColor: "#f5c6c6" }} disabled={isBusy} onClick={() => updateTxStatus(tx.id, "cancelled")}>
                                ✕ Cancel
                              </button>
                            </div>
                          )}
                          {tx.status === "approved" && (
                            <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "6px 14px", marginTop: 10 }} disabled={isBusy} onClick={() => updateTxStatus(tx.id, "completed")}>
                              {isBusy ? "…" : "🎉 Mark Completed"}
                            </button>
                          )}

                          <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
        )}

        {/* ── Viewings tab ── */}
        {!loading && tab === "viewings" && (
          viewings.length === 0
            ? <div className="section-panel"><p style={{ margin: 0 }}>No viewing requests yet.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {viewings.map(v => {
                  const c = STATUS_COLORS[v.status] || STATUS_COLORS.pending;
                  const isBusy = updating === v.id + "-v";
                  return (
                    <div className="section-panel" key={v.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{v.property_title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{v.property_address}, {v.property_city}</div>
                        </div>
                        <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{v.status}</span>
                      </div>
                      <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Buyer: {v.buyer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.buyer_email}</div>
                        <div style={{ marginTop: 6, fontSize: "0.85rem" }}>
                          📅 {new Date(v.scheduled_date).toLocaleDateString()} at {v.scheduled_time}
                        </div>
                        {v.notes && <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>Note: {v.notes}</p>}
                      </div>
                      {v.status === "pending" && (
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "6px 14px" }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "confirmed")}>
                            {isBusy ? "…" : "✓ Confirm"}
                          </button>
                          <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", color: "#c0392b", borderColor: "#f5c6c6" }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "cancelled")}>
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                      {v.status === "confirmed" && (
                        <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", marginTop: 10 }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "completed")}>
                          {isBusy ? "…" : "Mark as Done"}
                        </button>
                      )}
                      <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>Requested {new Date(v.created_at).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
        )}

        {/* ── Commission tab ── */}
        {!loading && tab === "commission" && (
          <div>
            <div className="section-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, #1a3a6b, #0c447c)", color: "#fff", border: "none" }}>
              <div style={{ fontSize: "0.8rem", opacity: 0.75, marginBottom: 4 }}>Total commission earned (3% per deal)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>${Math.round(totalCommission).toLocaleString()}</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 4 }}>{completedTx.length} completed deal{completedTx.length !== 1 ? "s" : ""}</div>
            </div>
            {completedTx.length === 0
              ? <div className="section-panel"><p style={{ margin: 0 }}>No completed deals yet.</p></div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {completedTx.map(tx => (
                    <div className="section-panel" key={tx.id} style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{tx.property_title}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tx.buyer_name} · {tx.transaction_type} · {new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sale price</div>
                        <div style={{ fontWeight: 700 }}>${Number(tx.property_price).toLocaleString()}</div>
                        <div style={{ fontSize: "0.75rem", color: "#1a4fbd", fontWeight: 600 }}>+${Math.round(Number(tx.property_price) * COMMISSION_RATE).toLocaleString()} commission</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </section>
    </main>
  );
}
