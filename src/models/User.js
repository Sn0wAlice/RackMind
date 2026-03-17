const pool = require('../config/database');

module.exports = {
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await pool.query('SELECT id, username, email, role, must_change_password, created_at FROM users ORDER BY created_at DESC');
    return rows;
  },

  async create({ username, email, passwordHash, mustChangePassword = false, role = 'editor' }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, must_change_password, role) VALUES (?, ?, ?, ?, ?)',
      [username, email || null, passwordHash, mustChangePassword ? 1 : 0, role]
    );
    return result.insertId;
  },

  async updateRole(id, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  },

  async updatePassword(id, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
      [passwordHash, id]
    );
  },

  async updateProfile(id, { username, email }) {
    await pool.query(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username, email || null, id]
    );
  },

  async delete(id) {
    const [count] = await pool.query('SELECT COUNT(*) as total FROM users');
    if (count[0].total <= 1) {
      throw new Error('Cannot delete the last user.');
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
  },
};
