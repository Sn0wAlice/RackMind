const express = require('express');
const ItemType = require('../models/ItemType');
const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const ItemLink = require('../models/ItemLink');
const ItemImage = require('../models/ItemImage');
const ItemComment = require('../models/ItemComment');
const SavedFilter = require('../models/SavedFilter');
const ActivityLog = require('../models/ActivityLog');
const imageCleanup = require('../utils/imageCleanup');
const QRCode = require('qrcode');

const router = express.Router();

// Get types by category (for dynamic dropdown)
router.get('/types-by-category/:categoryId', async (req, res) => {
  try {
    const types = await ItemType.getByCategoryId(req.params.categoryId);
    res.json(types);
  } catch (err) {
    console.error('API types error:', err);
    res.status(500).json({ error: 'Failed to load types.' });
  }
});

// Search items
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const result = await Item.getAll({ search: q, page: 1, limit: 10 });
    res.json(result.items.map((item) => ({
      id: item.id,
      name: item.name,
      type_name: item.type_name,
      type_icon: item.type_icon,
      location_name: item.location_name,
    })));
  } catch (err) {
    console.error('API search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// Location tree
router.get('/locations/tree', async (req, res) => {
  try {
    const tree = await Location.getTree();
    res.json(tree);
  } catch (err) {
    console.error('API locations tree error:', err);
    res.status(500).json({ error: 'Failed to load tree.' });
  }
});

// Global search across items, locations, categories (flat array for command palette)
router.get('/search/global', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const [itemResult, allLocations, allCategories] = await Promise.all([
      Item.getAll({ search: q, page: 1, limit: 8 }),
      Location.getAll(),
      Category.getAll(),
    ]);

    const query = q.toLowerCase();
    const locations = allLocations.filter((l) => l.name.toLowerCase().includes(query)).slice(0, 4);
    const categories = allCategories.filter((c) => c.name.toLowerCase().includes(query)).slice(0, 4);

    const results = [];
    itemResult.items.forEach((item) => {
      results.push({ id: item.id, name: item.name, icon: item.type_icon || 'fa-solid fa-box', type: 'item', url: '/items/' + item.id });
    });
    locations.forEach((l) => {
      results.push({ id: l.id, name: l.name, icon: l.icon || 'fa-solid fa-location-dot', type: 'location', url: '/locations/' + l.id });
    });
    categories.forEach((c) => {
      results.push({ id: c.id, name: c.name, icon: c.icon || 'fa-solid fa-tags', type: 'category', url: '/categories' });
    });

    res.json(results);
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// Bulk status update
router.patch('/items/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) return res.status(400).json({ error: 'ids and status required' });
    const pool = require('../config/database');
    await pool.query('UPDATE items SET status = ? WHERE id IN (?)', [status, ids]);
    for (const id of ids) {
      await ActivityLog.log({ userId: req.session.user.id, action: 'update', entityType: 'item', entityId: parseInt(id), details: { field: 'status', to: status, bulk: true } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Bulk status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Bulk delete
router.post('/items/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids required' });
    for (const id of ids) {
      const item = await Item.findById(id);
      if (item) {
        await Item.delete(id);
        await ActivityLog.log({ userId: req.session.user.id, action: 'delete', entityType: 'item', entityId: parseInt(id), entityName: item.name });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'Failed to delete items.' });
  }
});

// Adjust item quantity (PATCH)
router.patch('/items/:id/quantity', async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const pool = require('../config/database');
    await pool.query('UPDATE items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);
    res.json({ success: true, quantity });
  } catch (err) {
    console.error('Quantity update error:', err);
    res.status(500).json({ error: 'Failed to update quantity.' });
  }
});

// Adjust item quantity (+/-)
router.post('/items/:id/quantity', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { delta } = req.body;
    const newQuantity = await Item.updateQuantity(req.params.id, parseInt(delta));

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'update',
      entityType: 'item',
      entityId: item.id,
      entityName: item.name,
      details: { field: 'quantity', from: item.quantity, to: newQuantity },
    });

    res.json({ success: true, quantity: newQuantity });
  } catch (err) {
    console.error('Quantity adjust error:', err);
    res.status(500).json({ error: 'Failed to adjust quantity.' });
  }
});

