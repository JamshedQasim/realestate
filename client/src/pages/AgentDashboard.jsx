import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_COLORS = {
  pending:         { bg: "#fff8ec", color: "#c98240" },
  seller_accepted: { bg: "#ecf8f0", color: "#2a7d4a" },
  approved:        { bg: "#ecf8f0", color: "#2a7d4a" },
  completed:       { bg: "#eaf0ff", color: "#1a4fbd" },
  cancelled:       { bg: "#fff0f0", color: "#c0392b" },
  confirmed:       { bg: "#ecf8f0", color: "#2a7d4a" },
};

const STATUS_LABELS = {
  pending:         "Awaiting Seller",
  seller_accepted: "Seller Accepted",
  approved:        "Seller Accepted",
  completed:       "Completed",
  cancelled:       "Cancelled",
  confirmed:       "Confirmed",
};

const EXPERTISE_OPTIONS = [
  "Residential Properties", "Commercial Properties", "Luxury Homes",
  "Rental Properties", "New Developments", "Property Management",
  "Investment Properties", "Waterfront Properties", "Land & Lots",
];

const SERVICE_OPTIONS = [
  "Buying Assistance", "Selling Assistance", "Property Rental",
  "Property Management", "Market Analysis", "Investment Consulting",
  "Home Valuation", "Relocation Services", "Consultation",
];

const CERTIFICATION_OPTIONS = [
  "NAR Member", "CRS – Certified Residential Specialist",
  "ABR – Accredited Buyer's Representative",
  "SRS – Seller Representative Specialist",
  "GRI – Graduate REALTOR® Institute",
  "SRES – Senior Real Estate Specialist",
  "Green Designation", "CCIM – Certified Commercial Investment Member",
];

async function safeJson(res) {
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, data: { message: `Server error (${res.status})` } }; }
}

function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// ── Step sidebar ──────────────────────────────────────────────────────────────
const STEPS = [
  { icon: "👤", label: "Personal Info" },
  { icon: "📝", label: "Professional Background" },
  { icon: "🛠️", label: "Services & Availability" },
  { icon: "🏆", label: "Achievements & Certifications" },
  { icon: "🔗", label: "Social Media" },
  { icon: "💬", label: "Testimonials" },
];

function StepSidebar({ current }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "24px 0", alignSelf: "flex-start",
    }}>
      <div style={{ padding: "0 20px 16px", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
        Setup Progress
      </div>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
            background: active ? "var(--accent-soft)" : "transparent",
            borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700,
              background: done ? "#1a3a6b" : active ? "var(--accent)" : "var(--surface-soft)",
              color: done || active ? "#fff" : "var(--text-muted)",
              border: !done && !active ? "2px solid var(--border)" : "none",
            }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: active ? 700 : 400, color: active ? "var(--accent-dark)" : done ? "var(--text)" : "var(--text-muted)" }}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Multi-checkbox group ──────────────────────────────────────────────────────
