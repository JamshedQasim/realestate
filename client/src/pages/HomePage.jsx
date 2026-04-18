import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="page home-page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">Smart real estate search</p>
            <h1 className="hero-title">
              Discover homes that fit
              <span className="hero-highlight"> your lifestyle.</span>
            </h1>
            <p className="hero-subtitle">
              EstateHub combines local expertise with intelligent filters so you
              can move from browsing to move‑in with confidence.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-number">24k+</span>
                <span className="hero-stat-label">Active listings</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">1.2k</span>
                <span className="hero-stat-label">Verified agents</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">4.9★</span>
                <span className="hero-stat-label">Client rating</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <h2 className="hero-panel-title">Find your next place</h2>
            <p className="hero-panel-subtitle">
              Start with a neighborhood, budget, or feature.
            </p>
            <form className="hero-form">
              <div className="form-row">
                <label className="field-label" htmlFor="hero-location">
                  Location
                </label>
                <select id="hero-location" className="select">
                  <option>Any neighborhood</option>
                  <option>Bronx</option>
                  <option>Brooklyn</option>
                  <option>Manhattan</option>
                  <option>Queens</option>
                  <option>Staten Island</option>
                </select>
              </div>
              <div className="form-row two-cols">
                <div>
                  <label className="field-label" htmlFor="hero-type">
                    Type
                  </label>
                  <select id="hero-type" className="select">
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Studio</option>
                    <option>Townhouse</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="hero-budget">
                    Max budget
                  </label>
                  <select id="hero-budget" className="select">
                    <option>Any</option>
                    <option>$1,000 / month</option>
                    <option>$2,000 / month</option>
                    <option>$3,000 / month</option>
                    <option>$4,000+ / month</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label className="field-label" htmlFor="hero-feature">
                  Key feature
                </label>
                <select id="hero-feature" className="select">
                  <option>No preference</option>
                  <option>Pet friendly</option>
                  <option>Parking included</option>
                  <option>Waterfront</option>
                  <option>Furnished</option>
                </select>
              </div>
              <Link to="/properties" className="btn btn-primary full-width">
                View matching properties
              </Link>
            </form>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured listings</h2>
            <p className="section-subtitle">
              Hand‑selected homes popular with buyers this month.
            </p>
          </div>
          <Link to="/properties" className="section-link">
            View all properties
          </Link>
        </div>

        <div className="cards-grid">
          <article className="property-card">
            <div className="card-image-wrapper">
              <span className="badge badge-status">For Sale</span>
              <img
                src="https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Modern bedroom"
                className="card-image"
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">Skyline Loft Apartment</h3>
              <p className="card-address">4651 South Burlington, VT 05403</p>
              <div className="card-meta">
                <span>120 sqft</span>
                <span>3 Beds</span>
                <span>3 Baths</span>
                <span>3 Rooms</span>
              </div>
              <div className="card-footer">
                <div className="card-price">$154,000</div>
                <div className="card-agent">
                  <div className="agent-avatar">M</div>
                  <div className="agent-info">
                    <span className="agent-name">Marta Greene</span>
                    <span className="agent-meta">2 months ago</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="property-card">
            <div className="card-image-wrapper">
              <span className="badge badge-status">For Sale</span>
              <img
                src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Family house with garden"
                className="card-image"
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">Willow Creek Residence</h3>
              <p className="card-address">8412 Willow Creek, WA 98101</p>
              <div className="card-meta">
                <span>240 sqft</span>
                <span>4 Beds</span>
                <span>3 Baths</span>
                <span>7 Rooms</span>
              </div>
              <div className="card-footer">
                <div className="card-price">$245,000</div>
                <div className="card-agent">
                  <div className="agent-avatar">J</div>
                  <div className="agent-info">
                    <span className="agent-name">Jonas Baird</span>
                    <span className="agent-meta">1 month ago</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="property-card">
            <div className="card-image-wrapper">
              <span className="badge badge-status">For Sale</span>
              <img
                src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Dining room with sea view"
                className="card-image"
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">Oceanview Penthouse</h3>
              <p className="card-address">19 Seaside Avenue, CA 90210</p>
              <div className="card-meta">
                <span>180 sqft</span>
                <span>2 Beds</span>
                <span>2 Baths</span>
                <span>4 Rooms</span>
              </div>
              <div className="card-footer">
                <div className="card-price">$310,000</div>
                <div className="card-agent">
                  <div className="agent-avatar">L</div>
                  <div className="agent-info">
                    <span className="agent-name">Lena Shore</span>
                    <span className="agent-meta">3 weeks ago</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="property-card">
            <div className="card-image-wrapper">
              <span className="badge badge-status">For Sale</span>
              <img
                src="https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Bright living room"
                className="card-image"
              />
            </div>
            <div className="card-body">
              <h3 className="card-title">Citylight Studio</h3>
              <p className="card-address">4210 Elm Street, NY 10001</p>
              <div className="card-meta">
                <span>95 sqft</span>
                <span>1 Bed</span>
                <span>1 Bath</span>
                <span>2 Rooms</span>
              </div>
              <div className="card-footer">
                <div className="card-price">$98,000</div>
                <div className="card-agent">
                  <div className="agent-avatar">R</div>
                  <div className="agent-info">
                    <span className="agent-name">Ravi Patel</span>
                    <span className="agent-meta">2 weeks ago</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section section-muted">
        <div className="section-header">
          <div>
            <h2 className="section-title">Why clients choose EstateHub</h2>
            <p className="section-subtitle">
              A modern search experience built for real‑world moves.
            </p>
          </div>
        </div>
        <div className="cards-grid three-cols">
          <article className="info-card">
            <h3>Transparent listings</h3>
            <p>
              Up‑to‑date pricing, clear photos, and honest descriptions so you
              never waste time on outdated properties.
            </p>
          </article>
          <article className="info-card">
            <h3>Local experts</h3>
            <p>
              Work with agents who live where they sell and understand schools,
              commute times, and hidden neighborhood gems.
            </p>
          </article>
          <article className="info-card">
            <h3>Guided journey</h3>
            <p>
              From first search to closing day, our team and tools keep every
              step organized in one place.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

