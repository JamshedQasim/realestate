import dotenv from "dotenv";
dotenv.config();

import db from "./src/db.js";

async function migrate() {
  console.log("Running EstateHub database migration…\n");

  // ── 1. Add columns to properties if missing ──────────────────────────────
  const alterSteps = [
    {
      label: "Add city column to properties",
      sql: "ALTER TABLE properties ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT 'Unknown' AFTER address",
    },
    {
      label: "Add property_type column to properties",
      sql: "ALTER TABLE properties ADD COLUMN property_type ENUM('apartment','house','condo','studio','penthouse') NOT NULL DEFAULT 'apartment' AFTER city",
    },
    {
      label: "Add description column to properties",
      sql: "ALTER TABLE properties ADD COLUMN description TEXT NULL AFTER property_type",
    },
  ];

  for (const step of alterSteps) {
    try {
      await db.query(step.sql);
      console.log(`  ✓ ${step.label}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log(`  – ${step.label} (already exists, skipped)`);
      } else {
        throw err;
      }
    }
  }

  // ── 2. Create saved_properties table ─────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_properties (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      buyer_id BIGINT UNSIGNED NOT NULL,
      property_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_saved (buyer_id, property_id),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);
  console.log("  ✓ saved_properties table ready");

  // ── 3. Create property_inquiries table ───────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS property_inquiries (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      buyer_id BIGINT UNSIGNED NOT NULL,
      property_id BIGINT UNSIGNED NOT NULL,
      message TEXT NOT NULL,
      status ENUM('pending','replied','closed') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);
  console.log("  ✓ property_inquiries table ready");

  // ── 4. Back-fill city + property_type on the 4 original seed rows ────────
  const backfill = [
    { title: "Skyline Loft Apartment",  city: "New York",    type: "apartment" },
    { title: "Willow Creek Residence",  city: "Seattle",     type: "house"     },
    { title: "Oceanview Penthouse",     city: "Los Angeles", type: "penthouse" },
    { title: "Citylight Studio",        city: "New York",    type: "studio"    },
  ];

  for (const row of backfill) {
    await db.query(
      "UPDATE properties SET city = ?, property_type = ? WHERE title = ? AND city = 'Unknown'",
      [row.city, row.type, row.title]
    );
  }
  console.log("  ✓ Original seed rows back-filled with city & type");

  // ── 5. Insert new seed properties (skip if already present by title) ─────
  const newProperties = [
    {
      title: "Brooklyn Heights Condo",
      address: "55 Montague Street",
      city: "New York",
      property_type: "condo",
      description: "Bright corner condo with hardwood floors, updated kitchen, and private balcony overlooking tree-lined streets.",
      price: 189000, bedrooms: 2, bathrooms: 2, size_sqft: 1150,
      status: "for_sale",
      image_url: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Malibu Beach House",
      address: "7 Pacific Coast Highway",
      city: "Los Angeles",
      property_type: "house",
      description: "Stunning beachfront home with direct sand access, wraparound deck, and breathtaking sunset views.",
      price: 520000, bedrooms: 4, bathrooms: 4, size_sqft: 3200,
      status: "for_sale",
      image_url: "https://images.pexels.com/photos/731082/pexels-photo-731082.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Capitol Hill Apartment",
      address: "220 Broadway East",
      city: "Seattle",
      property_type: "apartment",
      description: "Trendy apartment in Capitol Hill with rooftop access, in-unit laundry, and steps from restaurants and nightlife.",
      price: 1850, bedrooms: 1, bathrooms: 1, size_sqft: 720,
      status: "for_rent",
      image_url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Manhattan Luxury Condo",
      address: "100 Central Park South",
      city: "New York",
      property_type: "condo",
      description: "Exquisite condo overlooking Central Park with white-glove service, private gym, and heated underground parking.",
      price: 890000, bedrooms: 3, bathrooms: 3, size_sqft: 2100,
      status: "for_sale",
      image_url: "https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Chicago River Apartment",
      address: "401 N Wabash Ave",
      city: "Chicago",
      property_type: "apartment",
      description: "Modern apartment with river views, open floor plan, and access to building pool and fitness center.",
      price: 2200, bedrooms: 2, bathrooms: 2, size_sqft: 1050,
      status: "for_rent",
      image_url: "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Hyde Park Townhouse",
      address: "5450 S Cornell Ave",
      city: "Chicago",
      property_type: "house",
      description: "Charming brick townhouse with three floors, private garden, original woodwork, and updated systems throughout.",
      price: 375000, bedrooms: 3, bathrooms: 2, size_sqft: 1900,
      status: "for_sale",
      image_url: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "South Beach Studio",
      address: "1500 Collins Avenue",
      city: "Miami",
      property_type: "studio",
      description: "Stylish studio steps from South Beach, recently renovated with designer finishes and access to a resort-style pool.",
      price: 1650, bedrooms: 0, bathrooms: 1, size_sqft: 580,
      status: "for_rent",
      image_url: "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      title: "Brickell Penthouse",
      address: "888 Brickell Ave",
      city: "Miami",
      property_type: "penthouse",
      description: "Ultra-luxury penthouse with 270-degree city and bay views, private pool, and full smart home automation.",
      price: 750000, bedrooms: 4, bathrooms: 5, size_sqft: 4200,
      status: "for_sale",
      image_url: "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ];

  let inserted = 0;
  for (const p of newProperties) {
    const [existing] = await db.query("SELECT id FROM properties WHERE title = ? LIMIT 1", [p.title]);
    if (existing.length) continue;
    await db.query(
      `INSERT INTO properties (title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.title, p.address, p.city, p.property_type, p.description, p.price, p.bedrooms, p.bathrooms, p.size_sqft, p.status, p.image_url]
    );
    inserted++;
  }
  console.log(`  ✓ ${inserted} new properties inserted (${newProperties.length - inserted} already existed)`);

  // ── 6. Create property_transactions table ────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS property_transactions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      buyer_id BIGINT UNSIGNED NOT NULL,
      property_id BIGINT UNSIGNED NOT NULL,
      agent_id BIGINT UNSIGNED NOT NULL,
      transaction_type ENUM('purchase','rent') NOT NULL DEFAULT 'purchase',
      status ENUM('pending','approved','seller_accepted','completed','cancelled') NOT NULL DEFAULT 'pending',
      notes TEXT NULL,
      payment_method ENUM('cash','card') NOT NULL DEFAULT 'cash',
      commission_amount DECIMAL(12,2) NULL,
      seller_amount DECIMAL(12,2) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);
  console.log("  ✓ property_transactions table ready");

  // ── 7. Add seller_id to properties if missing ────────────────────────────
  const step7 = [
    {
      label: "Add seller_id column to properties",
      sql: "ALTER TABLE properties ADD COLUMN seller_id BIGINT UNSIGNED NULL AFTER image_url",
    },
    {
      label: "Extend properties status ENUM with sold/rented",
      sql: "ALTER TABLE properties MODIFY COLUMN status ENUM('for_sale','for_rent','sold','rented') NOT NULL DEFAULT 'for_sale'",
    },
    {
      label: "Extend property_transactions status ENUM",
      sql: "ALTER TABLE property_transactions MODIFY COLUMN status ENUM('pending','approved','seller_accepted','completed','cancelled') NOT NULL DEFAULT 'pending'",
    },
    {
      label: "Add payment_method column to property_transactions",
      sql: "ALTER TABLE property_transactions ADD COLUMN payment_method ENUM('cash','card') NOT NULL DEFAULT 'cash' AFTER notes",
    },
    {
      label: "Add commission_amount column to property_transactions",
      sql: "ALTER TABLE property_transactions ADD COLUMN commission_amount DECIMAL(12,2) NULL AFTER payment_method",
    },
    {
      label: "Add seller_amount column to property_transactions",
      sql: "ALTER TABLE property_transactions ADD COLUMN seller_amount DECIMAL(12,2) NULL AFTER commission_amount",
    },
  ];

  for (const step of step7) {
    try {
      await db.query(step.sql);
      console.log(`  ✓ ${step.label}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_DUP_KEYNAME") {
        console.log(`  – ${step.label} (already exists, skipped)`);
      } else {
        // MODIFY can fail if column already has correct definition — log and continue
        console.log(`  – ${step.label} (skipped: ${err.message})`);
      }
    }
  }

  // ── 8. Create viewings table ──────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS viewings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      buyer_id BIGINT UNSIGNED NOT NULL,
      property_id BIGINT UNSIGNED NOT NULL,
      agent_id BIGINT UNSIGNED NULL,
      scheduled_date DATE NOT NULL,
      scheduled_time TIME NOT NULL,
      notes TEXT NULL,
      status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `);
  console.log("  ✓ viewings table ready");

  console.log("\nMigration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
