import { Link } from "react-router-dom";

const SERVICES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
    title: "Buy a Home",
    desc: "We guide you from your first search to the moment you get the keys — market analysis, private tours, offer strategy, and negotiation all included.",
    points: ["Personalised property shortlist", "Comparative market analysis", "Offer & negotiation support"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: "Sell Fast & Smart",
    desc: "Professional photography, data-driven pricing, and targeted marketing that puts your listing in front of the right buyers — quickly.",
    points: ["Staging & photography", "Multi-portal listing", "Open houses & private showings"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><path d="M8 7V5a2 2 0 0 0-4 0v2"/>
      </svg>
    ),
    title: "Rental Management",
    desc: "Earn steady rental income without the hassle. We handle everything from tenant vetting to maintenance coordination.",
    points: ["Tenant screening & vetting", "Lease preparation & renewals", "Maintenance coordination"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: "Property Valuation",
    desc: "Get an accurate, data-backed valuation of your property within 24 hours — whether you're selling, refinancing, or just curious.",
    points: ["Instant online estimate", "In-person appraisal available", "Detailed comparables report"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "Dedicated Agent",
    desc: "Every client is matched with a local specialist who knows your target neighbourhood inside out and advocates for your best interests.",
    points: ["Local market expertise", "One agent, full process", "Direct line, always reachable"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    title: "Virtual Tours",
    desc: "Explore properties from anywhere with immersive virtual tours before committing to an in-person visit — saving you time and travel.",
    points: ["HD 3D walkthroughs", "Available 24/7", "Interactive floor plans"],
  },
];

const STEPS = [
  { num: "01", title: "Tell us what you need", desc: "Fill in a short brief — budget, location, property type, timeline." },
  { num: "02", title: "Meet your agent", desc: "We match you with a local specialist and schedule a free consultation." },
  { num: "03", title: "Tour & shortlist", desc: "Visit your favourites in person or via virtual tour and narrow down the list." },
  { num: "04", title: "Close the deal", desc: "We handle paperwork, negotiations, and handover so you don't have to." },
];

const STATS = [
  { value: "1,200+", label: "Properties listed" },
  { value: "850+", label: "Deals closed" },
  { value: "98%", label: "Client satisfaction" },
  { value: "12+", label: "Cities covered" },
];

export default function ServicesPage() {
  return (
    <main className="page">
      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Services</span>
      </section>

      {/* ── Hero ── */}
      <section
        style={{
          marginTop: 20,
          marginBottom: 40,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #1f2430 0%, #2d3348 60%, #3a2a1a 100%)",
          padding: "52px 48px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 80% 50%, rgba(201,130,64,0.18) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <p style={{ margin: "0 0 10px", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)" }}>
          Full-service real estate
        </p>
        <h1 style={{ margin: "0 0 14px", fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.2, maxWidth: 560 }}>
          Everything you need,<br />under one roof
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: "0.97rem", color: "rgba(255,255,255,0.65)", maxWidth: 480 }}>
          Whether you're buying your first home, selling an investment, or looking for a reliable tenant — our agents handle every step so you can focus on what matters.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/properties" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Browse properties
          </Link>
          <Link to="/contact" className="btn" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
            Talk to an agent
          </Link>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 48,
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            className="section-panel"
            style={{ marginTop: 0, textAlign: "center", padding: "22px 16px" }}
          >
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-dark)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Service cards ── */}
      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">What we offer</h2>
            <p className="section-subtitle">Six ways we make your real estate journey easier.</p>
          </div>
        </div>

        <div className="cards-grid three-cols">
          {SERVICES.map((svc) => (
            <article
              key={svc.title}
              className="info-card"
              style={{ display: "flex", flexDirection: "column", gap: 12, padding: "22px 20px" }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "var(--accent-soft)",
                  color: "var(--accent-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {svc.icon}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1rem", color: "var(--text-main)" }}>{svc.title}</h3>
                <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{svc.desc}</p>
                <ul className="bullet-list" style={{ margin: 0 }}>
                  {svc.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" style={{ marginTop: 48 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">From first enquiry to handing over the keys — four simple steps.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, position: "relative" }}>
          {/* connector line */}
          <div
            style={{
              position: "absolute",
              top: 28,
              left: "12.5%",
              right: "12.5%",
              height: 2,
              background: "linear-gradient(90deg, var(--accent-soft), var(--accent), var(--accent-soft))",
              zIndex: 0,
            }}
          />
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="section-panel"
              style={{ marginTop: 0, textAlign: "center", padding: "28px 18px 22px", position: "relative", zIndex: 1 }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: i === 0 ? "var(--accent)" : "var(--surface-soft)",
                  border: `2px solid ${i === 0 ? "var(--accent)" : "var(--border-subtle)"}`,
                  color: i === 0 ? "#fff" : "var(--accent-dark)",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                {step.num}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem", color: "var(--text-main)" }}>{step.title}</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section
        style={{
          marginTop: 48,
          borderRadius: "var(--radius-lg)",
          background: "var(--accent-soft)",
          border: "1px solid rgba(201,130,64,0.25)",
          padding: "36px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.3rem", color: "var(--text-main)" }}>
            Ready to find your next home?
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Browse our latest listings or reach out and an agent will get back to you within 24 hours.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/properties" className="btn btn-primary" style={{ textDecoration: "none" }}>
            View properties
          </Link>
          <Link to="/contact" className="btn btn-outline" style={{ textDecoration: "none" }}>
            Contact us
          </Link>
        </div>
      </section>
    </main>
  );
}
