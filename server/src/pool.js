const mysql = require('mysql2');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1697',
  database: process.env.DB_NAME || 'estatehub',
  port: process.env.DB_PORT || 3306,
});
exports.pool = pool;
