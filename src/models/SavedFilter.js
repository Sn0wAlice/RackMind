const pool = require('../config/database');

module.exports = {
  async getForUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM saved_filters WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async create(userId, name, filters) {
    const [result] = await pool.query(
      'INSERT INTO saved_filters (user_id, name, filters) VALUES (?, ?, ?)',
      [userId, name, JSON.stringify(filters)]
    );
    return result.insertId;
  },

  async delete(id, userId) {
    await pool.query('DELETE FROM saved_filters WHERE id = ? AND user_id = ?', [id, userId]);
  },
};