// Search tags
router.get('/tags', async (req, res) => {
  try {
    const { q } = req.query;
    const tags = await Tag.search(q || '');
    res.json(tags);
  } catch (err) {
    console.error('Tags search error:', err);
    res.status(500).json({ error: 'Failed to search tags.' });
  }
});

// Create item link
router.post('/items/:id/links', async (req, res) => {
  try {
    const { targetItemId, relationship, direction } = req.body;
    if (!targetItemId) return res.status(400).json({ error: 'targetItemId required' });

    const parentId = direction === 'child' ? req.params.id : targetItemId;
    const childId = direction === 'child' ? targetItemId : req.params.id;
    const id = await ItemLink.create(parentId, childId, relationship || 'contains');

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: 'Failed to create link.' });
  }
});

// Delete item link
router.delete('/items/links/:linkId', async (req, res) => {
  try {
    await ItemLink.delete(req.params.linkId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete link error:', err);
    res.status(500).json({ error: 'Failed to delete link.' });
  }
});

// Upload additional images
router.post('/items/:id/images', (req, res) => {
  req.app.locals.upload.array('images', 10)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: 'Image upload failed: ' + err.message });

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const images = [];
      for (const file of req.files) {
        const imageUrl = '/images/uploads/' + file.filename;
        const id = await ItemImage.add(req.params.id, imageUrl, images.length);
        images.push({ id, url: imageUrl });
      }

      res.status(201).json({ success: true, images });
    } catch (err) {
      console.error('Upload images error:', err);
      res.status(500).json({ error: 'Failed to upload images.' });
    }
  });
});

// Delete an image
router.delete('/items/images/:imageId', async (req, res) => {
  try {
    const image = await ItemImage.findById(req.params.imageId);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    imageCleanup.deleteImage(image.url);
    await ItemImage.delete(req.params.imageId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Failed to delete image.' });
  }
});

// Add comment
router.post('/items/:id/comments', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Body required' });

    const id = await ItemComment.create(req.params.id, req.session.user.id, body);

    const comment = await ItemComment.findById(id);
    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// Edit comment
router.put('/comments/:id', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Body required' });

    await ItemComment.update(req.params.id, req.session.user.id, body);
    const comment = await ItemComment.findById(req.params.id);
    res.json(comment);
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ error: 'Failed to edit comment.' });
  }
});

// Delete comment
router.delete('/comments/:id', async (req, res) => {
  try {
    await ItemComment.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

// Get saved filters for current user
router.get('/filters', async (req, res) => {
  try {
    const filters = await SavedFilter.getForUser(req.session.user.id);
    res.json(filters);
  } catch (err) {
    console.error('Get filters error:', err);
    res.status(500).json({ error: 'Failed to load filters.' });
  }
});

// Create saved filter
router.post('/filters', async (req, res) => {
  try {
    const { name, filters } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const id = await SavedFilter.create(req.session.user.id, name, filters);

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Create filter error:', err);
    res.status(500).json({ error: 'Failed to create filter.' });
  }
});

// Delete saved filter
router.delete('/filters/:id', async (req, res) => {
  try {
    await SavedFilter.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete filter error:', err);
    res.status(500).json({ error: 'Failed to delete filter.' });
  }
});

// Move location (drag & drop)
router.patch('/locations/:id/move', async (req, res) => {
  try {
    const { parentId } = req.body;
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });

    await Location.update(req.params.id, {
      parentId: parentId || null,
      name: loc.name,
      description: loc.description,
      icon: loc.icon,
    });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'update',
      entityType: 'location',
      entityId: parseInt(req.params.id),
      entityName: loc.name,
      details: { moved: true, newParentId: parentId || null },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Move location error:', err);
    res.status(500).json({ error: 'Failed to move location.' });
  }
});

// Generate QR code PNG
router.get('/items/:id/qrcode', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const url = `${req.protocol}://${req.get('host')}/items/${item.id}`;
    const buffer = await QRCode.toBuffer(url);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="item-${item.id}-qr.png"`);
    res.send(buffer);
  } catch (err) {
    console.error('QR code error:', err);
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
});

module.exports = router;
