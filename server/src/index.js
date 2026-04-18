import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const ALLOWED_ROLES = ["buyer", "seller", "agent", "admin"];

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

// ── JWT helpers ──────────────────────────────────────────────────────────────

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role || "buyer" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

function requireSeller(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "seller" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Seller access required" });
    }
    next();
  });
}

function requireAgent(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "agent" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Agent access required" });
    }
    next();
  });
}

// ── Notification helper ───────────────────────────────────────────────────────
async function createNotification(userId, type, title, message) {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)",
      [userId, type, title, message]
    );
  } catch { /* non-critical */ }
}

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => res.send("EstateHub API is working!"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ── Auth ──────────────────────────────────────────────────────────────────────

async function handleRegister(req, res) {
  const { email, password, fullName, role } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const normalizedRole = ALLOWED_ROLES.includes(role) ? role : "buyer";
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [fullName || null, email, hash, normalizedRole]
    );

    const user = { id: result.insertId, email, full_name: fullName || null, role: normalizedRole };
    const token = createToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("Error registering user", err);
    res.status(500).json({ message: "Registration failed" });
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const [rows] = await db.query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = createToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("Error logging in user", err);
    res.status(500).json({ message: "Login failed" });
  }
}

app.post("/api/register", handleRegister);
app.post("/api/auth/register", handleRegister);
app.post("/api/login", handleLogin);
app.post("/api/auth/login", handleLogin);

