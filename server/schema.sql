-- EstateHub database schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS estatehub;
USE estatehub;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  role ENUM('buyer','seller','agent','admin') NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Unknown',
  property_type ENUM('apartment','house','condo','studio','penthouse') NOT NULL DEFAULT 'apartment',
  description TEXT NULL,
  price INT NOT NULL,
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms INT NOT NULL DEFAULT 0,
  size_sqft INT NOT NULL DEFAULT 0,
  status ENUM('for_sale','for_rent','sold','rented') NOT NULL DEFAULT 'for_sale',
  image_url TEXT NULL,
  seller_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS agents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  bio TEXT NULL,
  expertise TEXT NULL,
  credentials TEXT NULL,
  services TEXT NULL,
  social_linkedin VARCHAR(255) NULL,
  social_facebook VARCHAR(255) NULL,
  social_instagram VARCHAR(255) NULL,
  achievements TEXT NULL,
  availability TEXT NULL,
  certifications TEXT NULL,
  areas_covered TEXT NULL,
  testimonials TEXT NULL,
  avatar_initials VARCHAR(10) NULL,
  phone VARCHAR(50) NULL,
  profile_picture VARCHAR(500) NULL,
  closed_deals INT NOT NULL DEFAULT 0,
  years_experience INT NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agents_user (user_id)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(64) NOT NULL,
  read_time_minutes INT NOT NULL DEFAULT 5,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NULL,
  topic VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS saved_properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buyer_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved (buyer_id, property_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

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
);

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
);

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
);

-- Properties are listed by registered sellers via the seller dashboard.

-- Agents are self-registered: users with role='agent' complete their profile via the agent dashboard.

INSERT INTO blog_posts (category, read_time_minutes, title, excerpt) VALUES
  ('Market', 5, 'How to read today''s housing prices',
   'A straightforward guide to understanding list price vs. sale price, days on market, and what they mean for your offer.'),
  ('Renting', 4, 'Checklist for your first apartment',
   'From credit checks to move-in inspections, here''s what to expect so you can sign your lease with confidence.'),
  ('Selling', 6, 'Simple upgrades that boost value',
   'Low-cost improvements that can make a big difference in photos, showings, and final offers.');
