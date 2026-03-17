const express = require('express');
const Item = require('../models/Item');
const Category = require('../models/Category');
const ItemType = require('../models/ItemType');
const Location = require('../models/Location');

const router = express.Router();

// List items with filters
router.get('/', async (req, res) => {
  try {
    const { search, category, type, location, page = 1, view = 'card' } = req.query;

    const result = await Item.getAll({
      search,
      categoryId: category,
      typeId: type,
      locationId: location,
      page: parseInt(page),
    });

    const [categories, locations] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
    ]);

    // If category is selected, load types for it
    let types = [];
    if (category) {
      types = await ItemType.getByCategoryId(category);
    }

    res.render('items/index', {
      title: 'Items',
      ...result,
      categories,
      locations,
      types,
      search: search || '',
      filters: { category: category || '', type: type || '', location: location || '' },
      viewMode: view,
      query: req.query,
    });
  } catch (err) {
    console.error('Items list error:', err);
    req.flash('error', 'Failed to load items.');
    res.redirect('/');
  }
});

// Create form
router.get('/create', async (req, res) => {
  try {
    const [categories, locations] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
    ]);

    res.render('items/form', {
      title: 'Add Item',
      item: null,
      categories,
      locations,
      types: [],
      editing: false,
    });
  } catch (err) {
    console.error('Item create form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/items');
  }
});

// Create item
router.post('/create', (req, res, next) => {
  req.app.locals.upload.single('image')(req, res, async (err) => {
    if (err) {
      req.flash('error', 'Image upload failed: ' + err.message);
      return res.redirect('/items/create');
    }

    try {
      const { item_type_id, location_id, name, description, serial_number, quantity, is_unique, notes } = req.body;
      const specKeys = req.body.spec_key || [];
      const specValues = req.body.spec_value || [];

      if (!name || !item_type_id) {
        req.flash('error', 'Name and type are required.');
        return res.redirect('/items/create');
      }

      // Build specs object
      let specs = null;
      if (Array.isArray(specKeys) && specKeys.length > 0) {
        specs = {};
        specKeys.forEach((key, i) => {
          if (key && key.trim()) {
            specs[key.trim()] = (specValues[i] || '').trim();
          }
        });
        if (Object.keys(specs).length === 0) specs = null;
      }

      const imageUrl = req.file ? '/images/uploads/' + req.file.filename : null;

      const id = await Item.create({
        itemTypeId: item_type_id,
        locationId: location_id || null,
        name,
        description,
        serialNumber: serial_number,
        quantity: is_unique ? 1 : (parseInt(quantity) || 1),
        isUnique: !!is_unique,
        specs,
        imageUrl,
        notes,
      });

      req.flash('success', 'Item created successfully.');
      res.redirect('/items/' + id);
    } catch (err) {
      console.error('Item create error:', err);
      req.flash('error', 'Failed to create item.');
      res.redirect('/items/create');
    }
  });
});

// Show item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/items');
    }

    // Parse specs
    if (item.specs && typeof item.specs === 'string') {
      item.specs = JSON.parse(item.specs);
    }

    // Get ancestors for location breadcrumb
    let locationAncestors = [];
    if (item.location_id) {
      locationAncestors = await Location.getAncestors(item.location_id);
    }

    res.render('items/show', {
      title: item.name,
      item,
      locationAncestors,
    });
  } catch (err) {
    console.error('Item show error:', err);
    req.flash('error', 'Failed to load item.');
    res.redirect('/items');
  }
});

// Edit form
router.get('/:id/edit', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/items');
    }

    if (item.specs && typeof item.specs === 'string') {
      item.specs = JSON.parse(item.specs);
    }

    const [categories, locations] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
    ]);

    const types = await ItemType.getByCategoryId(item.category_id);

    res.render('items/form', {
      title: 'Edit Item',
      item,
      categories,
      locations,
      types,
      editing: true,
    });
  } catch (err) {
    console.error('Item edit form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/items');
  }
});

// Update item
router.post('/:id/edit', (req, res, next) => {
  req.app.locals.upload.single('image')(req, res, async (err) => {
    if (err) {
      req.flash('error', 'Image upload failed: ' + err.message);
      return res.redirect('/items/' + req.params.id + '/edit');
    }

    try {
      const { item_type_id, location_id, name, description, serial_number, quantity, is_unique, notes, existing_image } = req.body;
      const specKeys = req.body.spec_key || [];
      const specValues = req.body.spec_value || [];

      if (!name || !item_type_id) {
        req.flash('error', 'Name and type are required.');
        return res.redirect('/items/' + req.params.id + '/edit');
      }

      let specs = null;
      if (Array.isArray(specKeys) && specKeys.length > 0) {
        specs = {};
        specKeys.forEach((key, i) => {
          if (key && key.trim()) {
            specs[key.trim()] = (specValues[i] || '').trim();
          }
        });
        if (Object.keys(specs).length === 0) specs = null;
      }

      const imageUrl = req.file ? '/images/uploads/' + req.file.filename : (existing_image || null);

      await Item.update(req.params.id, {
        itemTypeId: item_type_id,
        locationId: location_id || null,
        name,
        description,
        serialNumber: serial_number,
        quantity: is_unique ? 1 : (parseInt(quantity) || 1),
        isUnique: !!is_unique,
        specs,
        imageUrl,
        notes,
      });

      req.flash('success', 'Item updated successfully.');
      res.redirect('/items/' + req.params.id);
    } catch (err) {
      console.error('Item update error:', err);
      req.flash('error', 'Failed to update item.');
      res.redirect('/items/' + req.params.id + '/edit');
    }
  });
});

// Delete item
router.post('/:id/delete', async (req, res) => {
  try {
    await Item.delete(req.params.id);
    req.flash('success', 'Item deleted.');
    res.redirect('/items');
  } catch (err) {
    console.error('Item delete error:', err);
    req.flash('error', 'Failed to delete item.');
    res.redirect('/items/' + req.params.id);
  }
});

module.exports = router;
