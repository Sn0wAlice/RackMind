const pool = require('../config/database');

module.exports = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM tags ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await pool.query('SELECT * FROM tags WHERE name = ?', [name]);
    return rows[0] || null;
  },

  async findOrCreate(name, color) {
    let tag = await this.findByName(name);
    if (!tag) {
      const [result] = await pool.query(
        'INSERT INTO tags (name, color) VALUES (?, ?)',
        [name, color || '#6b7280']
      );
      tag = { id: result.insertId, name, color: color || '#6b7280' };
    }
    return tag;
  },

  async getForItem(itemId) {
    const [rows] = await pool.query(`
      SELECT t.* FROM tags t
      JOIN item_tags it ON it.tag_id = t.id
      WHERE it.item_id = ?
      ORDER BY t.name
    `, [itemId]);
    return rows;
  },

  async setForItem(itemId, tagIds) {
    await pool.query('DELETE FROM item_tags WHERE item_id = ?', [itemId]);
    if (tagIds && tagIds.length > 0) {
      const values = tagIds.map((tid) => [itemId, tid]);
      await pool.query('INSERT INTO item_tags (item_id, tag_id) VALUES ?', [values]);
    }
  },

  async syncForItem(itemId, tagsString) {
    if (!tagsString || !tagsString.trim()) {
      await pool.query('DELETE FROM item_tags WHERE item_id = ?', [itemId]);
      return;
    }
    const names = tagsString.split(',').map((n) => n.trim()).filter(Boolean);
    const tagIds = [];
    for (const name of names) {
      const tag = await this.findOrCreate(name);
      tagIds.push(tag.id);
    }
    await this.setForItem(itemId, tagIds);
  },

  async search(query) {
    const [rows] = await pool.query(
      'SELECT * FROM tags WHERE name LIKE ? ORDER BY name LIMIT 20',
      [`%${query}%`]
    );
    return rows;
  },

  async getPopular(limit = 20) {
    const [rows] = await pool.query(`
      SELECT t.*, COUNT(it.item_id) as usage_count
      FROM tags t
      LEFT JOIN item_tags it ON it.tag_id = t.id
      GROUP BY t.id
      ORDER BY usage_count DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },

  async delete(id) {
    await pool.query('DELETE FROM tags WHERE id = ?', [id]);
  },
};
