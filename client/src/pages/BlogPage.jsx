import React, { useEffect, useState } from "react";

export default function BlogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/blog-posts");
        if (!res.ok) throw new Error("Failed to load blog posts");
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load blog posts");
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
        <span className="breadcrumb-current">Blog</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Market Insights &amp; Tips</h1>
          <p className="page-subtitle">
            Share articles about neighborhood guides, pricing trends, and
            step‑by‑step buying or renting advice.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">
              Latest from the EstateHub journal
            </h2>
            <p className="section-subtitle">
              Helpful stories and tips for buyers, sellers, and renters.
            </p>
          </div>
        </div>

        <div className="cards-grid three-cols">
          {loading && <div className="section-panel">Loading posts…</div>}
          {!loading && error && <div className="section-panel">{error}</div>}
          {!loading &&
            !error &&
            items.map((p) => (
              <article className="info-card blog-card" key={p.id}>
                <p className="blog-meta">
                  {p.category} · {p.read_time_minutes} min read
                </p>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <button className="section-link" type="button">
                  Read article
                </button>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}

