const express = require('express');
const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const ItemType = require('../models/ItemType');
const Tag = require('../models/Tag');

const router = express.Router();

// Items
router.get('/items', async (req, res) => {
  try {
    const { search, category, type, location, status, page = 1, limit = 24 } = req.query;
    const result = await Item.getAll({ search, categoryId: category, typeId: type, locationId: location, status, page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const tags = await Tag.getForItem(item.id);
    res.json({ ...item, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { itemTypeId, locationId, name, description, serialNumber, quantity, isUnique, specs, notes, status } = req.body;
    if (!name || !itemTypeId) return res.status(400).json({ error: 'Name and itemTypeId required' });
    const id = await Item.create({ itemTypeId, locationId, name, description, serialNumber, quantity, isUnique, specs, imageUrl: null, notes, status });
    const item = await Item.findById(id);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const existing = await Item.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Item.update(req.params.id, req.body);
    const item = await Item.findById(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const existing = await Item.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Item.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Locations
router.get('/locations', async (req, res) => {
  try { res.json(await Location.getAll()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/locations/:id', async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Not found' });
    res.json(loc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/locations', async (req, res) => {
  try {
    const { parentId, name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const id = await Location.create({ parentId, name, description, icon });
    res.status(201).json(await Location.findById(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const existing = await Location.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Location.update(req.params.id, req.body);
    res.json(await Location.findById(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    await Location.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categories
router.get('/categories', async (req, res) => {
  try { res.json(await Category.getAll()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/categories/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found' });
    res.json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const id = await Category.create({ name, icon, description });
    res.status(201).json(await Category.findById(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    await Category.update(req.params.id, req.body);
    res.json(await Category.findById(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Types
router.get('/types', async (req, res) => {
  try { res.json(await ItemType.getAll()); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/types/:id', async (req, res) => {
  try {
    const t = await ItemType.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/types', async (req, res) => {
  try {
    const { categoryId, name, icon, description } = req.body;
    if (!name || !categoryId) return res.status(400).json({ error: 'Name and categoryId required' });
    const id = await ItemType.create({ categoryId, name, icon, description });
    res.status(201).json(await ItemType.findById(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/types/:id', async (req, res) => {
  try {
    await ItemType.update(req.params.id, req.body);
    res.json(await ItemType.findById(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/types/:id', async (req, res) => {
  try {
    await ItemType.delete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
