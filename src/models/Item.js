const pool = require('../config/database');

module.exports = {
  async getAll({ search, categoryId, typeId, locationId, page = 1, limit = 24 } = {}) {
    let where = [];
    let params = [];

    if (search) {
      where.push('(i.name LIKE ? OR i.description LIKE ? OR i.serial_number LIKE ? OR i.notes LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (categoryId) {
      where.push('c.id = ?');
      params.push(categoryId);
    }
    if (typeId) {
      where.push('i.item_type_id = ?');
      params.push(typeId);
    }
    if (locationId) {
      where.push('i.location_id = ?');
      params.push(locationId);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Count total
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM items i
      JOIN item_types it ON it.id = i.item_type_id
      JOIN categories c ON c.id = it.category_id
      LEFT JOIN locations l ON l.id = i.location_id
      ${whereClause}
    `, params);

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch items
    const [rows] = await pool.query(`
      SELECT i.*, it.name as type_name, it.icon as type_icon,
             c.name as category_name, c.icon as category_icon, c.id as category_id,
             l.name as location_name, l.path as location_path
      FROM items i
      JOIN item_types it ON it.id = i.item_type_id
      JOIN categories c ON c.id = it.category_id
      LEFT JOIN locations l ON l.id = i.location_id
      ${whereClause}
      ORDER BY i.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return { items: rows, total, totalPages, currentPage: page };
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT i.*, it.name as type_name, it.icon as type_icon,
             c.name as category_name, c.icon as category_icon, c.id as category_id,
             l.name as location_name, l.path as location_path, l.id as location_id
      FROM items i
      JOIN item_types it ON it.id = i.item_type_id
      JOIN categories c ON c.id = it.category_id
      LEFT JOIN locations l ON l.id = i.location_id
      WHERE i.id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create({ itemTypeId, locationId, name, description, serialNumber, quantity, isUnique, specs, imageUrl, notes }) {
    const [result] = await pool.query(
      `INSERT INTO items (item_type_id, location_id, name, description, serial_number, quantity, is_unique, specs, image_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemTypeId,
        locationId || null,
        name,
        description || null,
        serialNumber || null,
        quantity || 1,
        isUnique ? 1 : 0,
        specs ? JSON.stringify(specs) : null,
        imageUrl || null,
        notes || null,
      ]
    );
    return result.insertId;
  },

  async update(id, { itemTypeId, locationId, name, description, serialNumber, quantity, isUnique, specs, imageUrl, notes }) {
    await pool.query(
      `UPDATE items SET item_type_id = ?, location_id = ?, name = ?, description = ?,
       serial_number = ?, quantity = ?, is_unique = ?, specs = ?, image_url = ?, notes = ?
       WHERE id = ?`,
      [
        itemTypeId,
        locationId || null,
        name,
        description || null,
        serialNumber || null,
        quantity || 1,
        isUnique ? 1 : 0,
        specs ? JSON.stringify(specs) : null,
        imageUrl || null,
        notes || null,
        id,
      ]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
  },

  async getRecent(limit = 10) {
    const [rows] = await pool.query(`
      SELECT i.*, it.name as type_name, it.icon as type_icon,
             c.name as category_name, l.name as location_name, l.path as location_path
      FROM items i
      JOIN item_types it ON it.id = i.item_type_id
      JOIN categories c ON c.id = it.category_id
      LEFT JOIN locations l ON l.id = i.location_id
      ORDER BY i.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },

  async getStats() {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(quantity) as total_quantity,
        SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) as unique_count,
        SUM(CASE WHEN is_unique = 0 THEN 1 ELSE 0 END) as quantity_count
      FROM items
    `);
    return rows[0];
  },

  async getByLocationId(locationId) {
    const [rows] = await pool.query(`
      SELECT i.*, it.name as type_name, it.icon as type_icon, c.name as category_name
      FROM items i
      JOIN item_types it ON it.id = i.item_type_id
      JOIN categories c ON c.id = it.category_id
      WHERE i.location_id = ?
      ORDER BY i.name
    `, [locationId]);
    return rows;
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM items');
    return rows[0].total;
  },
};