function CheckGroup({ options, selected, onChange }) {
  function toggle(opt) {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)} style={{
          padding: "6px 14px", borderRadius: 20, fontSize: "0.8rem", cursor: "pointer",
          background: selected.includes(opt) ? "var(--accent)" : "var(--surface-soft)",
          color: selected.includes(opt) ? "#fff" : "var(--text)",
          border: selected.includes(opt) ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
          fontWeight: selected.includes(opt) ? 600 : 400,
          transition: "all 0.15s",
        }}>
          {selected.includes(opt) && <span style={{ marginRight: 5 }}>✓</span>}
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Testimonial manager ───────────────────────────────────────────────────────
function TestimonialsEditor({ testimonials, onChange }) {
  const [draft, setDraft] = useState({ name: "", property: "", quote: "" });

  function add() {
    if (!draft.name.trim() || !draft.quote.trim()) return;
    onChange([...testimonials, { ...draft, name: draft.name.trim(), quote: draft.quote.trim(), property: draft.property.trim() }]);
    setDraft({ name: "", property: "", quote: "" });
  }
  function remove(i) { onChange(testimonials.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {testimonials.map((t, i) => (
        <div key={i} style={{ padding: "14px 16px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border)", position: "relative" }}>
          <button type="button" onClick={() => remove(i)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
          <p style={{ margin: "0 0 8px", fontSize: "0.88rem", fontStyle: "italic", lineHeight: 1.6 }}>"{t.quote}"</p>
          <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.name}</div>
          {t.property && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{t.property}</div>}
        </div>
      ))}

      <div style={{ padding: "18px", background: "var(--surface-soft)", borderRadius: 10, border: "1.5px dashed var(--border)" }}>
        <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: 12, color: "var(--text-muted)" }}>Add a testimonial</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Client Name *</label>
            <input className="form-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. John Smith" style={inp} />
          </div>
          <div>
            <label style={lbl}>Property Dealt</label>
            <input className="form-input" value={draft.property} onChange={e => setDraft(d => ({ ...d, property: e.target.value }))} placeholder="e.g. Skyline Loft, NYC" style={inp} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Their Quote *</label>
          <textarea className="form-input" value={draft.quote} onChange={e => setDraft(d => ({ ...d, quote: e.target.value }))} rows={3} placeholder="What did the client say about working with you?" style={{ ...inp, resize: "vertical" }} />
        </div>
        <button type="button" className="btn btn-outline" onClick={add} style={{ fontSize: "0.82rem" }}>+ Add Testimonial</button>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontWeight: 600, fontSize: "0.8rem", marginBottom: 6, color: "var(--text)" };
const inp = { width: "100%", boxSizing: "border-box" };

