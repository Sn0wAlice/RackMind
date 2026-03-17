const pool = require('../config/database');

module.exports = {
  async getForItem(itemId) {
    const [rows] = await pool.query(`
      SELECT ic.*, u.username
      FROM item_comments ic
      JOIN users u ON u.id = ic.user_id
      WHERE ic.item_id = ?
      ORDER BY ic.created_at ASC
    `, [itemId]);
    return rows;
  },

  async create(itemId, userId, body) {
    const [result] = await pool.query(
      'INSERT INTO item_comments (item_id, user_id, body) VALUES (?, ?, ?)',
      [itemId, userId, body]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT ic.*, u.username FROM item_comments ic
      JOIN users u ON u.id = ic.user_id
      WHERE ic.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async update(id, userId, body) {
    await pool.query(
      'UPDATE item_comments SET body = ? WHERE id = ? AND user_id = ?',
      [body, id, userId]
    );
  },

  async delete(id, userId) {
    await pool.query('DELETE FROM item_comments WHERE id = ? AND user_id = ?', [id, userId]);
  },

  async countForItem(itemId) {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM item_comments WHERE item_id = ?', [itemId]);
    return rows[0].total;
  },
};
