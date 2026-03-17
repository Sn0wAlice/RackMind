const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'rackmind',
  password: process.env.DB_PASSWORD || 'rackmind_secret',
  database: process.env.DB_NAME || 'rackmind',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true,
});

module.exports = pool;