// ── Profile setup wizard ──────────────────────────────────────────────────────
function ProfileSetupForm({ token, onProfileSaved }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    // Step 0 – Personal Info
    full_name: "", profile_picture: "", phone: "", title: "", location: "", areas_covered: "",
    // Step 1 – Professional Background
    bio: "", expertise: [], credentials: "", years_experience: "", closed_deals: "",
    // Step 2 – Services & Availability
    services: [], availability: "",
    // Step 3 – Achievements & Certifications
    achievements: "", certifications: [],
    // Step 4 – Social Media
    social_linkedin: "", social_facebook: "", social_instagram: "",
    // Step 5 – Testimonials
    testimonials: [],
  });

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function handleChange(e) { set(e.target.name, e.target.value); }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await fetch("/api/agent/upload-photo", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const { ok, data } = await safeJson(res);
      if (ok) set("profile_picture", data.url);
      else setError("Photo upload failed: " + data.message);
    } catch { setError("Photo upload failed."); }
    finally { setPhotoUploading(false); }
  }

  function validateStep() {
    if (step === 0 && (!form.full_name.trim() || !form.title.trim() || !form.location.trim())) return "Full Name, Title, and Location are required.";
    if (step === 1 && (!form.bio.trim() || !form.years_experience)) return "Bio and Years of Experience are required.";
    return "";
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => s + 1);
  }
  function back() { setError(""); setStep(s => s - 1); }

  async function submit() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/agent/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          years_experience: Number(form.years_experience) || 0,
          closed_deals: Number(form.closed_deals) || 0,
        }),
      });
      const { ok, data } = await safeJson(res);
      if (!ok) throw new Error(data.message || "Failed to save profile");
      onProfileSaved();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <main className="page" style={{ maxWidth: 1020, margin: "0 auto" }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #0c2340 0%, #1a4fbd 100%)", borderRadius: 16, padding: "32px 40px", marginBottom: 28, color: "#fff", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>🏡</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", fontWeight: 800 }}>Agent Profile Setup</h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem" }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= step ? "#fff" : "rgba(255,255,255,0.3)", transition: "background 0.2s" }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <StepSidebar current={step} />

        <div style={{ flex: 1, background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
          {/* Step header */}
          <div style={{ padding: "18px 28px", borderBottom: "1px solid var(--border)", background: "var(--surface-soft)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>{STEPS[step].icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{STEPS[step].label}</h2>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {["Personal information and contact details", "Your background, expertise and credentials", "Services you offer and your working hours", "Professional achievements and certifications", "Connect your social media profiles", "Add client testimonials (optional)"][step]}
              </p>
            </div>
          </div>

          <div style={{ padding: "28px" }}>
            {error && (
              <div style={{ background: "#fff0f0", color: "#c0392b", padding: "12px 16px", borderRadius: 8, fontSize: "0.85rem", border: "1px solid #f5c6c6", marginBottom: 22, display: "flex", gap: 8, alignItems: "center" }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Step 0: Personal Info ── */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Profile picture */}
                <div>
                  <label style={lbl}>Profile Photo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--border)", flexShrink: 0, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {form.profile_picture
                        ? <img src={form.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "2rem", color: "var(--text-muted)" }}>👤</span>}
                    </div>
                    <div>
                      <button type="button" className="btn btn-outline" style={{ fontSize: "0.82rem" }} onClick={() => fileRef.current?.click()} disabled={photoUploading}>
                        {photoUploading ? "Uploading…" : "Upload Photo"}
                      </button>
                      <p style={{ margin: "6px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>JPG or PNG, max 8 MB. A professional headshot is recommended.</p>
                      <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={uploadPhoto} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Full Name <span style={{ color: "#c0392b" }}>*</span></label>
                  <input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g. John Smith" style={inp} />
                  <p style={{ margin: "5px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>This is how your name will appear to buyers and sellers</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <label style={lbl}>Professional Title / Designation <span style={{ color: "#c0392b" }}>*</span></label>
                    <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Real Estate Agent" style={inp} />
                    <p style={{ margin: "5px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>Your role or specialization</p>
                  </div>
                  <div>
                    <label style={lbl}>Phone Number</label>
                    <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. +1 (555) 000-0000" style={inp} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <label style={lbl}>Primary Location <span style={{ color: "#c0392b" }}>*</span></label>
                    <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Manhattan, New York" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Areas / Regions Covered</label>
                    <input className="form-input" name="areas_covered" value={form.areas_covered} onChange={handleChange} placeholder="e.g. Brooklyn, Queens, Nassau County" style={inp} />
                    <p style={{ margin: "5px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>Comma-separated neighborhoods or cities</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Professional Background ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Professional Bio <span style={{ color: "#c0392b" }}>*</span></label>
                  <textarea className="form-input" name="bio" value={form.bio} onChange={handleChange} rows={5} placeholder="Describe your professional experience, approach with clients, and what makes you the right choice. Write 3–5 sentences." style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <label style={lbl}>Years of Experience <span style={{ color: "#c0392b" }}>*</span></label>
                    <input className="form-input" type="number" name="years_experience" value={form.years_experience} onChange={handleChange} min="0" max="60" placeholder="e.g. 8" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Closed Deals <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
                    <input className="form-input" type="number" name="closed_deals" value={form.closed_deals} onChange={handleChange} min="0" placeholder="e.g. 75" style={inp} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Areas of Expertise</label>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Select all that apply</p>
                  <CheckGroup options={EXPERTISE_OPTIONS} selected={form.expertise} onChange={v => set("expertise", v)} />
                </div>

                <div>
                  <label style={lbl}>Credentials & Education</label>
                  <textarea className="form-input" name="credentials" value={form.credentials} onChange={handleChange} rows={3} placeholder="e.g. B.Sc. Real Estate Management, XYZ University (2010). Licensed Real Estate Broker since 2012." style={{ ...inp, resize: "vertical" }} />
                </div>
              </div>
            )}

            {/* ── Step 2: Services & Availability ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Services Offered</label>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Select all services you provide to clients</p>
                  <CheckGroup options={SERVICE_OPTIONS} selected={form.services} onChange={v => set("services", v)} />
                </div>

                <div>
                  <label style={lbl}>Availability / Working Hours</label>
                  <textarea className="form-input" name="availability" value={form.availability} onChange={handleChange} rows={3} placeholder="e.g. Monday–Friday: 9 AM – 6 PM&#10;Saturday: 10 AM – 4 PM&#10;Available for evening calls by appointment." style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
                  <p style={{ margin: "5px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>Let clients know when they can reach you</p>
                </div>
              </div>
            )}

            {/* ── Step 3: Achievements & Certifications ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={lbl}>Professional Achievements</label>
                  <textarea className="form-input" name="achievements" value={form.achievements} onChange={handleChange} rows={4} placeholder="e.g. Top Agent of the Year 2022 – EstateHub&#10;#1 Sales Agent in Manhattan Q3 2023&#10;Featured in Forbes Real Estate 2021" style={{ ...inp, resize: "vertical", lineHeight: 1.7 }} />
                  <p style={{ margin: "5px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>List notable awards, rankings, or recognitions (one per line)</p>
                </div>

                <div>
                  <label style={lbl}>Certifications & Professional Affiliations</label>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Select any certifications or memberships you hold</p>
                  <CheckGroup options={CERTIFICATION_OPTIONS} selected={form.certifications} onChange={v => set("certifications", v)} />
                </div>
              </div>
            )}

            {/* ── Step 4: Social Media ── */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Add your professional social media profiles so clients can follow your work and connect with you.
                </p>
                {[
                  { name: "social_linkedin", icon: "💼", label: "LinkedIn Profile URL", placeholder: "https://linkedin.com/in/your-name" },
                  { name: "social_facebook", icon: "📘", label: "Facebook Profile / Page URL", placeholder: "https://facebook.com/your-page" },
                  { name: "social_instagram", icon: "📸", label: "Instagram Profile URL", placeholder: "https://instagram.com/your-handle" },
                ].map(({ name, icon, label, placeholder }) => (
                  <div key={name}>
                    <label style={lbl}>{icon} {label}</label>
                    <input className="form-input" name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} style={inp} />
                  </div>
                ))}
                <div style={{ padding: "14px 16px", background: "var(--accent-soft)", borderRadius: 10, fontSize: "0.8rem", color: "var(--accent-dark)" }}>
                  All social links are optional but help build trust with potential clients.
                </div>
              </div>
            )}

            {/* ── Step 5: Testimonials ── */}
            {step === 5 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Add quotes from past clients to build credibility. You can also skip this step and add testimonials later from your profile settings.
                </p>
                <TestimonialsEditor testimonials={form.testimonials} onChange={v => set("testimonials", v)} />
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <button type="button" className="btn btn-outline" onClick={back} disabled={step === 0} style={{ fontSize: "0.88rem", visibility: step === 0 ? "hidden" : "visible" }}>
                ← Back
              </button>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {isLast && (
                  <button type="button" className="btn btn-outline" onClick={submit} disabled={saving} style={{ fontSize: "0.88rem" }}>
                    {saving ? "Saving…" : "Skip & Finish"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={isLast ? submit : next}
                  disabled={saving}
                  style={{ fontSize: "0.88rem", padding: "10px 24px" }}
                >
                  {saving ? "Saving profile…" : isLast ? "Complete Registration" : `Next: ${STEPS[step + 1]?.label} →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Edit profile form ─────────────────────────────────────────────────────────
function EditProfileForm({ token, profile, onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    title: profile.title || "",
    location: profile.location || "",
    bio: profile.bio || "",
    phone: profile.phone || "",
    areas_covered: profile.areas_covered || "",
    years_experience: profile.years_experience ?? "",
    closed_deals: profile.closed_deals ?? "",
    expertise: parseJsonField(profile.expertise),
    credentials: profile.credentials || "",
    services: parseJsonField(profile.services),
    social_linkedin: profile.social_linkedin || "",
    social_facebook: profile.social_facebook || "",
    social_instagram: profile.social_instagram || "",
    achievements: profile.achievements || "",
    availability: profile.availability || "",
    certifications: parseJsonField(profile.certifications),
    testimonials: parseJsonField(profile.testimonials),
    profile_picture: profile.profile_picture || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef();

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function handle(e) { set(e.target.name, e.target.value); }

  async function uploadPhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    setPhotoUploading(true);
    const fd = new FormData(); fd.append("photo", file);
    try {
      const res = await fetch("/api/agent/upload-photo", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const { ok, data } = await safeJson(res);
      if (ok) set("profile_picture", data.url); else setError("Photo upload failed.");
    } catch { setError("Photo upload failed."); } finally { setPhotoUploading(false); }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, years_experience: Number(form.years_experience) || 0, closed_deals: Number(form.closed_deals) || 0 }),
      });
      const { ok, data } = await safeJson(res);
      if (!ok) throw new Error(data.message || "Failed to update");
      setSuccess(true);
      onSaved({ ...profile, ...form });
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Edit Profile</h3>
        <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "5px 12px" }} onClick={onCancel}>Cancel</button>
      </div>
      <form onSubmit={submit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {error && <div style={{ background: "#fff0f0", color: "#c0392b", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>⚠️ {error}</div>}
        {success && <div style={{ background: "#ecf8f0", color: "#2a7d4a", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>✓ Profile updated.</div>}

        {/* Photo */}
        <div>
          <label style={lbl}>Profile Photo</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--border)", flexShrink: 0, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {form.profile_picture ? <img src={form.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.8rem" }}>👤</span>}
            </div>
            <button type="button" className="btn btn-outline" style={{ fontSize: "0.8rem" }} onClick={() => fileRef.current?.click()} disabled={photoUploading}>{photoUploading ? "Uploading…" : "Change Photo"}</button>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={uploadPhoto} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>Full Name <span style={{ color: "#c0392b" }}>*</span></label><input className="form-input" name="full_name" value={form.full_name} onChange={handle} style={inp} /></div>
          <div><label style={lbl}>Title</label><input className="form-input" name="title" value={form.title} onChange={handle} style={inp} /></div>
          <div><label style={lbl}>Phone</label><input className="form-input" name="phone" value={form.phone} onChange={handle} style={inp} /></div>
          <div><label style={lbl}>Location</label><input className="form-input" name="location" value={form.location} onChange={handle} style={inp} /></div>
          <div><label style={lbl}>Areas Covered</label><input className="form-input" name="areas_covered" value={form.areas_covered} onChange={handle} style={inp} /></div>
          <div><label style={lbl}>Years Experience</label><input className="form-input" type="number" name="years_experience" value={form.years_experience} onChange={handle} min="0" style={inp} /></div>
          <div><label style={lbl}>Closed Deals</label><input className="form-input" type="number" name="closed_deals" value={form.closed_deals} onChange={handle} min="0" style={inp} /></div>
        </div>

        <div><label style={lbl}>Bio</label><textarea className="form-input" name="bio" value={form.bio} onChange={handle} rows={4} style={{ ...inp, resize: "vertical" }} /></div>
        <div><label style={lbl}>Expertise</label><CheckGroup options={EXPERTISE_OPTIONS} selected={form.expertise} onChange={v => set("expertise", v)} /></div>
        <div><label style={lbl}>Services</label><CheckGroup options={SERVICE_OPTIONS} selected={form.services} onChange={v => set("services", v)} /></div>
        <div><label style={lbl}>Certifications</label><CheckGroup options={CERTIFICATION_OPTIONS} selected={form.certifications} onChange={v => set("certifications", v)} /></div>
        <div><label style={lbl}>Credentials</label><textarea className="form-input" name="credentials" value={form.credentials} onChange={handle} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
        <div><label style={lbl}>Achievements</label><textarea className="form-input" name="achievements" value={form.achievements} onChange={handle} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
        <div><label style={lbl}>Availability</label><textarea className="form-input" name="availability" value={form.availability} onChange={handle} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
        <div>
          <label style={lbl}>Social Media</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="form-input" name="social_linkedin" value={form.social_linkedin} onChange={handle} placeholder="LinkedIn URL" style={inp} />
            <input className="form-input" name="social_facebook" value={form.social_facebook} onChange={handle} placeholder="Facebook URL" style={inp} />
            <input className="form-input" name="social_instagram" value={form.social_instagram} onChange={handle} placeholder="Instagram URL" style={inp} />
          </div>
        </div>
        <div><label style={lbl}>Testimonials</label><TestimonialsEditor testimonials={form.testimonials} onChange={v => set("testimonials", v)} /></div>

        <div style={{ display: "flex", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-primary" type="submit" disabled={saving} style={{ fontSize: "0.88rem" }}>{saving ? "Saving…" : "Save Changes"}</button>
          <button className="btn btn-outline" type="button" onClick={onCancel} style={{ fontSize: "0.88rem" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AgentDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState("transactions");
  const [profile, setProfile]           = useState(undefined);
  const [transactions, setTransactions] = useState([]);
  const [viewings, setViewings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/agent/profile",      { headers: { Authorization: `Bearer ${token}` } }).then(r => safeJson(r)),
      fetch("/api/agent/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json().catch(() => [])),
      fetch("/api/agent/viewings",     { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json().catch(() => [])),
    ]).then(([prof, txs, views]) => {
      setProfile(prof.ok ? (prof.data || null) : null);
      setTransactions(Array.isArray(txs)   ? txs   : []);
      setViewings(Array.isArray(views) ? views : []);
    }).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [token]);

  async function updateTxStatus(id, status) {
    setUpdating(id + "-tx");
    await fetch(`/api/agent/transactions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
    // Refetch to get updated commission_amount/seller_amount/property_status
    const updated = await fetch("/api/agent/transactions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json().catch(() => null));
    if (Array.isArray(updated)) setTransactions(updated);
    else setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setUpdating(null);
  }

  async function updateViewingStatus(id, status) {
    setUpdating(id + "-v");
    await fetch(`/api/agent/viewings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
    setViewings(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    setUpdating(null);
  }

  const COMMISSION_RATE = 0.03;
  const completedTx    = transactions.filter(t => t.status === "completed");
  const totalCommission = completedTx.reduce((s, t) => s + Number(t.commission_amount || t.property_price * COMMISSION_RATE || 0), 0);
  const awaitingSellerTx = transactions.filter(t => t.status === "pending").length;
  const readyToCloseTx  = transactions.filter(t => t.status === "seller_accepted" || t.status === "approved").length;
  const pendingViews    = viewings.filter(v => v.status === "pending").length;

  if (loading) return <main className="page"><section className="section"><div className="section-panel">Loading…</div></section></main>;

  if (profile === null) {
    return (
      <ProfileSetupForm
        token={token}
        onProfileSaved={() =>
          fetch("/api/agent/profile", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => safeJson(r)).then(({ ok, data }) => setProfile(ok ? data : null))
        }
      />
    );
  }

  const expertise = parseJsonField(profile.expertise);
  const services  = parseJsonField(profile.services);
  const certs     = parseJsonField(profile.certifications);
  const testimonials = parseJsonField(profile.testimonials);

  return (
    <main className="page">
      <section className="page-header">
        <div>
          <h1 className="page-title">Agent Dashboard</h1>
          <p className="page-subtitle">Manage your transactions, viewings, and commission.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { value: transactions.length,   label: "Total deals" },
            { value: awaitingSellerTx,      label: "Awaiting seller" },
            { value: readyToCloseTx,        label: "Ready to close" },
            { value: completedTx.length,    label: "Completed deals" },
            { value: `$${Math.round(totalCommission).toLocaleString()}`, label: "Commission earned" },
            { value: pendingViews,          label: "Viewing requests" },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <span className="stat-value" style={{ fontSize: s.value.toString().length > 6 ? "1.2rem" : undefined }}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section className="section">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[["transactions", `Deals (${transactions.length})`], ["viewings", `Viewings (${viewings.length})`], ["commission", "Commission"], ["profile", "My Profile"]].map(([key, label]) => (
            <button key={key} className={`chip ${tab === key ? "active" : ""}`} onClick={() => { setTab(key); setEditingProfile(false); }}>{label}</button>
          ))}
        </div>

        {/* ── Deals ── */}
        {tab === "transactions" && (
          transactions.length === 0 ? <div className="section-panel"><p style={{ margin: 0 }}>No deals assigned yet.</p></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {transactions.map(tx => {
                const c = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
                const isBusy = updating === tx.id + "-tx";
                return (
                  <div className="section-panel" key={tx.id} style={{ padding: "18px 20px" }}>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
                      {tx.property_image && <img src={tx.property_image} alt={tx.property_title} style={{ width: 86, height: 66, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{tx.property_title}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{tx.property_city} · ${Number(tx.property_price).toLocaleString()}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ background: "var(--accent-soft)", color: "var(--accent-dark)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{tx.transaction_type}</span>
                            <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600 }}>{STATUS_LABELS[tx.status] || tx.status}</span>
                            {tx.payment_method && <span style={{ background: "var(--surface-soft)", color: "var(--text-muted)", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", textTransform: "capitalize" }}>{tx.payment_method}</span>}
                            {tx.status === "completed" && <span style={{ background: "#d4edda", color: "#155724", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600 }}>{tx.property_status?.toUpperCase()}</span>}
                          </div>
                        </div>
                        <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Buyer: {tx.buyer_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{tx.buyer_email}</div>
                          {tx.notes && <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>Note: {tx.notes}</p>}
                        </div>
                        {tx.status === "completed" && (
                          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: "#eaf0ff", color: "#1a4fbd", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600 }}>
                              Your commission: ${Number(tx.commission_amount || 0).toLocaleString()}
                            </span>
                            <span style={{ background: "#ecf8f0", color: "#2a7d4a", padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600 }}>
                              Seller receives: ${Number(tx.seller_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {tx.status === "pending" && (
                          <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff8ec", borderRadius: 8, fontSize: "0.8rem", color: "#c98240" }}>
                            Waiting for seller to accept this deal…
                          </div>
                        )}
                        {(tx.status === "seller_accepted" || tx.status === "approved") && (
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "6px 14px" }} disabled={isBusy} onClick={() => updateTxStatus(tx.id, "completed")}>{isBusy ? "…" : "Mark as Approved & Completed"}</button>
                            <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", color: "#c0392b", borderColor: "#f5c6c6" }} disabled={isBusy} onClick={() => updateTxStatus(tx.id, "cancelled")}>Cancel</button>
                          </div>
                        )}
                        <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}

        {/* ── Viewings ── */}
        {tab === "viewings" && (
          viewings.length === 0 ? <div className="section-panel"><p style={{ margin: 0 }}>No viewing requests yet.</p></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {viewings.map(v => {
                const c = STATUS_COLORS[v.status] || STATUS_COLORS.pending;
                const isBusy = updating === v.id + "-v";
                return (
                  <div className="section-panel" key={v.id} style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div><div style={{ fontWeight: 700 }}>{v.property_title}</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{v.property_address}, {v.property_city}</div></div>
                      <span style={{ background: c.bg, color: c.color, padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 600, textTransform: "capitalize" }}>{v.status}</span>
                    </div>
                    <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface-soft)", borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>Buyer: {v.buyer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{v.buyer_email}</div>
                      <div style={{ marginTop: 6, fontSize: "0.85rem" }}>{new Date(v.scheduled_date).toLocaleDateString()} at {v.scheduled_time}</div>
                      {v.notes && <p style={{ margin: "6px 0 0", fontSize: "0.82rem" }}>Note: {v.notes}</p>}
                    </div>
                    {v.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "6px 14px" }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "confirmed")}>{isBusy ? "…" : "Confirm"}</button>
                        <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", color: "#c0392b", borderColor: "#f5c6c6" }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "cancelled")}>Cancel</button>
                      </div>
                    )}
                    {v.status === "confirmed" && (
                      <button className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "6px 14px", marginTop: 10 }} disabled={isBusy} onClick={() => updateViewingStatus(v.id, "completed")}>{isBusy ? "…" : "Mark as Done"}</button>
                    )}
                    <div style={{ marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)" }}>Requested {new Date(v.created_at).toLocaleDateString()}</div>
                  </div>
                );
              })}
            </div>
        )}

        {/* ── Commission ── */}
        {tab === "commission" && (
          <div>
            <div className="section-panel" style={{ marginBottom: 16, background: "linear-gradient(135deg, #1a3a6b, #0c447c)", color: "#fff", border: "none" }}>
              <div style={{ fontSize: "0.8rem", opacity: 0.75, marginBottom: 4 }}>Total commission earned (3% per deal)</div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>${Math.round(totalCommission).toLocaleString()}</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 4 }}>{completedTx.length} completed deal{completedTx.length !== 1 ? "s" : ""}</div>
            </div>
            {completedTx.length === 0 ? <div className="section-panel"><p style={{ margin: 0 }}>No completed deals yet.</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {completedTx.map(tx => (
                  <div className="section-panel" key={tx.id} style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{tx.property_title}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tx.buyer_name} · {tx.transaction_type} · {new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sale price</div>
                      <div style={{ fontWeight: 700 }}>${Number(tx.property_price).toLocaleString()}</div>
                      <div style={{ fontSize: "0.75rem", color: "#1a4fbd", fontWeight: 600 }}>+${Number(tx.commission_amount || Math.round(Number(tx.property_price) * COMMISSION_RATE)).toLocaleString()} commission</div>
                      <div style={{ fontSize: "0.72rem", color: "#2a7d4a" }}>Seller: ${Number(tx.seller_amount || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {/* ── My Profile ── */}
        {tab === "profile" && (
          editingProfile ? (
            <EditProfileForm token={token} profile={profile} onSaved={(u) => { setProfile(p => ({ ...p, ...u })); setEditingProfile(false); }} onCancel={() => setEditingProfile(false)} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
              {/* Header card */}
              <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "24px", background: "linear-gradient(135deg, #0c2340, #1a4fbd)", color: "#fff", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "3px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {profile.profile_picture ? <img src={profile.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.6rem", fontWeight: 800 }}>{profile.avatar_initials || "AG"}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{profile.full_name}</div>
                    <div style={{ opacity: 0.85, fontSize: "0.88rem", marginTop: 2 }}>{profile.title}</div>
                    <div style={{ opacity: 0.7, fontSize: "0.8rem", marginTop: 2 }}>📍 {profile.location}</div>
                    {profile.phone && <div style={{ opacity: 0.7, fontSize: "0.8rem", marginTop: 2 }}>📞 {profile.phone}</div>}
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => setEditingProfile(true)}>Edit Profile</button>
                </div>

                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {profile.bio && <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.75, color: "var(--text-muted)" }}>{profile.bio}</p>}

                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: "0.82rem", padding: "12px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                    <span><strong>{profile.years_experience}</strong> <span style={{ color: "var(--text-muted)" }}>yrs experience</span></span>
                    <span><strong>{profile.closed_deals}</strong> <span style={{ color: "var(--text-muted)" }}>closed deals</span></span>
                    {profile.rating && <span><strong>{Number(profile.rating).toFixed(1)}★</strong> <span style={{ color: "var(--text-muted)" }}>rating</span></span>}
                  </div>

                  {expertise.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Expertise</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {expertise.map(e => <span key={e} style={{ background: "var(--accent-soft)", color: "var(--accent-dark)", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 500 }}>{e}</span>)}
                      </div>
                    </div>
                  )}

                  {services.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Services</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {services.map(s => <span key={s} style={{ background: "var(--surface-soft)", color: "var(--text)", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", border: "1px solid var(--border)" }}>{s}</span>)}
                      </div>
                    </div>
                  )}

                  {certs.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Certifications</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {certs.map(c => <div key={c} style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#2a7d4a", fontWeight: 700 }}>✓</span> {c}</div>)}
                      </div>
                    </div>
                  )}

                  {profile.achievements && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Achievements</div>
                      {profile.achievements.split("\n").filter(Boolean).map((a, i) => (
                        <div key={i} style={{ fontSize: "0.82rem", display: "flex", gap: 8, marginBottom: 4 }}><span>🏆</span> {a}</div>
                      ))}
                    </div>
                  )}

                  {profile.availability && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Availability</div>
                      <p style={{ margin: 0, fontSize: "0.82rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>{profile.availability}</p>
                    </div>
                  )}

                  {(profile.social_linkedin || profile.social_facebook || profile.social_instagram) && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 8, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Social Media</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {profile.social_linkedin  && <a href={profile.social_linkedin}  target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "5px 14px" }}>💼 LinkedIn</a>}
                        {profile.social_facebook  && <a href={profile.social_facebook}  target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "5px 14px" }}>📘 Facebook</a>}
                        {profile.social_instagram && <a href={profile.social_instagram} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "5px 14px" }}>📸 Instagram</a>}
                      </div>
                    </div>
                  )}

                  {testimonials.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Testimonials</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {testimonials.map((t, i) => (
                          <div key={i} style={{ padding: "14px 16px", background: "var(--surface-soft)", borderRadius: 10, border: "1px solid var(--border)" }}>
                            <p style={{ margin: "0 0 8px", fontSize: "0.88rem", fontStyle: "italic", lineHeight: 1.7 }}>"{t.quote}"</p>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.name}</div>
                            {t.property && <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{t.property}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: "10px 14px", background: "#ecf8f0", borderRadius: 8, fontSize: "0.8rem", color: "#2a7d4a" }}>
                    ✓ Your profile is live and visible to buyers and sellers on the Agents page.
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </section>
    </main>
  );
}
