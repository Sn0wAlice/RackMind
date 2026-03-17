const pool = require('../config/database');

module.exports = {
  async log({ userId, action, entityType, entityId, entityName, details }) {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details) VALUES (?, ?, ?, ?, ?, ?)',
      [userId || null, action, entityType, entityId, entityName || null, details ? JSON.stringify(details) : null]
    );
  },

  async getRecent(limit = 20) {
    const [rows] = await pool.query(`
      SELECT al.*, u.username
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },

  async getByEntity(entityType, entityId, limit = 50) {
    const [rows] = await pool.query(`
      SELECT al.*, u.username
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE al.entity_type = ? AND al.entity_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [entityType, entityId, limit]);
    return rows;
  },

  async getAll({ page = 1, limit = 50, entityType, userId } = {}) {
    let where = [];
    let params = [];

    if (entityType) {
      where.push('al.entity_type = ?');
      params.push(entityType);
    }
    if (userId) {
      where.push('al.user_id = ?');
      params.push(userId);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM activity_logs al ${whereClause}`, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT al.*, u.username
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return { logs: rows, total, totalPages, currentPage: page };
  },
};