// ── Users ─────────────────────────────────────────────────────────────────────

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, email, full_name, role, created_at FROM users");
    res.json(rows);
  } catch (err) {
    console.error("Error loading users", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Properties (public, with filters) ────────────────────────────────────────

app.get("/api/properties/cities", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DISTINCT city FROM properties ORDER BY city ASC");
    res.json(rows.map((r) => r.city));
  } catch (err) {
    console.error("Error loading cities", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/properties", async (req, res) => {
  try {
    const { city, status, min_price, max_price, min_beds, property_type, sort } = req.query;

    const conditions = [];
    const params = [];

    if (city && city !== "Any") {
      conditions.push("city = ?");
      params.push(city);
    }
    if (status && status !== "any") {
      conditions.push("status = ?");
      params.push(status);
    }
    if (min_price) {
      conditions.push("price >= ?");
      params.push(Number(min_price));
    }
    if (max_price) {
      conditions.push("price <= ?");
      params.push(Number(max_price));
    }
    if (min_beds && min_beds !== "0") {
      conditions.push("bedrooms >= ?");
      params.push(Number(min_beds));
    }
    if (property_type && property_type !== "any") {
      conditions.push("property_type = ?");
      params.push(property_type);
    }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    let orderBy = "ORDER BY created_at DESC";
    if (sort === "price_asc") orderBy = "ORDER BY price ASC";
    else if (sort === "price_desc") orderBy = "ORDER BY price DESC";
    else if (sort === "newest") orderBy = "ORDER BY created_at DESC";
    else if (sort === "beds") orderBy = "ORDER BY bedrooms DESC";

    const [rows] = await db.query(
      `SELECT id, title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url, created_at
       FROM properties ${where} ${orderBy}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading properties", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/properties/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM properties WHERE id = ? LIMIT 1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Property not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error loading property", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Agents (public) ───────────────────────────────────────────────────────────

app.get("/api/agents", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, full_name, title, location, bio, avatar_initials, closed_deals, years_experience, rating FROM agents ORDER BY rating DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading agents", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Blog posts (public) ───────────────────────────────────────────────────────

app.get("/api/blog-posts", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, category, read_time_minutes, title, excerpt, created_at FROM blog_posts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading blog posts", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Contact ───────────────────────────────────────────────────────────────────

app.post("/api/contact", async (req, res) => {
  const { fullName, email, phone, topic, message } = req.body || {};
  if (!fullName || !email || !topic || !message)
    return res.status(400).json({ message: "Missing required fields" });
  try {
    await db.query(
      "INSERT INTO contact_messages (full_name, email, phone, topic, message) VALUES (?, ?, ?, ?, ?)",
      [fullName, email, phone || null, topic, message]
    );
    res.status(201).json({ message: "Message received" });
  } catch (err) {
    console.error("Error saving contact message", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Admin: Properties ─────────────────────────────────────────────────────────

app.get("/api/admin/properties", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, address, city, property_type, price, bedrooms, bathrooms, size_sqft, status, image_url, created_at FROM properties ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading admin properties", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/admin/properties", requireAdmin, async (req, res) => {
  const { title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url } = req.body || {};
  if (!title || !address)
    return res.status(400).json({ message: "Title and address are required" });
  try {
    const [result] = await db.query(
      `INSERT INTO properties (title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, address, city || "Unknown",
        property_type || "apartment", description || null,
        Number(price) || 0, Number(bedrooms) || 0, Number(bathrooms) || 0,
        Number(size_sqft) || 0, status || "for_sale", image_url || null,
      ]
    );
    res.status(201).json({ id: result.insertId, message: "Property created" });
  } catch (err) {
    console.error("Error creating property", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/admin/properties/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error("Error deleting property", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Admin: Agents ─────────────────────────────────────────────────────────────

app.get("/api/admin/agents", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM agents ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error loading admin agents", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/admin/agents", requireAdmin, async (req, res) => {
  const { full_name, title, location, bio, avatar_initials, closed_deals, years_experience, rating } = req.body || {};
  if (!full_name) return res.status(400).json({ message: "Full name is required" });
  try {
    const [result] = await db.query(
      "INSERT INTO agents (full_name, title, location, bio, avatar_initials, closed_deals, years_experience, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [full_name, title || null, location || null, bio || null, avatar_initials || null,
       Number(closed_deals) || 0, Number(years_experience) || 0, rating ? Number(rating) : null]
    );
    res.status(201).json({ id: result.insertId, message: "Agent created" });
  } catch (err) {
    console.error("Error creating agent", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/admin/agents/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM agents WHERE id = ?", [req.params.id]);
    res.json({ message: "Agent deleted" });
  } catch (err) {
    console.error("Error deleting agent", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Admin: Blog posts ─────────────────────────────────────────────────────────

app.get("/api/admin/blog-posts", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM blog_posts ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error loading admin blog posts", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/admin/blog-posts", requireAdmin, async (req, res) => {
  const { category, read_time_minutes, title, excerpt } = req.body || {};
  if (!category || !title) return res.status(400).json({ message: "Category and title are required" });
  try {
    const [result] = await db.query(
      "INSERT INTO blog_posts (category, read_time_minutes, title, excerpt) VALUES (?, ?, ?, ?)",
      [category, Number(read_time_minutes) || 5, title, excerpt || ""]
    );
    res.status(201).json({ id: result.insertId, message: "Blog post created" });
  } catch (err) {
    console.error("Error creating blog post", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/admin/blog-posts/:id", requireAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM blog_posts WHERE id = ?", [req.params.id]);
    res.json({ message: "Blog post deleted" });
  } catch (err) {
    console.error("Error deleting blog post", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Admin: Inquiries ──────────────────────────────────────────────────────────

app.get("/api/admin/inquiries", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pi.id, pi.message, pi.status, pi.created_at,
              u.full_name AS buyer_name, u.email AS buyer_email,
              p.title AS property_title, p.city AS property_city
       FROM property_inquiries pi
       JOIN users u ON u.id = pi.buyer_id
       JOIN properties p ON p.id = pi.property_id
       ORDER BY pi.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading inquiries", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "replied", "closed"].includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    await db.query("UPDATE property_inquiries SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Inquiry updated" });
  } catch (err) {
    console.error("Error updating inquiry", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Buyer: Saved properties ───────────────────────────────────────────────────

app.get("/api/buyer/saved-properties", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.title, p.address, p.city, p.property_type, p.price,
              p.bedrooms, p.bathrooms, p.size_sqft, p.status, p.image_url,
              sp.created_at AS saved_at
       FROM saved_properties sp
       JOIN properties p ON p.id = sp.property_id
       WHERE sp.buyer_id = ?
       ORDER BY sp.created_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading saved properties", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/buyer/saved-properties", requireAuth, async (req, res) => {
  const { property_id } = req.body || {};
  if (!property_id) return res.status(400).json({ message: "property_id is required" });
  try {
    await db.query(
      "INSERT IGNORE INTO saved_properties (buyer_id, property_id) VALUES (?, ?)",
      [req.user.sub, property_id]
    );
    res.status(201).json({ message: "Property saved" });
  } catch (err) {
    console.error("Error saving property", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/buyer/saved-properties/:propertyId", requireAuth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM saved_properties WHERE buyer_id = ? AND property_id = ?",
      [req.user.sub, req.params.propertyId]
    );
    res.json({ message: "Property unsaved" });
  } catch (err) {
    console.error("Error unsaving property", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Buyer: Inquiries ──────────────────────────────────────────────────────────

app.get("/api/buyer/inquiries", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pi.id, pi.message, pi.status, pi.created_at,
              p.title AS property_title, p.address AS property_address,
              p.city AS property_city, p.image_url AS property_image
       FROM property_inquiries pi
       JOIN properties p ON p.id = pi.property_id
       WHERE pi.buyer_id = ?
       ORDER BY pi.created_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading buyer inquiries", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/buyer/inquiries", requireAuth, async (req, res) => {
  const { property_id, message } = req.body || {};
  if (!property_id || !message)
    return res.status(400).json({ message: "property_id and message are required" });
  try {
    const [result] = await db.query(
      "INSERT INTO property_inquiries (buyer_id, property_id, message) VALUES (?, ?, ?)",
      [req.user.sub, property_id, message]
    );
    res.status(201).json({ id: result.insertId, message: "Inquiry submitted" });
  } catch (err) {
    console.error("Error submitting inquiry", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Buyer: Transactions (agent selection + purchase/rent) ─────────────────────

app.get("/api/buyer/transactions", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pt.id, pt.transaction_type, pt.status, pt.notes, pt.created_at,
              p.title AS property_title, p.address AS property_address,
              p.city AS property_city, p.price AS property_price,
              p.image_url AS property_image, p.status AS property_status,
              a.full_name AS agent_name, a.title AS agent_title,
              a.rating AS agent_rating, a.years_experience AS agent_experience,
              a.closed_deals AS agent_closed_deals, a.avatar_initials AS agent_initials
       FROM property_transactions pt
       JOIN properties p ON p.id = pt.property_id
       JOIN agents a ON a.id = pt.agent_id
       WHERE pt.buyer_id = ?
       ORDER BY pt.created_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading buyer transactions", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/buyer/transactions", requireAuth, async (req, res) => {
  const { property_id, agent_id, transaction_type, notes, payment_method } = req.body || {};
  if (!property_id || !agent_id || !transaction_type)
    return res.status(400).json({ message: "property_id, agent_id, and transaction_type are required" });
  if (!["purchase", "rent"].includes(transaction_type))
    return res.status(400).json({ message: "transaction_type must be purchase or rent" });
  const normalizedPayment = ["cash", "card"].includes(payment_method) ? payment_method : "cash";
  try {
    const [result] = await db.query(
      "INSERT INTO property_transactions (buyer_id, property_id, agent_id, transaction_type, notes, payment_method) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.sub, property_id, agent_id, transaction_type, notes || null, normalizedPayment]
    );
    res.status(201).json({ id: result.insertId, message: "Transaction submitted" });
  } catch (err) {
    console.error("Error creating transaction", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Admin: Transactions ───────────────────────────────────────────────────────

app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pt.id, pt.transaction_type, pt.status, pt.notes, pt.created_at,
              u.full_name AS buyer_name, u.email AS buyer_email,
              p.title AS property_title, p.city AS property_city, p.price AS property_price,
              a.full_name AS agent_name, a.title AS agent_title
       FROM property_transactions pt
       JOIN users u ON u.id = pt.buyer_id
       JOIN properties p ON p.id = pt.property_id
       JOIN agents a ON a.id = pt.agent_id
       ORDER BY pt.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error loading admin transactions", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/admin/transactions/:id", requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "approved", "completed", "cancelled"].includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    await db.query("UPDATE property_transactions SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Transaction updated" });
  } catch (err) {
    console.error("Error updating transaction", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Buyer: Saved IDs (for checking which properties are saved) ────────────────

app.get("/api/buyer/saved-ids", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT property_id FROM saved_properties WHERE buyer_id = ?",
      [req.user.sub]
    );
    res.json(rows.map((r) => r.property_id));
  } catch (err) {
    console.error("Error loading saved IDs", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Seller: Properties ────────────────────────────────────────────────────────

app.get("/api/seller/properties", requireSeller, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM properties WHERE seller_id = ? ORDER BY created_at DESC",
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/seller/properties", requireSeller, async (req, res) => {
  const { title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url } = req.body || {};
  if (!title || !address) return res.status(400).json({ message: "Title and address are required" });
  try {
    const [result] = await db.query(
      `INSERT INTO properties (title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url, seller_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, address, city || "Unknown", property_type || "apartment", description || null,
       Number(price) || 0, Number(bedrooms) || 0, Number(bathrooms) || 0,
       Number(size_sqft) || 0, status || "for_sale", image_url || null, req.user.sub]
    );
    res.status(201).json({ id: result.insertId, message: "Property listed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.delete("/api/seller/properties/:id", requireSeller, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT seller_id FROM properties WHERE id = ?", [req.params.id]);
    if (!rows.length || String(rows[0].seller_id) !== String(req.user.sub)) {
      return res.status(403).json({ message: "Not your property" });
    }
    await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/seller/inquiries", requireSeller, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pi.id, pi.message, pi.status, pi.created_at,
              u.full_name AS buyer_name, u.email AS buyer_email,
              p.title AS property_title, p.city AS property_city
       FROM property_inquiries pi
       JOIN users u ON u.id = pi.buyer_id
       JOIN properties p ON p.id = pi.property_id
       WHERE p.seller_id = ?
       ORDER BY pi.created_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/seller/transactions", requireSeller, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pt.id, pt.transaction_type, pt.status, pt.payment_method, pt.notes, pt.created_at,
              u.full_name AS buyer_name, u.email AS buyer_email,
              p.title AS property_title, p.price AS property_price, p.city AS property_city,
              a.full_name AS agent_name
       FROM property_transactions pt
       JOIN users u ON u.id = pt.buyer_id
       JOIN properties p ON p.id = pt.property_id
       JOIN agents a ON a.id = pt.agent_id
       WHERE p.seller_id = ?
       ORDER BY pt.created_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Agent: Transactions & Commission ─────────────────────────────────────────

app.get("/api/agent/profile", requireAgent, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM agents WHERE LOWER(full_name) LIKE LOWER(CONCAT('%', ?, '%')) LIMIT 1",
      [req.user.email.split("@")[0]]
    );
    // fallback: return first agent if no name match (demo)
    if (!rows.length) {
      const [all] = await db.query("SELECT * FROM agents LIMIT 1");
      return res.json(all[0] || null);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/agent/transactions", requireAgent, async (req, res) => {
  try {
    // For demo: agents table has id separate from users table.
    // We join by getting all transactions and showing them to any agent.
    const [rows] = await db.query(
      `SELECT pt.id, pt.transaction_type, pt.status, pt.payment_method, pt.notes, pt.created_at,
              u.full_name AS buyer_name, u.email AS buyer_email,
              p.title AS property_title, p.price AS property_price,
              p.city AS property_city, p.image_url AS property_image,
              a.full_name AS agent_name, a.id AS agent_id
       FROM property_transactions pt
       JOIN users u ON u.id = pt.buyer_id
       JOIN properties p ON p.id = pt.property_id
       JOIN agents a ON a.id = pt.agent_id
       ORDER BY pt.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/agent/transactions/:id", requireAgent, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "approved", "completed", "cancelled"].includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    const [rows] = await db.query(
      "SELECT pt.buyer_id, p.title FROM property_transactions pt JOIN properties p ON p.id = pt.property_id WHERE pt.id = ?",
      [req.params.id]
    );
    await db.query("UPDATE property_transactions SET status = ? WHERE id = ?", [status, req.params.id]);
    if (rows.length) {
      const msgMap = { approved: "approved ✅", completed: "marked as completed 🎉", cancelled: "cancelled ❌" };
      if (msgMap[status]) {
        await createNotification(rows[0].buyer_id, "transaction", `Transaction ${msgMap[status]}`,
          `Your request for "${rows[0].title}" has been ${msgMap[status]}.`);
      }
    }
    res.json({ message: "Transaction updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Viewings ──────────────────────────────────────────────────────────────────

app.post("/api/buyer/viewings", requireAuth, async (req, res) => {
  const { property_id, agent_id, scheduled_date, scheduled_time, notes } = req.body || {};
  if (!property_id || !scheduled_date || !scheduled_time)
    return res.status(400).json({ message: "property_id, scheduled_date, and scheduled_time are required" });
  try {
    const [result] = await db.query(
      "INSERT INTO viewings (buyer_id, property_id, agent_id, scheduled_date, scheduled_time, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.sub, property_id, agent_id || null, scheduled_date, scheduled_time, notes || null]
    );
    // Notify all agents (demo)
    const [agentUsers] = await db.query("SELECT id FROM users WHERE role = 'agent'");
    const [prop] = await db.query("SELECT title FROM properties WHERE id = ?", [property_id]);
    for (const au of agentUsers) {
      await createNotification(au.id, "viewing", "New Viewing Request",
        `A buyer requested a viewing for "${prop[0]?.title}" on ${scheduled_date} at ${scheduled_time}.`);
    }
    res.status(201).json({ id: result.insertId, message: "Viewing scheduled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/buyer/viewings", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, p.title AS property_title, p.city AS property_city, p.image_url AS property_image
       FROM viewings v
       JOIN properties p ON p.id = v.property_id
       WHERE v.buyer_id = ?
       ORDER BY v.scheduled_date DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/agent/viewings", requireAgent, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, p.title AS property_title, p.city AS property_city, p.address AS property_address,
              u.full_name AS buyer_name, u.email AS buyer_email
       FROM viewings v
       JOIN properties p ON p.id = v.property_id
       JOIN users u ON u.id = v.buyer_id
       ORDER BY v.scheduled_date ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/agent/viewings/:id", requireAgent, async (req, res) => {
  const { status } = req.body || {};
  if (!["pending", "confirmed", "cancelled", "completed"].includes(status))
    return res.status(400).json({ message: "Invalid status" });
  try {
    const [rows] = await db.query(
      "SELECT v.buyer_id, p.title FROM viewings v JOIN properties p ON p.id = v.property_id WHERE v.id = ?",
      [req.params.id]
    );
    await db.query("UPDATE viewings SET status = ? WHERE id = ?", [status, req.params.id]);
    if (rows.length) {
      const label = status === "confirmed" ? "confirmed ✅" : status === "cancelled" ? "cancelled ❌" : status;
      await createNotification(rows[0].buyer_id, "viewing", `Viewing ${label}`,
        `Your viewing for "${rows[0].title}" has been ${label}.`);
    }
    res.json({ message: "Viewing updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Messages ──────────────────────────────────────────────────────────────────

app.get("/api/messages", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*,
              s.full_name AS sender_name, s.role AS sender_role,
              r.full_name AS receiver_name, r.role AS receiver_role,
              p.title AS property_title
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       JOIN users r ON r.id = m.receiver_id
       LEFT JOIN properties p ON p.id = m.property_id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.created_at ASC`,
      [req.user.sub, req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/api/messages", requireAuth, async (req, res) => {
  const { receiver_id, content, property_id } = req.body || {};
  if (!receiver_id || !content) return res.status(400).json({ message: "receiver_id and content are required" });
  try {
    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, property_id, content) VALUES (?, ?, ?, ?)",
      [req.user.sub, receiver_id, property_id || null, content]
    );
    const [sender] = await db.query("SELECT full_name FROM users WHERE id = ?", [req.user.sub]);
    await createNotification(receiver_id, "message", "New Message",
      `${sender[0]?.full_name || "Someone"} sent you a message.`);
    res.status(201).json({ id: result.insertId, message: "Message sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/messages/conversation/:userId", requireAuth, async (req, res) => {
  const other = req.params.userId;
  try {
    const [rows] = await db.query(
      `SELECT m.*, s.full_name AS sender_name, p.title AS property_title
       FROM messages m
       JOIN users s ON s.id = m.sender_id
       LEFT JOIN properties p ON p.id = m.property_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [req.user.sub, other, other, req.user.sub]
    );
    await db.query("UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?", [req.user.sub, other]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/api/messages/contacts", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT
         IF(m.sender_id = ?, m.receiver_id, m.sender_id) AS contact_id,
         u.full_name AS contact_name, u.role AS contact_role,
         MAX(m.created_at) AS last_message_at,
         SUM(IF(m.receiver_id = ? AND m.is_read = 0, 1, 0)) AS unread_count
       FROM messages m
       JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY contact_id, contact_name, contact_role
       ORDER BY last_message_at DESC`,
      [req.user.sub, req.user.sub, req.user.sub, req.user.sub, req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Notifications ─────────────────────────────────────────────────────────────

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30",
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.user.sub]);
    res.json({ message: "Marked read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.sub]);
    res.json({ message: "All marked read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// ── Auto-notify on new inquiry ─────────────────────────────────────────────────
// patch existing contact route to also notify seller
app.post("/api/buyer/inquiries/notify", requireAuth, async (req, res) => {
  res.json({ ok: true }); // placeholder, handled inline
});

app.listen(PORT, () =>
  console.log(`EstateHub API listening on http://localhost:${PORT}`)
);
