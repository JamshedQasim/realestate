import React from "react";

export default function ContactPage() {
  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      fullName: form.fullName.value,
      email: form.email.value,
      phone: form.phone.value,
      topic: form.topic.value,
      message: form.message.value
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to send message");
      form.reset();
      alert("Message sent!");
    } catch (err) {
      alert(err?.message || "Failed to send message");
    }
  }

  return (
    <main className="page">
      <section className="breadcrumb">
        <span className="breadcrumb-link">Home</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">Contact</span>
      </section>

      <section className="page-header">
        <div>
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">
            Have a question about a listing or want to schedule a viewing? Send
            us a message and we’ll respond quickly.
          </p>
        </div>
      </section>

      <section className="section-panel contact-layout">
        <form className="contact-form" onSubmit={onSubmit}>
          <div className="two-cols">
            <div className="form-row">
              <label className="field-label" htmlFor="contact-name">
                Full name
              </label>
              <input
                id="contact-name"
                name="fullName"
                type="text"
                className="input"
                placeholder="Jane Doe"
              />
            </div>
            <div className="form-row">
              <label className="field-label" htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="two-cols">
            <div className="form-row">
              <label className="field-label" htmlFor="contact-phone">
                Phone
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="+1 (555) 000‑0000"
              />
            </div>
            <div className="form-row">
              <label className="field-label" htmlFor="contact-topic">
                Topic
              </label>
              <select id="contact-topic" name="topic" className="select">
                <option>Ask about a listing</option>
                <option>Schedule a viewing</option>
                <option>Sell my property</option>
                <option>General question</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="contact-message">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="textarea"
              rows="4"
              placeholder="Share any details that will help us prepare."
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary">
            Send message
          </button>
        </form>

        <div className="contact-info">
          <h2>Visit or call our office</h2>
          <p>
            EstateHub HQ
            <br />
            4651 South Burlington
            <br />
            Vermont, VT 05403
          </p>
          <p>
            <strong>Phone:</strong> +1 (555) 123‑4567
            <br />
            <strong>Email:</strong> hello@estatehub.com
          </p>
          <p className="contact-note">
            We’re available Monday to Friday, 9:00–18:00. Weekend viewings can
            be arranged by appointment.
          </p>
        </div>
      </section>
    </main>
  );
}

