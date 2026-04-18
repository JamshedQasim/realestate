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

const EMPTY_FORM = {
  title: "", address: "", city: "", property_type: "apartment",
  description: "", price: "", bedrooms: "", bathrooms: "",
  size_sqft: "", status: "for_sale", image_url: "",
};

export default function SellerDashboard() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState("listings");

  const [properties, setProperties] = useState([]);
  const [inquiries, setInquiries]   = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/seller/properties",   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/seller/inquiries",    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/seller/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([props, inqs, txs]) => {
      setProperties(Array.isArray(props) ? props : []);
      setInquiries(Array.isArray(inqs)   ? inqs   : []);
      setTransactions(Array.isArray(txs) ? txs    : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  function handleFormChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function submitListing(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/seller/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to list property");
      const newProp = { ...form, id: data.id, created_at: new Date().toISOString() };
      setProperties(prev => [newProp, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProperty(id) {
    if (!window.confirm("Delete this property?")) return;
    await fetch(`/api/seller/properties/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setProperties(prev => prev.filter(p => p.id !== id));
  }

  const totalValue = properties.reduce((s, p) => s + Number(p.price || 0), 0);
  const pendingTx  = transactions.filter(t => t.status === "pending").length;
  const completedTx = transactions.filter(t => t.status === "completed").length;

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <h1 className="page-title">Welcome{user?.fullName ? `, ${user.fullName}` : ""}</h1>
          <p className="page-subtitle">Manage your listings, track inquiries and deal progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? "✕ Cancel" : "+ List a property"}
        </button>
      </section>

      {/* Stats */}
      <section className="section">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { value: properties.length, label: "Active listings" },
            { value: `$${totalValue.toLocaleString()}`, label: "Total listing value" },
            { value: inquiries.length, label: "Inquiries received" },
            { value: pendingTx, label: "Pending deals" },
            { value: completedTx, label: "Completed deals" },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <span className="stat-value" style={{ fontSize: s.value.toString().length > 6 ? "1.2rem" : undefined }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* New listing form */}
      {showForm && (
        <section className="section-panel" style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>List a new property</h3>
          <form onSubmit={submitListing}>
            <div className="two-cols">
              <div className="form-row">
                <label className="field-label">Title *</label>
                <input className="input" name="title" value={form.title} onChange={handleFormChange} required placeholder="e.g. Sunny 2BR Apartment" />
              </div>
              <div className="form-row">
                <label className="field-label">City *</label>
                <input className="input" name="city" value={form.city} onChange={handleFormChange} required placeholder="New York" />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 10 }}>
              <label className="field-label">Address *</label>
              <input className="input" name="address" value={form.address} onChange={handleFormChange} required placeholder="123 Main St" />
            </div>
            <div className="two-cols" style={{ marginTop: 10 }}>
              <div className="form-row">
                <label className="field-label">Type</label>
                <select className="select" name="property_type" value={form.property_type} onChange={handleFormChange}>
                  {["apartment","house","condo","studio","penthouse"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="field-label">Status</label>
                <select className="select" name="status" value={form.status} onChange={handleFormChange}>
                  <option value="for_sale">For Sale</option>
                  <option value="for_rent">For Rent</option>
                </select>
              </div>
            </div>
            <div className="two-cols" style={{ marginTop: 10 }}>
              <div className="form-row">
                <label className="field-label">Price ($)</label>
                <input className="input" name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="250000" />
              </div>
              <div className="form-row">
                <label className="field-label">Size (sqft)</label>
                <input className="input" name="size_sqft" type="number" value={form.size_sqft} onChange={handleFormChange} placeholder="1200" />
              </div>
            </div>
            <div className="two-cols" style={{ marginTop: 10 }}>
              <div className="form-row">
                <label className="field-label">Bedrooms</label>
                <input className="input" name="bedrooms" type="number" value={form.bedrooms} onChange={handleFormChange} placeholder="2" />
              </div>
              <div className="form-row">
                <label className="field-label">Bathrooms</label>
                <input className="input" name="bathrooms" type="number" value={form.bathrooms} onChange={handleFormChange} placeholder="1" />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 10 }}>
              <label className="field-label">Image URL (optional)</label>
              <input className="input" name="image_url" value={form.image_url} onChange={handleFormChange} placeholder="https://…" />
            </div>
            <div className="form-row" style={{ marginTop: 10 }}>
              <label className="field-label">Description (optional)</label>
              <textarea className="textarea" name="description" value={form.description} onChange={handleFormChange} rows={3} style={{ minHeight: 70 }} placeholder="Describe the property…" />
            </div>
            {formError && <p style={{ color: "#c0392b", fontSize: "0.85rem", margin: "8px 0 0" }}>{formError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Listing…" : "List property"}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {/* Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            ["listings",     `My Listings (${properties.length})`],
            ["inquiries",    `Inquiries (${inquiries.length})`],
            ["transactions", `Offers & Deals (${transactions.length})`],
          ].map(([key, label]) => (
            <button key={key} className={`chip ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {loading && <div className="section-panel">Loading…</div>}

        {/* ── Listings ── */}
        {!loading && tab === "listings" && (
          properties.length === 0
            ? <div className="section-panel"><p style={{ margin: 0 }}>No listings yet. Click <strong>+ List a property</strong> to get started.</p></div>
            : <div className="cards-grid">
                {properties.map(p => (
                  <article className="property-card" key={p.id}>
                    <Link to={`/properties/${p.id}`} className="card-link">
                      <div className="card-image-wrapper">
                        <span className="badge badge-status">{p.status === "for_rent" ? "For Rent" : "For Sale"}</span>
                        <img src={p.image_url || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"} alt={p.title} className="card-image" />
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{p.title}</h3>
                        <p className="card-address">{p.address}, {p.city}</p>
                        <div className="card-meta">
                          <span>{p.size_sqft} sqft</span>
                          <span>{p.bedrooms} Beds</span>
                          <span>{p.bathrooms} Baths</span>
                        </div>
                        <div className="card-footer">
                          <span className="card-price">${Number(p.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding: "0 16px 14px" }}>
                      <button className="btn btn-outline full-width" style={{ fontSize: "0.78rem", color: "#c0392b", borderColor: "#f5c6c6" }} onClick={() => deleteProperty(p.id)}>
                        🗑 Remove listing
                      </button>
                    </div>
                  </article>
                ))}
              </div>
        )}

        {/* ── Inquiries ── */}
        {!loading && tab === "inquiries" && (
          inquiries.length === 0
            ? <div className="section-panel"><p style={{ margin: 0 }}>No inquiries received yet.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {inquiries.map(inq => {
                  const c = STATUS_COLORS[inq.status] || STATUS_COLORS.pending;
                  return (
                    <div className="section-panel" key={inq.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{inq.property_title}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{inq.property_city}</div>
                        </div>
                        <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{inq.status}</span>
                      </div>
                      <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{inq.buyer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inq.buyer_email}</div>
                        <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>{inq.message}</p>
                      </div>
                      <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(inq.created_at).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
        )}

        {/* ── Transactions ── */}
        {!loading && tab === "transactions" && (
          transactions.length === 0
            ? <div className="section-panel"><p style={{ margin: 0 }}>No offers or deals yet.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {transactions.map(tx => {
                  const c = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
                  return (
                    <div className="section-panel" key={tx.id} style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{tx.property_title}</div>
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
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tx.buyer_email} · Agent: {tx.agent_name}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                  );
                })}
              </div>
        )}
      </section>
    </main>
  );
}
