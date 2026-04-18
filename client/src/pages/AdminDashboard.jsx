import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`chip ${active ? "active" : ""}`}>
      {children}
    </button>
  );
}

const STATUS_COLORS = {
  pending: { bg: "#fff8ec", color: "#c98240" },
  replied: { bg: "#ecf8f0", color: "#2a7d4a" },
  closed: { bg: "#f0f0f0", color: "#7b8193" },
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("properties");
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function loadCurrentTab() {
    try {
      setLoading(true);
      setError("");
      if (tab === "properties") {
        const res = await authFetch("/api/admin/properties");
        if (!res.ok) throw new Error("Failed to load properties");
        setProperties(await res.json());
      } else if (tab === "agents") {
        const res = await authFetch("/api/admin/agents");
        if (!res.ok) throw new Error("Failed to load agents");
        setAgents(await res.json());
      } else if (tab === "blog") {
        const res = await authFetch("/api/admin/blog-posts");
        if (!res.ok) throw new Error("Failed to load blog posts");
        setPosts(await res.json());
      } else if (tab === "inquiries") {
        const res = await authFetch("/api/admin/inquiries");
        if (!res.ok) throw new Error("Failed to load inquiries");
        setInquiries(await res.json());
      } else if (tab === "transactions") {
        const res = await authFetch("/api/admin/transactions");
        if (!res.ok) throw new Error("Failed to load transactions");
        setTransactions(await res.json());
      }
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleCreateProperty(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      title: form.title.value,
      address: form.address.value,
      city: form.city.value,
      property_type: form.property_type.value,
      description: form.description.value,
      price: form.price.value,
      bedrooms: form.bedrooms.value,
      bathrooms: form.bathrooms.value,
      size_sqft: form.size_sqft.value,
      status: form.status.value,
      image_url: form.image_url.value,
    };
    const res = await authFetch("/api/admin/properties", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) { alert("Failed to create property"); return; }
    form.reset();
    loadCurrentTab();
  }

  async function handleDeleteProperty(id) {
    if (!confirm("Delete this property?")) return;
    await authFetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    loadCurrentTab();
  }

  async function handleCreateAgent(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      full_name: form.full_name.value,
      title: form.title.value,
      location: form.location.value,
      bio: form.bio.value,
      avatar_initials: form.avatar_initials.value,
      closed_deals: form.closed_deals.value,
      years_experience: form.years_experience.value,
      rating: form.rating.value,
    };
    const res = await authFetch("/api/admin/agents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) { alert("Failed to create agent"); return; }
    form.reset();
    loadCurrentTab();
  }

  async function handleDeleteAgent(id) {
    if (!confirm("Delete this agent?")) return;
    await authFetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    loadCurrentTab();
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      category: form.category.value,
      read_time_minutes: form.read_time_minutes.value,
      title: form.title.value,
      excerpt: form.excerpt.value,
    };
    const res = await authFetch("/api/admin/blog-posts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) { alert("Failed to create blog post"); return; }
    form.reset();
    loadCurrentTab();
  }

  async function handleDeletePost(id) {
    if (!confirm("Delete this post?")) return;
    await authFetch(`/api/admin/blog-posts/${id}`, { method: "DELETE" });
    loadCurrentTab();
  }

  async function updateInquiryStatus(id, status) {
    await authFetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    loadCurrentTab();
  }

  async function updateTransactionStatus(id, status) {
    await authFetch(`/api/admin/transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    loadCurrentTab();
  }

  return (
    <main className="page">
      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Admin</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-subtitle">Manage properties, agents, blog posts, and inquiries.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Content</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <TabButton active={tab === "properties"} onClick={() => setTab("properties")}>Properties</TabButton>
            <TabButton active={tab === "agents"} onClick={() => setTab("agents")}>Agents</TabButton>
            <TabButton active={tab === "blog"} onClick={() => setTab("blog")}>Blog</TabButton>
            <TabButton active={tab === "inquiries"} onClick={() => setTab("inquiries")}>
              Inquiries {inquiries.length > 0 ? `(${inquiries.length})` : ""}
            </TabButton>
            <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")}>
              Transactions {transactions.length > 0 ? `(${transactions.length})` : ""}
            </TabButton>
          </div>
        </div>

        {loading && <div className="section-panel">Loading…</div>}
        {!loading && error && <div className="section-panel">{error}</div>}

        {/* ── Properties ── */}
        {!loading && !error && tab === "properties" && (
          <>
            <form className="section-panel" onSubmit={handleCreateProperty}>
              <h3>Add property</h3>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Title</label>
                  <input name="title" className="input" required />
                </div>
                <div className="form-row">
                  <label className="field-label">Address</label>
                  <input name="address" className="input" required />
                </div>
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">City</label>
                  <input name="city" className="input" placeholder="e.g. New York" />
                </div>
                <div className="form-row">
                  <label className="field-label">Property Type</label>
                  <select name="property_type" className="select">
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Price</label>
                  <input name="price" type="number" className="input" />
                </div>
                <div className="form-row">
                  <label className="field-label">Status</label>
                  <select name="status" className="select">
                    <option value="for_sale">For sale</option>
                    <option value="for_rent">For rent</option>
                  </select>
                </div>
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Bedrooms</label>
                  <input name="bedrooms" type="number" className="input" />
                </div>
                <div className="form-row">
                  <label className="field-label">Bathrooms</label>
                  <input name="bathrooms" type="number" className="input" />
                </div>
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Size (sqft)</label>
                  <input name="size_sqft" type="number" className="input" />
                </div>
                <div className="form-row">
                  <label className="field-label">Image URL</label>
                  <input name="image_url" className="input" />
                </div>
              </div>
              <div className="form-row">
                <label className="field-label">Description</label>
                <textarea name="description" className="textarea" rows="3" />
              </div>
              <button className="btn btn-primary" type="submit">Create property</button>
            </form>

            <div className="section-panel">
              <h3>Existing properties ({properties.length})</h3>
              <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                {properties.map((p) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                    <span>
                      <strong>{p.title}</strong> — {p.city} · ${Number(p.price).toLocaleString()} · {p.status} · {p.property_type}
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#c0392b" }}
                      onClick={() => handleDeleteProperty(p.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ── Agents ── */}
        {!loading && !error && tab === "agents" && (
          <>
            <form className="section-panel" onSubmit={handleCreateAgent}>
              <h3>Add agent</h3>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Full name</label>
                  <input name="full_name" className="input" required />
                </div>
                <div className="form-row">
                  <label className="field-label">Title</label>
                  <input name="title" className="input" />
                </div>
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Location</label>
                  <input name="location" className="input" />
                </div>
                <div className="form-row">
                  <label className="field-label">Initials</label>
                  <input name="avatar_initials" className="input" maxLength={4} />
                </div>
              </div>
              <div className="form-row">
                <label className="field-label">Bio</label>
                <textarea name="bio" className="textarea" rows="3" />
              </div>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Closed deals</label>
                  <input name="closed_deals" type="number" className="input" />
                </div>
                <div className="form-row">
                  <label className="field-label">Years experience</label>
                  <input name="years_experience" type="number" className="input" />
                </div>
              </div>
              <div className="form-row">
                <label className="field-label">Rating (0–5)</label>
                <input name="rating" type="number" step="0.1" min="0" max="5" className="input" />
              </div>
              <button className="btn btn-primary" type="submit">Create agent</button>
            </form>

            <div className="section-panel">
              <h3>Existing agents ({agents.length})</h3>
              <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                {agents.map((a) => (
                  <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                    <span>
                      <strong>{a.full_name}</strong> — {a.title} · {a.location} · ★{a.rating}
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#c0392b" }}
                      onClick={() => handleDeleteAgent(a.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ── Blog ── */}
        {!loading && !error && tab === "blog" && (
          <>
            <form className="section-panel" onSubmit={handleCreatePost}>
              <h3>Add blog post</h3>
              <div className="two-cols">
                <div className="form-row">
                  <label className="field-label">Category</label>
                  <input name="category" className="input" required />
                </div>
                <div className="form-row">
                  <label className="field-label">Read time (minutes)</label>
                  <input name="read_time_minutes" type="number" className="input" />
                </div>
              </div>
              <div className="form-row">
                <label className="field-label">Title</label>
                <input name="title" className="input" required />
              </div>
              <div className="form-row">
                <label className="field-label">Excerpt</label>
                <textarea name="excerpt" className="textarea" rows="3" />
              </div>
              <button className="btn btn-primary" type="submit">Create post</button>
            </form>

            <div className="section-panel">
              <h3>Existing posts ({posts.length})</h3>
              <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                {posts.map((p) => (
                  <li key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                    <span>
                      <strong>{p.title}</strong> — {p.category} · {p.read_time_minutes} min
                    </span>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#c0392b" }}
                      onClick={() => handleDeletePost(p.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* ── Transactions ── */}
        {!loading && !error && tab === "transactions" && (
          <div className="section-panel">
            <h3>Buyer transactions ({transactions.length})</h3>
            {transactions.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No transactions yet.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
              {transactions.map((tx) => {
                const colors = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
                return (
                  <div key={tx.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{tx.property_title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{tx.property_city} · ${Number(tx.property_price).toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ background: "var(--accent-soft)", color: "var(--accent-dark)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>
                          {tx.transaction_type}
                        </span>
                        <span style={{ background: colors.bg, color: colors.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>
                          {tx.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: "0.8rem", flexWrap: "wrap" }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Buyer: </span><strong>{tx.buyer_name}</strong> ({tx.buyer_email})</div>
                      <div><span style={{ color: "var(--text-muted)" }}>Agent: </span><strong>{tx.agent_name}</strong> — {tx.agent_title}</div>
                    </div>

                    {tx.notes && (
                      <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>Note: {tx.notes}</p>
                    )}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "6px 0 10px" }}>
                      Submitted {new Date(tx.created_at).toLocaleDateString()}
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {tx.status === "pending" && (
                        <button className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateTransactionStatus(tx.id, "approved")}>
                          Approve
                        </button>
                      )}
                      {tx.status === "approved" && (
                        <button className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateTransactionStatus(tx.id, "completed")}>
                          Mark completed
                        </button>
                      )}
                      {tx.status !== "cancelled" && tx.status !== "completed" && (
                        <button className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "5px 12px", color: "#c0392b" }} onClick={() => updateTransactionStatus(tx.id, "cancelled")}>
                          Cancel
                        </button>
                      )}
                      {(tx.status === "cancelled" || tx.status === "completed") && (
                        <button className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateTransactionStatus(tx.id, "pending")}>
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Inquiries ── */}
        {!loading && !error && tab === "inquiries" && (
          <div className="section-panel">
            <h3>Buyer inquiries ({inquiries.length})</h3>
            {inquiries.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No inquiries yet.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {inquiries.map((inq) => {
                const colors = STATUS_COLORS[inq.status] || STATUS_COLORS.pending;
                return (
                  <div key={inq.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{inq.property_title}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{inq.property_city}</div>
                      </div>
                      <span style={{ background: colors.bg, color: colors.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>
                        {inq.status}
                      </span>
                    </div>
                    <p style={{ margin: "8px 0 4px", fontSize: "0.83rem" }}>{inq.message}</p>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 10 }}>
                      From: <strong>{inq.buyer_name}</strong> ({inq.buyer_email}) · {new Date(inq.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {inq.status !== "replied" && (
                        <button className="btn btn-primary" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateInquiryStatus(inq.id, "replied")}>
                          Mark replied
                        </button>
                      )}
                      {inq.status !== "closed" && (
                        <button className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateInquiryStatus(inq.id, "closed")}>
                          Close
                        </button>
                      )}
                      {inq.status !== "pending" && (
                        <button className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "5px 12px" }} onClick={() => updateInquiryStatus(inq.id, "pending")}>
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
