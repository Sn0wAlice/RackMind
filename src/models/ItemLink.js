const pool = require('../config/database');

module.exports = {
  async getParents(itemId) {
    const [rows] = await pool.query(`
      SELECT il.*, i.name as item_name, i.id as item_id, it.icon as type_icon, it.name as type_name
      FROM item_links il
      JOIN items i ON i.id = il.parent_item_id
      JOIN item_types it ON it.id = i.item_type_id
      WHERE il.child_item_id = ?
      ORDER BY i.name
    `, [itemId]);
    return rows;
  },

  async getChildren(itemId) {
    const [rows] = await pool.query(`
      SELECT il.*, i.name as item_name, i.id as item_id, it.icon as type_icon, it.name as type_name
      FROM item_links il
      JOIN items i ON i.id = il.child_item_id
      JOIN item_types it ON it.id = i.item_type_id
      WHERE il.parent_item_id = ?
      ORDER BY i.name
    `, [itemId]);
    return rows;
  },

  async create(parentItemId, childItemId, relationship = 'contains') {
    const [result] = await pool.query(
      'INSERT INTO item_links (parent_item_id, child_item_id, relationship) VALUES (?, ?, ?)',
      [parentItemId, childItemId, relationship]
    );
    return result.insertId;
  },

  async delete(id) {
    await pool.query('DELETE FROM item_links WHERE id = ?', [id]);
  },
};
