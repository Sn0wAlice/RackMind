const express = require('express');
const ItemType = require('../models/ItemType');
const Item = require('../models/Item');
const Location = require('../models/Location');

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

module.exports = router;
