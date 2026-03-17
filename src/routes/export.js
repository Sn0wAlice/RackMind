const express = require('express');
const Item = require('../models/Item');
const Tag = require('../models/Tag');
const ItemType = require('../models/ItemType');
const Category = require('../models/Category');
const Location = require('../models/Location');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Export page
router.get('/', (req, res) => {
  res.render('export/index', { title: 'Export & Import' });
});

// Export items as JSON
router.get('/items.json', async (req, res) => {
  try {
    const result = await Item.getAll({ page: 1, limit: 100000 });
    const items = [];
    for (const item of result.items) {
      const tags = await Tag.getForItem(item.id);
      items.push({
        ...item,
        tags: tags.map((t) => t.name),
        specs: item.specs ? (typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs) : null,
      });
    }
    res.setHeader('Content-Disposition', 'attachment; filename="rackmind-items.json"');
    res.json(items);
  } catch (err) {
    console.error('Export JSON error:', err);
    req.flash('error', 'Export failed.');
    res.redirect('/export');
  }
});

// Export items as CSV
router.get('/items.csv', async (req, res) => {
  try {
    const result = await Item.getAll({ page: 1, limit: 100000 });
    const header = ['ID', 'Name', 'Category', 'Type', 'Location', 'Status', 'Quantity', 'Is Unique', 'Serial Number', 'Description', 'Notes', 'Created', 'Updated'];
    const rows = result.items.map((item) => [
      item.id,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.category_name || '').replace(/"/g, '""')}"`,
      `"${(item.type_name || '').replace(/"/g, '""')}"`,
      `"${(item.location_name || '').replace(/"/g, '""')}"`,
      item.status || 'in_stock',
      item.quantity,
      item.is_unique ? 'yes' : 'no',
      `"${(item.serial_number || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      item.created_at,
      item.updated_at,
    ].join(','));

    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="rackmind-items.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    req.flash('error', 'Export failed.');
    res.redirect('/export');
  }
});

// Export full backup (items + categories + locations) as JSON
router.get('/backup.json', async (req, res) => {
  try {
    const result = await Item.getAll({ page: 1, limit: 100000 });
    const items = [];
    for (const item of result.items) {
      const tags = await Tag.getForItem(item.id);
      items.push({
        ...item,
        tags: tags.map((t) => t.name),
        specs: item.specs ? (typeof item.specs === 'string' ? JSON.parse(item.specs) : item.specs) : null,
      });
    }
    const categories = await Category.getAll();
    const locations = await Location.getAll();
    const types = await ItemType.getAll();

    res.setHeader('Content-Disposition', 'attachment; filename="rackmind-backup.json"');
    res.json({ items, categories, locations, types });
  } catch (err) {
    console.error('Backup JSON error:', err);
    req.flash('error', 'Backup export failed.');
    res.redirect('/export');
  }
});

// Import CSV
router.post('/import', (req, res, next) => {
  req.app.locals.upload.single('csvfile')(req, res, async (err) => {
    if (err) {
      req.flash('error', 'File upload failed.');
      return res.redirect('/export');
    }

    try {
      if (!req.file) {
        req.flash('error', 'Please select a CSV file.');
        return res.redirect('/export');
      }

      const fs = require('fs');
      const content = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path); // cleanup temp file

      const lines = content.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        req.flash('error', 'CSV file is empty or has no data rows.');
        return res.redirect('/export');
      }

      // Parse header
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIdx = header.indexOf('name');
      const typeIdx = header.indexOf('type');
      const categoryIdx = header.indexOf('category');
      const locationIdx = header.indexOf('location');
      const qtyIdx = header.indexOf('quantity');
      const statusIdx = header.indexOf('status');
      const serialIdx = header.indexOf('serial number');
      const descIdx = header.indexOf('description');
      const notesIdx = header.indexOf('notes');

      if (nameIdx === -1 || typeIdx === -1) {
        req.flash('error', 'CSV must have at least "Name" and "Type" columns.');
        return res.redirect('/export');
      }

      let imported = 0;
      let skipped = 0;

      // Get all types and locations for matching
      const allTypes = await ItemType.getAll();
      const allLocations = await Location.getAll();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = cols[nameIdx];
        const typeName = cols[typeIdx];

        if (!name || !typeName) { skipped++; continue; }

        const matchedType = allTypes.find((t) => t.name.toLowerCase() === typeName.toLowerCase());
        if (!matchedType) { skipped++; continue; }

        let locationId = null;
        if (locationIdx >= 0 && cols[locationIdx]) {
          const matchedLoc = allLocations.find((l) =>
            l.name.toLowerCase() === cols[locationIdx].toLowerCase() ||
            l.path.toLowerCase() === cols[locationIdx].toLowerCase()
          );
          if (matchedLoc) locationId = matchedLoc.id;
        }

        const qty = qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 1 : 1;
        const status = statusIdx >= 0 ? cols[statusIdx] || 'in_stock' : 'in_stock';

        await Item.create({
          itemTypeId: matchedType.id,
          locationId,
          name,
          description: descIdx >= 0 ? cols[descIdx] : null,
          serialNumber: serialIdx >= 0 ? cols[serialIdx] : null,
          quantity: qty,
          isUnique: qty === 1 && serialIdx >= 0 && cols[serialIdx],
          specs: null,
          imageUrl: null,
          notes: notesIdx >= 0 ? cols[notesIdx] : null,
          status,
        });
        imported++;
      }

      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'import',
        entityType: 'item',
        entityId: 0,
        entityName: 'CSV Import',
        details: { imported, skipped },
      });

      req.flash('success', `Imported ${imported} items. ${skipped > 0 ? skipped + ' rows skipped.' : ''}`);
      res.redirect('/export');
    } catch (err) {
      console.error('Import error:', err);
      req.flash('error', 'Import failed: ' + err.message);
      res.redirect('/export');
    }
  });
});

// Simple CSV line parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

module.exports = router;
