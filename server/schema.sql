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
  status ENUM('for_sale','for_rent') NOT NULL DEFAULT 'for_sale',
  image_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS agents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  bio TEXT NULL,
  avatar_initials VARCHAR(10) NULL,
  closed_deals INT NOT NULL DEFAULT 0,
  years_experience INT NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
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

-- Seed sample data
INSERT INTO properties (title, address, city, property_type, description, price, bedrooms, bathrooms, size_sqft, status, image_url) VALUES
  ('Skyline Loft Apartment', '4651 South Burlington Ave', 'New York', 'apartment',
   'Modern loft with stunning city views, exposed brick walls, and an open-plan kitchen. Walking distance to public transit and top restaurants.',
   154000, 3, 3, 1200, 'for_sale',
   'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Willow Creek Residence', '8412 Willow Creek Drive', 'Seattle', 'house',
   'Spacious family home in a quiet neighborhood with a large backyard, modern kitchen, and attached two-car garage.',
   245000, 4, 3, 2400, 'for_sale',
   'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Oceanview Penthouse', '19 Seaside Avenue', 'Los Angeles', 'penthouse',
   'Luxurious penthouse with panoramic ocean views, private terrace, gourmet kitchen, and concierge service.',
   310000, 2, 2, 1800, 'for_sale',
   'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Citylight Studio', '4210 Elm Street', 'New York', 'studio',
   'Cozy studio in the heart of the city, perfect for young professionals. Floor-to-ceiling windows and modern finishes.',
   98000, 1, 1, 950, 'for_sale',
   'https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Brooklyn Heights Condo', '55 Montague Street', 'New York', 'condo',
   'Bright corner condo with hardwood floors, updated kitchen, and private balcony overlooking tree-lined streets.',
   189000, 2, 2, 1150, 'for_sale',
   'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Malibu Beach House', '7 Pacific Coast Highway', 'Los Angeles', 'house',
   'Stunning beachfront home with direct sand access, wraparound deck, and breathtaking sunset views.',
   520000, 4, 4, 3200, 'for_sale',
   'https://images.pexels.com/photos/731082/pexels-photo-731082.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Capitol Hill Apartment', '220 Broadway East', 'Seattle', 'apartment',
   'Trendy apartment in Capitol Hill with rooftop access, in-unit laundry, and steps from restaurants and nightlife.',
   1850, 1, 1, 720, 'for_rent',
   'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Manhattan Luxury Condo', '100 Central Park South', 'New York', 'condo',
   'Exquisite condo overlooking Central Park with white-glove service, private gym, and heated underground parking.',
   890000, 3, 3, 2100, 'for_sale',
   'https://images.pexels.com/photos/2079234/pexels-photo-2079234.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Chicago River Apartment', '401 N Wabash Ave', 'Chicago', 'apartment',
   'Modern apartment with river views, open floor plan, and access to building pool and fitness center.',
   2200, 2, 2, 1050, 'for_rent',
   'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Hyde Park Townhouse', '5450 S Cornell Ave', 'Chicago', 'house',
   'Charming brick townhouse with three floors, private garden, original woodwork, and updated systems throughout.',
   375000, 3, 2, 1900, 'for_sale',
   'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('South Beach Studio', '1500 Collins Avenue', 'Miami', 'studio',
   'Stylish studio steps from South Beach, recently renovated with designer finishes and access to a resort-style pool.',
   1650, 0, 1, 580, 'for_rent',
   'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Brickell Penthouse', '888 Brickell Ave', 'Miami', 'penthouse',
   'Ultra-luxury penthouse with 270-degree city and bay views, private pool, and full smart home automation.',
   750000, 4, 5, 4200, 'for_sale',
   'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800');

INSERT INTO agents (full_name, title, location, bio, avatar_initials, closed_deals, years_experience, rating) VALUES
  ('Marta Greene', 'Senior Buying Specialist', 'Manhattan',
   'Focused on condos and new-build developments, with a reputation for winning competitive bids without overpaying.',
   'MG', 120, 8, 4.9),
  ('Jonas Baird', 'Family Homes', 'Brooklyn',
   'Guides growing families through upsizing, with deep knowledge of school zones, parks, and transit.',
   'JB', 95, 6, 4.9),
  ('Lena Shore', 'Waterfront & Luxury', 'Coastal',
   'Specializes in high-end and waterfront properties, offering bespoke tours and discreet negotiation support.',
   'LS', 87, 10, 4.8);

INSERT INTO blog_posts (category, read_time_minutes, title, excerpt) VALUES
  ('Market', 5, 'How to read today''s housing prices',
   'A straightforward guide to understanding list price vs. sale price, days on market, and what they mean for your offer.'),
  ('Renting', 4, 'Checklist for your first apartment',
   'From credit checks to move-in inspections, here''s what to expect so you can sign your lease with confidence.'),
  ('Selling', 6, 'Simple upgrades that boost value',
   'Low-cost improvements that can make a big difference in photos, showings, and final offers.');
