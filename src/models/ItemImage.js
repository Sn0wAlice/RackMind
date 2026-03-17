const pool = require('../config/database');

module.exports = {
  async getForItem(itemId) {
    const [rows] = await pool.query(
      'SELECT * FROM item_images WHERE item_id = ? ORDER BY sort_order, id',
      [itemId]
    );
    return rows;
  },

  async add(itemId, url, sortOrder = 0) {
    const [result] = await pool.query(
      'INSERT INTO item_images (item_id, url, sort_order) VALUES (?, ?, ?)',
      [itemId, url, sortOrder]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM item_images WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const image = await this.findById(id);
    await pool.query('DELETE FROM item_images WHERE id = ?', [id]);
    return image ? image.url : null;
  },

  async deleteAllForItem(itemId) {
    const [rows] = await pool.query('SELECT url FROM item_images WHERE item_id = ?', [itemId]);
    await pool.query('DELETE FROM item_images WHERE item_id = ?', [itemId]);
    return rows.map((r) => r.url);
  },

  async reorder(imageIds) {
    for (let i = 0; i < imageIds.length; i++) {
      await pool.query('UPDATE item_images SET sort_order = ? WHERE id = ?', [i, imageIds[i]]);
    }
  },
};
