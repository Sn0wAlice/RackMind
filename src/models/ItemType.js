const pool = require('../config/database');

module.exports = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT it.*, c.name as category_name, c.icon as category_icon
      FROM item_types it
      JOIN categories c ON c.id = it.category_id
      ORDER BY c.name, it.name
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT it.*, c.name as category_name, c.icon as category_icon
      FROM item_types it
      JOIN categories c ON c.id = it.category_id
      WHERE it.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async getByCategoryId(categoryId) {
    const [rows] = await pool.query(
      'SELECT * FROM item_types WHERE category_id = ? ORDER BY name',
      [categoryId]
    );
    return rows;
  },

  async create({ categoryId, name, icon, description }) {
    const [result] = await pool.query(
      'INSERT INTO item_types (category_id, name, icon, description, is_default) VALUES (?, ?, ?, ?, 0)',
      [categoryId, name, icon || 'fa-solid fa-cube', description || null]
    );
    return result.insertId;
  },

  async update(id, { name, icon, description }) {
    await pool.query(
      'UPDATE item_types SET name = ?, icon = ?, description = ? WHERE id = ?',
      [name, icon, description || null, id]
    );
  },

  async delete(id) {
    const [items] = await pool.query('SELECT COUNT(*) as total FROM items WHERE item_type_id = ?', [id]);
    if (items[0].total > 0) {
      throw new Error('Cannot delete type: items still reference it.');
    }
    await pool.query('DELETE FROM item_types WHERE id = ? AND is_default = 0', [id]);
  },
};
