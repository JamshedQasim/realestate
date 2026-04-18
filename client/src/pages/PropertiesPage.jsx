import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const PROPERTY_TYPES = ["any", "apartment", "house", "condo", "studio", "penthouse"];
const MAX_PRICE = 1000000;

function InquiryModal({ property, token, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/buyer/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: property.id, message }),
      });
      if (res.ok) setDone(true);
      else alert("Failed to send inquiry");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3 className="modal-title">Inquiry sent!</h3>
            <p className="modal-body">
              Your inquiry for <strong>{property.title}</strong> has been submitted. An agent will
              get back to you shortly.
            </p>
            <button className="btn btn-primary full-width" onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <h3 className="modal-title">Inquire about {property.title}</h3>
            <p className="modal-body" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {property.address}, {property.city} &nbsp;·&nbsp; ${Number(property.price).toLocaleString()}
            </p>
            <form onSubmit={submit}>
              <div className="form-row">
                <label className="field-label">Your message</label>
                <textarea
                  className="textarea"
                  rows="4"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I'm interested in this property and would like to schedule a viewing…"
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send inquiry"}
                </button>
                <button className="btn btn-outline" type="button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user, token } = useAuth();
  const isBuyer = user?.role === "buyer";

  // ── filter state ──────────────────────────────────────────────────────────
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("Any");
  const [status, setStatus] = useState("any");
  const [propertyType, setPropertyType] = useState("any");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [minBeds, setMinBeds] = useState("0");
  const [sort, setSort] = useState("newest");

  // ── results state ─────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── saved/inquiry state ───────────────────────────────────────────────────
  const [savedIds, setSavedIds] = useState(new Set());
  const [inquiryTarget, setInquiryTarget] = useState(null);

  // ── load cities once ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/properties/cities")
      .then((r) => r.json())
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── load saved IDs when buyer logs in ─────────────────────────────────────
  useEffect(() => {
    if (!isBuyer || !token) return;
    fetch("/api/buyer/saved-ids", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((ids) => setSavedIds(new Set(ids)))
      .catch(() => {});
  }, [isBuyer, token]);

  // ── load properties (re-runs on filter changes) ───────────────────────────
  const abortRef = useRef(null);

  function buildUrl() {
    const p = new URLSearchParams();
    if (city !== "Any") p.set("city", city);
    if (status !== "any") p.set("status", status);
    if (maxPrice < MAX_PRICE) p.set("max_price", maxPrice);
    if (minBeds !== "0") p.set("min_beds", minBeds);
    if (propertyType !== "any") p.set("property_type", propertyType);
    p.set("sort", sort);
    return `/api/properties?${p}`;
  }

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(buildUrl(), { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load properties");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") setError(e?.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, status, propertyType, maxPrice, minBeds, sort]);

  // ── save / unsave ─────────────────────────────────────────────────────────
  async function toggleSave(property) {
    if (!isBuyer) return;
    const isSaved = savedIds.has(property.id);
    if (isSaved) {
      await fetch(`/api/buyer/saved-properties/${property.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedIds((prev) => { const s = new Set(prev); s.delete(property.id); return s; });
    } else {
      await fetch("/api/buyer/saved-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: property.id }),
      });
      setSavedIds((prev) => new Set([...prev, property.id]));
    }
  }

  function resetFilters() {
    setCity("Any");
    setStatus("any");
    setPropertyType("any");
    setMaxPrice(MAX_PRICE);
    setMinBeds("0");
    setSort("newest");
  }

  const summaryText = loading
    ? "Loading results…"
    : error
    ? "Unable to load results"
    : `Showing ${items.length.toLocaleString()} result${items.length !== 1 ? "s" : ""}`;

  return (
    <main className="page">
      {inquiryTarget && (
        <InquiryModal
          property={inquiryTarget}
          token={token}
          onClose={() => setInquiryTarget(null)}
        />
      )}

      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Properties</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">
            Filter homes by city, price, size, and type to find the perfect match.
          </p>
        </div>
      </section>

      <section className="layout">
        {/* ── Sidebar filters ── */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Status</h3>
            <div className="segmented-control">
              <button
                className={`segment ${status === "any" ? "active" : ""}`}
                onClick={() => setStatus("any")}
              >
                Any
              </button>
              <button
                className={`segment ${status === "for_sale" ? "active" : ""}`}
                onClick={() => setStatus("for_sale")}
              >
                For Sale
              </button>
              <button
                className={`segment ${status === "for_rent" ? "active" : ""}`}
                onClick={() => setStatus("for_rent")}
              >
                For Rent
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Location</h3>
            <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="Any">Any city</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Property Type</h3>
            <select
              className="select"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "any" ? "Any type" : t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Max Price</h3>
            <div className="range-row">
              <span>$0</span>
              <span>${Number(maxPrice).toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max={MAX_PRICE}
              step="10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="range"
            />
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Min Bedrooms</h3>
            <div className="segmented-control">
              {["0", "1", "2", "3", "4"].map((n) => (
                <button
                  key={n}
                  className={`segment ${minBeds === n ? "active" : ""}`}
                  onClick={() => setMinBeds(n)}
                >
                  {n === "0" ? "Any" : n + "+"}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-outline full-width" style={{ marginTop: 8 }} onClick={resetFilters}>
            Reset filters
          </button>
        </aside>

        {/* ── Results ── */}
        <section className="results">
          <div className="results-toolbar">
            <div className="results-summary">{summaryText}</div>
            <div className="results-actions">
              <div className="sort-wrapper">
                <span>Sort by:</span>
                {[
                  { value: "newest", label: "Newest" },
                  { value: "price_asc", label: "Price ↑" },
                  { value: "price_desc", label: "Price ↓" },
                  { value: "beds", label: "Beds" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`chip ${sort === opt.value ? "active" : ""}`}
                    onClick={() => setSort(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="cards-grid">
            {loading && <div className="section-panel">Loading properties…</div>}
            {!loading && error && <div className="section-panel">{error}</div>}
            {!loading && !error && items.length === 0 && (
              <div className="section-panel">No properties match your filters.</div>
            )}
            {!loading &&
              !error &&
              items.map((p) => {
                const saved = savedIds.has(p.id);
                return (
                  <article className="property-card" key={p.id}>
                    <Link to={`/properties/${p.id}`} className="card-link">
                      <div className="card-image-wrapper">
                        <span className="badge badge-status">
                          {p.status === "for_rent" ? "For Rent" : "For Sale"}
                        </span>
                        {isBuyer && (
                          <button
                            className={`save-btn ${saved ? "saved" : ""}`}
                            title={saved ? "Remove from saved" : "Save property"}
                            onClick={(e) => { e.preventDefault(); toggleSave(p); }}
                          >
                            {saved ? "♥" : "♡"}
                          </button>
                        )}
                        <img
                          src={
                            p.image_url ||
                            "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"
                          }
                          alt={p.title}
                          className="card-image"
                        />
                      </div>
                      <div className="card-body">
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <span className="badge" style={{ position: "static", background: "var(--accent-soft)", color: "var(--accent-dark)", fontSize: "0.7rem" }}>
                            {p.property_type}
                          </span>
                          <span className="badge" style={{ position: "static", background: "var(--surface-soft)", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                            {p.city}
                          </span>
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
                          {isBuyer && (
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: "0.75rem", padding: "6px 14px" }}
                              onClick={(e) => { e.preventDefault(); setInquiryTarget(p); }}
                            >
                              Inquire
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
          </div>
        </section>
      </section>
    </main>
  );
}
