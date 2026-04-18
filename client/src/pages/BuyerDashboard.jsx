import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_COLORS = {
  pending:   { bg: "#fff8ec", color: "#c98240" },
  replied:   { bg: "#ecf8f0", color: "#2a7d4a" },
  approved:  { bg: "#ecf8f0", color: "#2a7d4a" },
  completed: { bg: "#eaf0ff", color: "#1a4fbd" },
  closed:    { bg: "#f0f0f0", color: "#7b8193" },
  cancelled: { bg: "#fff0f0", color: "#c0392b" },
};

export default function BuyerDashboard() {
  const { user, token } = useAuth();

  const [saved, setSaved]               = useState([]);
  const [inquiries, setInquiries]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [viewings, setViewings]         = useState([]);
  const [savedLoading, setSavedLoading]             = useState(true);
  const [inquiriesLoading, setInquiriesLoading]     = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [tab, setTab] = useState("transactions");

  useEffect(() => {
    if (!token) return;

    fetch("/api/buyer/saved-properties", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setSaved(Array.isArray(d) ? d : []))
      .catch(() => setSaved([])).finally(() => setSavedLoading(false));

    fetch("/api/buyer/inquiries", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setInquiries(Array.isArray(d) ? d : []))
      .catch(() => setInquiries([])).finally(() => setInquiriesLoading(false));

    fetch("/api/buyer/transactions", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setTransactions(Array.isArray(d) ? d : []))
      .catch(() => setTransactions([])).finally(() => setTransactionsLoading(false));

    fetch("/api/buyer/viewings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => setViewings(Array.isArray(d) ? d : []))
      .catch(() => setViewings([]));
  }, [token]);

  async function unsave(propertyId) {
    await fetch(`/api/buyer/saved-properties/${propertyId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setSaved((prev) => prev.filter((p) => p.id !== propertyId));
  }

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <h1 className="page-title">Welcome{user?.fullName ? `, ${user.fullName}` : ""}</h1>
          <p className="page-subtitle">Your transactions, saved homes, and inquiries.</p>
        </div>
        <Link to="/properties" className="btn btn-primary">Browse properties</Link>
      </section>

      {/* Stats */}
      <section className="section">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="stat-card">
            <span className="stat-value">{transactions.length}</span>
            <span className="stat-label">Requests sent</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{transactions.filter((t) => t.status === "approved" || t.status === "completed").length}</span>
            <span className="stat-label">Approved</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{saved.length}</span>
            <span className="stat-label">Saved homes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{inquiries.length}</span>
            <span className="stat-label">Inquiries</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{viewings.length}</span>
            <span className="stat-label">Viewings</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="section">
        <div className="section-header">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className={`chip ${tab === "transactions" ? "active" : ""}`} onClick={() => setTab("transactions")}>
              My Requests ({transactions.length})
            </button>
            <button className={`chip ${tab === "saved" ? "active" : ""}`} onClick={() => setTab("saved")}>
              Saved homes ({saved.length})
            </button>
            <button className={`chip ${tab === "inquiries" ? "active" : ""}`} onClick={() => setTab("inquiries")}>
              Inquiries ({inquiries.length})
            </button>
            <button className={`chip ${tab === "viewings" ? "active" : ""}`} onClick={() => setTab("viewings")}>
              Viewings ({viewings.length})
            </button>
          </div>
        </div>

        {/* ── Transactions tab ── */}
        {tab === "transactions" && (
          <>
            {transactionsLoading && <div className="section-panel">Loading requests…</div>}
            {!transactionsLoading && transactions.length === 0 && (
              <div className="section-panel">
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  No requests yet.{" "}
                  <Link to="/properties" style={{ color: "var(--accent)" }}>Browse properties</Link>
                  {" "}and click <strong>Buy</strong> or <strong>Rent</strong> to get started.
                </p>
              </div>
            )}
            {!transactionsLoading && transactions.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {transactions.map((tx) => {
                  const colors = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
                  return (
                    <div className="section-panel" key={tx.id} style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                        {tx.property_image && (
                          <img src={tx.property_image} alt={tx.property_title} style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                            <div>
                              <Link to={`/properties/${tx.property_id}`} style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)", textDecoration: "none" }}>
                                {tx.property_title}
                              </Link>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{tx.property_city} · ${Number(tx.property_price).toLocaleString()}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ background: "var(--accent-soft)", color: "var(--accent-dark)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>
                                {tx.transaction_type}
                              </span>
                              <span style={{ background: colors.bg, color: colors.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>
                                {tx.status}
                              </span>
                            </div>
                          </div>

                          {/* Agent info */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>
                              {tx.agent_initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{tx.agent_name}</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                {tx.agent_title} · ⭐{tx.agent_rating} · {tx.agent_experience} yrs exp · {tx.agent_closed_deals} deals
                              </div>
                            </div>
                          </div>

                          {tx.notes && (
                            <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              Note: {tx.notes}
                            </p>
                          )}
                          <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Submitted {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Saved homes tab ── */}
        {tab === "saved" && (
          <>
            {savedLoading && <div className="section-panel">Loading saved homes…</div>}
            {!savedLoading && saved.length === 0 && (
              <div className="section-panel">
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  No saved homes yet.{" "}
                  <Link to="/properties" style={{ color: "var(--accent)" }}>Browse properties</Link> and click ♡.
                </p>
              </div>
            )}
            {!savedLoading && saved.length > 0 && (
              <div className="cards-grid">
                {saved.map((p) => (
                  <article className="property-card" key={p.id}>
                    <Link to={`/properties/${p.id}`} className="card-link">
                      <div className="card-image-wrapper">
                        <span className="badge badge-status">{p.status === "for_rent" ? "For Rent" : "For Sale"}</span>
                        <button className="save-btn saved" title="Remove from saved" onClick={(e) => { e.preventDefault(); unsave(p.id); }}>♥</button>
                        <img src={p.image_url || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"} alt={p.title} className="card-image" />
                      </div>
                      <div className="card-body">
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <span className="badge" style={{ position: "static", background: "var(--accent-soft)", color: "var(--accent-dark)", fontSize: "0.7rem" }}>{p.property_type}</span>
                          <span className="badge" style={{ position: "static", background: "var(--surface-soft)", color: "var(--text-muted)", fontSize: "0.7rem" }}>{p.city}</span>
                        </div>
                        <h3 className="card-title">{p.title}</h3>
                        <p className="card-address">{p.address}</p>
                        <div className="card-meta">
                          <span>{p.size_sqft} sqft</span>
                          <span>{p.bedrooms} Beds</span>
                          <span>{p.bathrooms} Baths</span>
                        </div>
                        <div className="card-footer">
                          <div className="card-price">${Number(p.price).toLocaleString()}</div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Inquiries tab ── */}
        {tab === "inquiries" && (
          <>
            {inquiriesLoading && <div className="section-panel">Loading inquiries…</div>}
            {!inquiriesLoading && inquiries.length === 0 && (
              <div className="section-panel">
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  No inquiries yet. Open a property and use the Inquire button.
                </p>
              </div>
            )}
            {!inquiriesLoading && inquiries.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {inquiries.map((inq) => {
                  const colors = STATUS_COLORS[inq.status] || STATUS_COLORS.pending;
                  return (
                    <div className="section-panel" key={inq.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{inq.property_title}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{inq.property_address}, {inq.property_city}</div>
                        </div>
                        <span style={{ background: colors.bg, color: colors.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>{inq.status}</span>
                      </div>
                      <p style={{ margin: "10px 0 0", fontSize: "0.85rem" }}>{inq.message}</p>
                      <div style={{ marginTop: 6, fontSize: "0.75rem", color: "var(--text-muted)" }}>Sent {new Date(inq.created_at).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {/* ── Viewings tab ── */}
        {tab === "viewings" && (
          <>
            {viewings.length === 0 && (
              <div className="section-panel">
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  No viewings booked yet. Open a property and click <strong>📅 Book a viewing</strong>.
                </p>
              </div>
            )}
            {viewings.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {viewings.map((v) => {
                  const colors = STATUS_COLORS[v.status] || STATUS_COLORS.pending;
                  return (
                    <div className="section-panel" key={v.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                        {v.property_image && (
                          <img src={v.property_image} alt={v.property_title} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{v.property_title}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{v.property_city}</div>
                            </div>
                            <span style={{ background: colors.bg, color: colors.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{v.status}</span>
                          </div>
                          <div style={{ marginTop: 8, fontSize: "0.85rem" }}>
                            📅 {new Date(v.scheduled_date).toLocaleDateString()} at {v.scheduled_time}
                          </div>
                          {v.notes && <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{v.notes}</p>}
                          <div style={{ marginTop: 4, fontSize: "0.72rem", color: "var(--text-muted)" }}>Requested {new Date(v.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
