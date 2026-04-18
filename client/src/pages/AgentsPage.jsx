import React, { useEffect, useState } from "react";

export default function AgentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/agents");
        if (!res.ok) throw new Error("Failed to load agents");
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="page">
      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Agents</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Meet Our Agents</h1>
          <p className="page-subtitle">
            Local experts with deep neighborhood knowledge and a passion for
            matching people with the right home.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Top performing agents</h2>
            <p className="section-subtitle">
              A small sample of the professionals representing EstateHub
              clients.
            </p>
          </div>
        </div>

        <div className="cards-grid three-cols">
          {loading && <div className="section-panel">Loading agents…</div>}
          {!loading && error && <div className="section-panel">{error}</div>}
          {!loading &&
            !error &&
            items.map((a) => (
              <article className="info-card agent-card" key={a.id}>
                <div className="agent-card-header">
                  <div className="agent-avatar">
                    {a.avatar_initials || "EH"}
                  </div>
                  <div>
                    <h3 className="agent-name">{a.full_name}</h3>
                    <p className="agent-role">
                      {a.title}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                </div>
                <p className="agent-bio">{a.bio}</p>
                <div className="agent-stats-row">
                  <span>{a.closed_deals}+ closed deals</span>
                  <span>{a.years_experience} yrs experience</span>
                  {a.rating ? <span>{Number(a.rating).toFixed(1)}★</span> : null}
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}

