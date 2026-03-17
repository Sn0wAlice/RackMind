const pool = require('../config/database');

module.exports = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getWithTypeCounts() {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(it.id) as type_count
      FROM categories c
      LEFT JOIN item_types it ON it.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    return rows;
  },

  async create({ name, icon, description }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, icon, description, is_default) VALUES (?, ?, ?, 0)',
      [name, icon || 'fa-solid fa-folder', description || null]
    );
    return result.insertId;
  },

  async update(id, { name, icon, description }) {
    await pool.query(
      'UPDATE categories SET name = ?, icon = ?, description = ? WHERE id = ?',
      [name, icon, description || null, id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM categories WHERE id = ? AND is_default = 0', [id]);
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM categories');
    return rows[0].total;
  },
};
