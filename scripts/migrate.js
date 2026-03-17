require('dotenv').config();

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'migrations');

async function connectWithRetry(config, retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await mysql.createConnection(config);
      return connection;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Waiting for MySQL... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function run() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'rackmind',
    password: process.env.DB_PASSWORD || 'rackmind_secret',
    database: process.env.DB_NAME || 'rackmind',
    multipleStatements: true,
  };

  console.log('Connecting to MySQL...');
  const connection = await connectWithRetry(config);
  console.log('Connected to MySQL.');

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [executed] = await connection.query('SELECT name FROM _migrations ORDER BY id');
    const executedNames = new Set(executed.map((r) => r.name));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`  Skip: ${file} (already executed)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  Running: ${file}...`);
      await connection.query(sql);
      await connection.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`  Done: ${file}`);
    }

    // Seed default admin if no users exist
    const [users] = await connection.query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      const username = process.env.DEFAULT_ADMIN_USER || 'admin';
      const password = process.env.DEFAULT_ADMIN_PASS || 'admin';
      const hash = await bcrypt.hash(password, 10);
      await connection.query(
        'INSERT INTO users (username, password_hash, must_change_password) VALUES (?, ?, 1)',
        [username, hash]
      );
      console.log(`  Default admin user "${username}" created.`);
    }

    console.log('Migrations complete.');
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
