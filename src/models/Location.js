const pool = require('../config/database');

module.exports = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM locations ORDER BY path, name');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async getChildren(parentId) {
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE parent_id = ? ORDER BY name',
      [parentId]
    );
    return rows;
  },

  async getRoots() {
    const [rows] = await pool.query(
      'SELECT * FROM locations WHERE parent_id IS NULL ORDER BY name'
    );
    return rows;
  },

  async getTree() {
    const [rows] = await pool.query('SELECT * FROM locations ORDER BY path, name');
    const map = new Map();
    const roots = [];

    rows.forEach((loc) => {
      loc.children = [];
      map.set(loc.id, loc);
    });

    rows.forEach((loc) => {
      if (loc.parent_id && map.has(loc.parent_id)) {
        map.get(loc.parent_id).children.push(loc);
      } else {
        roots.push(loc);
      }
    });

    return roots;
  },

  async create({ parentId, name, description, icon }) {
    const [result] = await pool.query(
      'INSERT INTO locations (parent_id, name, description, icon) VALUES (?, ?, ?, ?)',
      [parentId || null, name, description || null, icon || 'fa-solid fa-location-dot']
    );
    const id = result.insertId;
    await this.computePath(id);
    return id;
  },

  async update(id, { parentId, name, description, icon }) {
    // Prevent setting parent to self or a descendant
    if (parentId) {
      const descendants = await this.getDescendantIds(id);
      if (parseInt(parentId) === parseInt(id) || descendants.includes(parseInt(parentId))) {
        throw new Error('Cannot set parent to self or a descendant.');
      }
    }

    await pool.query(
      'UPDATE locations SET parent_id = ?, name = ?, description = ?, icon = ? WHERE id = ?',
      [parentId || null, name, description || null, icon, id]
    );
    await this.computePath(id);

    // Recompute paths for all descendants
    const descendants = await this.getDescendantIds(id);
    for (const descId of descendants) {
      await this.computePath(descId);
    }
  },

  async delete(id) {
    // Reassign children to parent before deleting
    const location = await this.findById(id);
    if (location) {
      await pool.query(
        'UPDATE locations SET parent_id = ? WHERE parent_id = ?',
        [location.parent_id, id]
      );
      // Recompute paths for reassigned children
      const [children] = await pool.query(
        'SELECT id FROM locations WHERE parent_id = ?',
        [location.parent_id]
      );
      for (const child of children) {
        await this.computePath(child.id);
      }
    }
    await pool.query('DELETE FROM locations WHERE id = ?', [id]);
  },

  async computePath(id) {
    const parts = [];
    let current = await this.findById(id);
    let depth = 0;

    // Walk up to build path
    const visited = new Set();
    let cursor = current;
    while (cursor && cursor.parent_id && !visited.has(cursor.parent_id)) {
      visited.add(cursor.parent_id);
      cursor = await this.findById(cursor.parent_id);
      if (cursor) {
        parts.unshift(cursor.name);
        depth++;
      }
    }
    parts.push(current.name);

    const path = parts.join(' / ');
    await pool.query(
      'UPDATE locations SET path = ?, depth = ? WHERE id = ?',
      [path, depth, id]
    );
  },

  async getDescendantIds(id) {
    const [rows] = await pool.query(`
      WITH RECURSIVE descendants AS (
        SELECT id FROM locations WHERE parent_id = ?
        UNION ALL
        SELECT l.id FROM locations l JOIN descendants d ON l.parent_id = d.id
      )
      SELECT id FROM descendants
    `, [id]);
    return rows.map((r) => r.id);
  },

  async getAncestors(id) {
    const ancestors = [];
    let current = await this.findById(id);
    const visited = new Set();

    while (current && current.parent_id && !visited.has(current.parent_id)) {
      visited.add(current.parent_id);
      current = await this.findById(current.parent_id);
      if (current) ancestors.unshift(current);
    }
    return ancestors;
  },

  async getItemCount(id) {
    const descendantIds = await this.getDescendantIds(id);
    const allIds = [id, ...descendantIds];
    const placeholders = allIds.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT COUNT(*) as total FROM items WHERE location_id IN (${placeholders})`,
      allIds
    );
    return rows[0].total;
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM locations');
    return rows[0].total;
  },
};
