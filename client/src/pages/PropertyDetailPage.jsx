import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Step indicator — 4 steps
function Steps({ current }) {
  const steps = ["Save", "Agent", "Confirm", "Payment"];
  return (
    <div className="tx-steps">
      {steps.map((label, i) => (
        <div key={label} className={`tx-step ${i + 1 <= current ? "done" : ""} ${i + 1 === current ? "active" : ""}`}>
          <div className="tx-step-dot">{i + 1 <= current - 1 ? "✓" : i + 1}</div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// Single agent card used inside the selection list
function AgentCard({ agent, selected, onSelect }) {
  return (
    <div
      className={`agent-select-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(agent)}
    >
      <div className="agent-select-avatar">{agent.avatar_initials || "AG"}</div>
      <div className="agent-select-info">
        <div className="agent-select-name">{agent.full_name}</div>
        <div className="agent-select-role">{agent.title}</div>
        <div className="agent-select-stats">
          <span>⭐ {agent.rating ?? "—"}</span>
          <span>{agent.years_experience} yrs exp</span>
          <span>{agent.closed_deals} deals</span>
          <span>📍 {agent.location}</span>
        </div>
      </div>
      <div className={`agent-select-radio ${selected ? "checked" : ""}`} />
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, authLoading } = useAuth();
  const isBuyer = user?.role === "buyer";

  // property
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // save
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // flow steps: 1=idle, 2=pick agent, 3=confirm, 4=payment
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [txType, setTxType] = useState("purchase");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txDone, setTxDone] = useState(false);

  // viewing booking
  const [viewDate, setViewDate]   = useState("");
  const [viewTime, setViewTime]   = useState("10:00");
  const [viewNote, setViewNote]   = useState("");
  const [viewDone, setViewDone]   = useState(false);
  const [viewSubmitting, setViewSubmitting] = useState(false);

  async function submitViewing(e) {
    e.preventDefault();
    setViewSubmitting(true);
    try {
      const res = await fetch("/api/buyer/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: id, scheduled_date: viewDate, scheduled_time: viewTime, notes: viewNote }),
      });
      if (res.ok) { setViewDone(true); }
      else alert("Failed to schedule viewing, please try again.");
    } finally { setViewSubmitting(false); }
  }

  // payment step
  const [payMethod, setPayMethod] = useState("cash");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // load property
  useEffect(() => {
    fetch(`/api/properties/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Property not found"); return r.json(); })
      .then(setProperty)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // check saved
  useEffect(() => {
    if (!isBuyer || !token) return;
    fetch("/api/buyer/saved-ids", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((ids) => setSaved(ids.includes(Number(id))))
      .catch(() => {});
  }, [isBuyer, token, id]);

  async function toggleSave() {
    if (!isBuyer) return;
    setSaveLoading(true);
    if (saved) {
      await fetch(`/api/buyer/saved-properties/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setSaved(false);
    } else {
      await fetch("/api/buyer/saved-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: id }),
      });
      setSaved(true);
    }
    setSaveLoading(false);
  }

  // step 2: load agents
  async function goPickAgent() {
    setStep(2);
    setAgentsLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch { setAgents([]); }
    finally { setAgentsLoading(false); }
  }

  // step 3: confirm details
  function goConfirm(agent) {
    setSelectedAgent(agent);
    setStep(3);
  }

  // step 4: go to payment after confirming details
  function goPayment(e) {
    e.preventDefault();
    setStep(4);
  }

  // card number formatting: "1234 5678 9012 3456"
  function handleCardNumber(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  }

  // expiry formatting: "MM/YY"
  function handleExpiry(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(digits.slice(0, 2) + "/" + digits.slice(2));
    } else {
      setCardExpiry(digits);
    }
  }

  // final submit — called from payment step
  async function submitTransaction(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/buyer/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          property_id: id,
          agent_id: selectedAgent.id,
          transaction_type: txType,
          notes,
          payment_method: payMethod,
        }),
      });
      if (res.ok) { setTxDone(true); setStep(1); }
      else alert("Submission failed, please try again.");
    } finally { setSubmitting(false); }
  }

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) return <main className="page"><div className="section-panel">Loading property…</div></main>;
  if (error || !property) return (
    <main className="page">
      <div className="section-panel">
        <p>{error || "Property not found."}</p>
        <Link to="/properties" className="btn btn-primary" style={{ marginTop: 12, display: "inline-block" }}>Back to properties</Link>
      </div>
    </main>
  );

  const isRent = property.status === "for_rent";

  return (
    <main className="page">
      {/* Breadcrumb */}
      <section className="breadcrumb">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">›</span>
        <Link to="/properties" className="breadcrumb-link">Properties</Link>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{property.title}</span>
      </section>

      {/* Hero image */}
      <div className="detail-hero">
        <img src={property.image_url || "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200"} alt={property.title} className="detail-hero-img" />
        <span className="badge badge-status detail-badge">{isRent ? "For Rent" : "For Sale"}</span>
      </div>

      <div className="detail-layout">
        {/* ── Left: info ── */}
        <div className="detail-main">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <span className="badge" style={{ position: "static", background: "var(--accent-soft)", color: "var(--accent-dark)", fontSize: "0.75rem" }}>{property.property_type}</span>
            <span className="badge" style={{ position: "static", background: "var(--surface-soft)", color: "var(--text-muted)", fontSize: "0.75rem" }}>{property.city}</span>
          </div>
          <h1 className="detail-title">{property.title}</h1>
          <p className="detail-address">{property.address}, {property.city}</p>

          <div className="detail-stats">
            <div className="detail-stat"><span className="detail-stat-value">{property.bedrooms}</span><span className="detail-stat-label">Bedrooms</span></div>
            <div className="detail-stat"><span className="detail-stat-value">{property.bathrooms}</span><span className="detail-stat-label">Bathrooms</span></div>
            <div className="detail-stat"><span className="detail-stat-value">{property.size_sqft}</span><span className="detail-stat-label">Sq Ft</span></div>
          </div>

          {property.description && (
            <div className="section-panel" style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>About this property</h3>
              <p style={{ margin: 0, lineHeight: 1.7, color: "var(--text-muted)", fontSize: "0.9rem" }}>{property.description}</p>
            </div>
          )}

          <div className="section-panel" style={{ marginTop: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem" }}>Property details</h3>
            <div className="detail-grid">
              {[["Type", property.property_type], ["Status", isRent ? "For Rent" : "For Sale"], ["City", property.city], ["Address", property.address], ["Bedrooms", property.bedrooms], ["Bathrooms", property.bathrooms], ["Size", `${property.size_sqft} sqft`], ["Price", `$${Number(property.price).toLocaleString()}`]].map(([k, v]) => (
                <div className="detail-row" key={k}><span>{k}</span><strong style={{ textTransform: k === "Type" ? "capitalize" : "none" }}>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: action card ── */}
        <div className="detail-sidebar">
          <div className="section-panel detail-action-card">

            {authLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading…</div>
            ) : !isBuyer ? (
              /* Not a buyer */
              <div style={{ textAlign: "center" }}>
                <div className="detail-price">${Number(property.price).toLocaleString()}</div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "8px 0 16px" }}>
                  {user ? "Only buyers can purchase or rent properties." : "Register as a buyer to save this property and contact an agent."}
                </p>
                {!user && <>
                  <Link to="/register" className="btn btn-primary full-width">Register as buyer</Link>
                  <Link to="/login" className="btn btn-outline full-width" style={{ marginTop: 8, display: "block" }}>Log in</Link>
                </>}
              </div>
            ) : txDone ? (
              /* Success screen */
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
                <h3 style={{ margin: "0 0 8px" }}>
                  {payMethod === "card" ? "Payment confirmed!" : "Request submitted!"}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 6px" }}>
                  Agent <strong>{selectedAgent?.full_name}</strong> will contact you shortly.
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
                  Payment: <strong style={{ textTransform: "capitalize" }}>{payMethod}</strong>
                </p>
                <Link to="/buyer-dashboard" className="btn btn-primary full-width">View my transactions</Link>
                <button className="btn btn-outline full-width" style={{ marginTop: 8 }} onClick={() => { setTxDone(false); setStep(1); setSelectedAgent(null); setPayMethod("cash"); setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv(""); }}>
                  Submit another request
                </button>
              </div>
            ) : (
              /* Buyer flow */
              <>
                <div className="detail-price">${Number(property.price).toLocaleString()}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 16 }}>{isRent ? "per month" : "asking price"}</div>

                <Steps current={step} />

                {/* ── Step 1: save + start ── */}
                {step === 1 && (
                  <>
                    <button className={`btn full-width ${saved ? "btn-outline" : "btn-primary"}`} onClick={toggleSave} disabled={saveLoading} style={{ marginBottom: 10 }}>
                      {saveLoading ? "…" : saved ? "♥ Saved" : "♡ Save this home"}
                    </button>
                    <button className="btn btn-primary full-width" onClick={goPickAgent} style={{ marginBottom: 8 }}>
                      {isRent ? "Rent this property" : "Buy this property"} →
                    </button>
                    <button className="btn btn-outline full-width" onClick={() => setStep("viewing")}>
                      📅 Book a viewing
                    </button>
                  </>
                )}

                {/* ── Step viewing: book a viewing ── */}
                {step === "viewing" && (
                  viewDone ? (
                    <div style={{ textAlign: "center", padding: "8px 0" }}>
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>📅</div>
                      <h3 style={{ margin: "0 0 8px" }}>Viewing requested!</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 16px" }}>An agent will confirm your viewing shortly.</p>
                      <button className="btn btn-outline full-width" onClick={() => { setStep(1); setViewDone(false); }}>Back to property</button>
                    </div>
                  ) : (
                    <form onSubmit={submitViewing}>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 14px" }}>Pick a date and time to visit this property.</p>
                      <div className="form-row">
                        <label className="field-label">Preferred date</label>
                        <input className="input" type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                      </div>
                      <div className="form-row" style={{ marginTop: 10 }}>
                        <label className="field-label">Preferred time</label>
                        <select className="select" value={viewTime} onChange={e => setViewTime(e.target.value)}>
                          {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-row" style={{ marginTop: 10 }}>
                        <label className="field-label">Notes (optional)</label>
                        <textarea className="textarea" rows={2} value={viewNote} onChange={e => setViewNote(e.target.value)} placeholder="Any special requests…" style={{ minHeight: 56 }} />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={viewSubmitting} style={{ flex: 1 }}>
                          {viewSubmitting ? "Booking…" : "Request viewing"}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                      </div>
                    </form>
                  )
                )}

                {/* ── Step 2: pick agent ── */}
                {step === 2 && (
                  <>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
                      Choose an agent to represent you. Review their experience and deal history before selecting.
                    </p>
                    {agentsLoading && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading agents…</div>}
                    <div className="agent-select-list">
                      {agents.map((a) => (
                        <AgentCard key={a.id} agent={a} selected={selectedAgent?.id === a.id} onSelect={setSelectedAgent} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" disabled={!selectedAgent} onClick={() => goConfirm(selectedAgent)} style={{ flex: 1 }}>
                        Continue →
                      </button>
                      <button className="btn btn-outline" onClick={() => { setStep(1); setSelectedAgent(null); }}>Back</button>
                    </div>
                  </>
                )}

                {/* ── Step 3: confirm details ── */}
                {step === 3 && selectedAgent && (
                  <form onSubmit={goPayment}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 12px" }}>Review your details before payment.</p>

                    {/* Selected agent summary */}
                    <div className="confirm-agent-box">
                      <div className="agent-select-avatar" style={{ width: 40, height: 40, fontSize: "0.9rem" }}>{selectedAgent.avatar_initials}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedAgent.full_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedAgent.title} · ⭐{selectedAgent.rating} · {selectedAgent.years_experience} yrs</div>
                      </div>
                      <button type="button" className="btn btn-outline" style={{ marginLeft: "auto", fontSize: "0.72rem", padding: "4px 10px" }} onClick={() => setStep(2)}>Change</button>
                    </div>

                    {/* Transaction type */}
                    <div className="form-row" style={{ marginTop: 12 }}>
                      <label className="field-label">Transaction type</label>
                      <div className="segmented-control">
                        <button type="button" className={`segment ${txType === "purchase" ? "active" : ""}`} onClick={() => setTxType("purchase")}>Purchase</button>
                        <button type="button" className={`segment ${txType === "rent" ? "active" : ""}`} onClick={() => setTxType("rent")}>Rent</button>
                      </div>
                    </div>

                    <div className="form-row" style={{ marginTop: 10 }}>
                      <label className="field-label">Notes for agent (optional)</label>
                      <textarea className="textarea" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. I'd like to schedule a viewing this weekend…" style={{ minHeight: 70 }} />
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                        Proceed to Payment →
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                    </div>
                  </form>
                )}

                {/* ── Step 4: payment ── */}
                {step === 4 && (
                  <form onSubmit={submitTransaction}>
                    {/* Order summary */}
                    <div className="payment-summary-box">
                      <div className="payment-summary-row">
                        <span>Property</span>
                        <strong>{property.title}</strong>
                      </div>
                      <div className="payment-summary-row">
                        <span>Agent</span>
                        <strong>{selectedAgent?.full_name}</strong>
                      </div>
                      <div className="payment-summary-row">
                        <span>Type</span>
                        <strong style={{ textTransform: "capitalize" }}>{txType}</strong>
                      </div>
                      <div className="payment-summary-row payment-summary-total">
                        <span>Total</span>
                        <strong>${Number(property.price).toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Payment method selector */}
                    <label className="field-label" style={{ marginTop: 14, display: "block" }}>Payment method</label>
                    <div className="payment-method-grid">
                      <div className={`payment-option ${payMethod === "cash" ? "selected" : ""}`} onClick={() => setPayMethod("cash")}>
                        <div className="payment-option-icon">💵</div>
                        <div className="payment-option-label">Cash</div>
                        <div className="payment-option-sub">Pay in person</div>
                      </div>
                      <div className={`payment-option ${payMethod === "card" ? "selected" : ""}`} onClick={() => setPayMethod("card")}>
                        <div className="payment-option-icon">💳</div>
                        <div className="payment-option-label">Card</div>
                        <div className="payment-option-sub">Debit / Credit</div>
                      </div>
                    </div>

                    {/* Cash info */}
                    {payMethod === "cash" && (
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "12px 0 0", lineHeight: 1.6 }}>
                        Your agent will coordinate the cash payment details with you after the request is confirmed.
                      </p>
                    )}

                    {/* Card form */}
                    {payMethod === "card" && (
                      <div style={{ marginTop: 12 }}>
                        <div className="form-row">
                          <label className="field-label">Card number</label>
                          <input
                            className="input"
                            value={cardNumber}
                            onChange={handleCardNumber}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            required
                          />
                        </div>
                        <div className="form-row" style={{ marginTop: 10 }}>
                          <label className="field-label">Name on card</label>
                          <input
                            className="input"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label className="field-label">Expiry (MM/YY)</label>
                            <input
                              className="input"
                              value={cardExpiry}
                              onChange={handleExpiry}
                              placeholder="MM/YY"
                              maxLength={5}
                              required
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="field-label">CVV</label>
                            <input
                              className="input"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              placeholder="123"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <button className="btn btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                        {submitting ? "Processing…" : payMethod === "card" ? "Pay Now" : "Confirm Request"}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setStep(3)}>Back</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <button className="btn btn-outline full-width" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>
    </main>
  );
}
