import React from "react";

export default function ServicesPage() {
  return (
    <main className="page">
      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Services</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">
            Buying, selling, renting, and full‑service property management
            tailored to your market.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">End‑to‑end real estate services</h2>
            <p className="section-subtitle">
              From first viewing to handing over the keys, we stay with you.
            </p>
          </div>
        </div>

        <div className="cards-grid three-cols">
          <article className="info-card service-card">
            <h3>Buy with confidence</h3>
            <p>
              Property discovery, private tours, offer strategy, and
              negotiation – all handled by dedicated agents who know your
              market.
            </p>
            <ul className="bullet-list">
              <li>Tailored short‑list of homes</li>
              <li>Comparative market analysis</li>
              <li>Offer and negotiation guidance</li>
            </ul>
          </article>

          <article className="info-card service-card">
            <h3>Sell for the right price</h3>
            <p>
              Modern marketing, professional photography, and data‑driven
              pricing to reach serious buyers quickly.
            </p>
            <ul className="bullet-list">
              <li>Staging and photography</li>
              <li>Listing on major portals</li>
              <li>Open house and private showings</li>
            </ul>
          </article>

          <article className="info-card service-card">
            <h3>Rent &amp; property management</h3>
            <p>
              Ideal for owners who want steady income without day‑to‑day
              headaches.
            </p>
            <ul className="bullet-list">
              <li>Tenant screening and vetting</li>
              <li>Lease preparation and renewals</li>
              <li>Maintenance coordination</li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}

