const express = require('express');
const Item = require('../models/Item');
const Category = require('../models/Category');
const ItemType = require('../models/ItemType');
const Location = require('../models/Location');
const Tag = require('../models/Tag');
const ItemImage = require('../models/ItemImage');
const ItemLink = require('../models/ItemLink');
const ItemComment = require('../models/ItemComment');
const ActivityLog = require('../models/ActivityLog');
const SavedFilter = require('../models/SavedFilter');
const imageCleanup = require('../utils/imageCleanup');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

// List items with filters
router.get('/', async (req, res) => {
  try {
    const { search, category, type, location, status, page = 1, view = 'card' } = req.query;

    const result = await Item.getAll({
      search,
      categoryId: category,
      typeId: type,
      locationId: location,
      status,
      page: parseInt(page),
    });

    const [categories, locations, savedFilters] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
      SavedFilter.getForUser(req.session.user.id),
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
      savedFilters,
      search: search || '',
      filters: { category: category || '', type: type || '', location: location || '', status: status || '' },
      viewMode: view,
      query: req.query,
    });
  } catch (err) {
    console.error('Items list error:', err);
    req.flash('error', 'Failed to load items.');
    res.redirect('/');
  }
});

// Labels page
router.get('/labels', async (req, res) => {
  try {
    const { search, category, type, location, status } = req.query;
    const result = await Item.getAll({ search, categoryId: category, typeId: type, locationId: location, status, page: 1, limit: 100 });
    res.render('items/labels', { title: 'Print Labels', items: result.items });
  } catch (err) {
    console.error('Labels error:', err);
    req.flash('error', 'Failed to load labels.');
    res.redirect('/items');
  }
});

// Create form
router.get('/create', requireEditor, async (req, res) => {
  try {
    const [categories, locations, allTags] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
      Tag.getAll(),
    ]);

    res.render('items/form', {
      title: 'Add Item',
      item: null,
      categories,
      locations,
      types: [],
      allTags,
      editing: false,
    });
  } catch (err) {
    console.error('Item create form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/items');
  }
});

// Create item
router.post('/create', requireEditor, (req, res, next) => {
  req.app.locals.upload.single('image')(req, res, async (err) => {
    if (err) {
      req.flash('error', 'Image upload failed: ' + err.message);
      return res.redirect('/items/create');
    }

    try {
      const { item_type_id, location_id, name, description, serial_number, quantity, is_unique, notes, status, low_stock_threshold } = req.body;
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
        status: status || 'in_stock',
        lowStockThreshold: low_stock_threshold ? parseInt(low_stock_threshold) : null,
      });

      await Tag.syncForItem(id, req.body.tags);

      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'create',
        entityType: 'item',
        entityId: id,
        entityName: name,
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

    const [tags, images, parents, children, comments] = await Promise.all([
      Tag.getForItem(item.id),
      ItemImage.getForItem(item.id),
      ItemLink.getParents(item.id),
      ItemLink.getChildren(item.id),
      ItemComment.getForItem(item.id),
    ]);

    res.render('items/show', {
      title: item.name,
      item,
      locationAncestors,
      tags,
      images,
      parents,
      children,
      comments,
    });
  } catch (err) {
    console.error('Item show error:', err);
    req.flash('error', 'Failed to load item.');
    res.redirect('/items');
  }
});

// Edit form
router.get('/:id/edit', requireEditor, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/items');
    }

    if (item.specs && typeof item.specs === 'string') {
      item.specs = JSON.parse(item.specs);
    }

    const [categories, locations, allTags, itemTags] = await Promise.all([
      Category.getAll(),
      Location.getAll(),
      Tag.getAll(),
      Tag.getForItem(item.id),
    ]);

    const types = await ItemType.getByCategoryId(item.category_id);

    res.render('items/form', {
      title: 'Edit Item',
      item,
      categories,
      locations,
      types,
      allTags,
      itemTags,
      editing: true,
    });
  } catch (err) {
    console.error('Item edit form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/items');
  }
});

// Update item
router.post('/:id/edit', requireEditor, (req, res, next) => {
  req.app.locals.upload.single('image')(req, res, async (err) => {
    if (err) {
      req.flash('error', 'Image upload failed: ' + err.message);
      return res.redirect('/items/' + req.params.id + '/edit');
    }

    try {
      const { item_type_id, location_id, name, description, serial_number, quantity, is_unique, notes, existing_image, status, low_stock_threshold } = req.body;
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

      // Handle image cleanup if new image uploaded
      const oldItem = await Item.findById(req.params.id);
      if (req.file && oldItem && oldItem.image_url) {
        await imageCleanup.deleteImage(oldItem.image_url);
      }

      const imageUrl = req.file ? '/images/uploads/' + req.file.filename : (existing_image || null);

      // Build audit diff
      const changes = {};
      if (oldItem) {
        if (oldItem.name !== name) changes.name = { from: oldItem.name, to: name };
        if (String(oldItem.item_type_id) !== String(item_type_id)) changes.type = { from: oldItem.item_type_id, to: parseInt(item_type_id) };
        if (String(oldItem.location_id || '') !== String(location_id || '')) changes.location = { from: oldItem.location_id, to: location_id || null };
        if ((oldItem.status || 'in_stock') !== (status || 'in_stock')) changes.status = { from: oldItem.status || 'in_stock', to: status || 'in_stock' };
        if (!is_unique && oldItem.quantity !== (parseInt(quantity) || 1)) changes.quantity = { from: oldItem.quantity, to: parseInt(quantity) || 1 };
        if ((oldItem.serial_number || '') !== (serial_number || '')) changes.serial_number = { from: oldItem.serial_number, to: serial_number };
      }

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
        status: status || 'in_stock',
        lowStockThreshold: low_stock_threshold ? parseInt(low_stock_threshold) : null,
      });

      await Tag.syncForItem(req.params.id, req.body.tags);

      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'update',
        entityType: 'item',
        entityId: parseInt(req.params.id),
        entityName: name,
        details: Object.keys(changes).length > 0 ? changes : undefined,
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
router.post('/:id/delete', requireEditor, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    // Clean up images
    if (item && item.image_url) {
      await imageCleanup.deleteImage(item.image_url);
    }
    if (item) {
      const images = await ItemImage.getForItem(item.id);
      for (const img of images) {
        await imageCleanup.deleteImage(img.url);
      }
    }

    await Item.delete(req.params.id);

    if (item) {
      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'delete',
        entityType: 'item',
        entityId: item.id,
        entityName: item.name,
      });
    }

    req.flash('success', 'Item deleted.');
    res.redirect('/items');
  } catch (err) {
    console.error('Item delete error:', err);
    req.flash('error', 'Failed to delete item.');
    res.redirect('/items/' + req.params.id);
  }
});

// Duplicate item
router.post('/:id/duplicate', requireEditor, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/items');
    }

    // Parse specs if needed
    let specs = item.specs;
    if (specs && typeof specs === 'string') {
      specs = JSON.parse(specs);
    }

    const newId = await Item.create({
      itemTypeId: item.item_type_id,
      locationId: item.location_id,
      name: item.name + ' (copy)',
      description: item.description,
      serialNumber: null,
      quantity: item.quantity,
      isUnique: item.is_unique,
      specs,
      imageUrl: item.image_url,
      notes: item.notes,
    });

    // Copy tags
    const tags = await Tag.getForItem(item.id);
    if (tags.length > 0) {
      await Tag.syncForItem(newId, tags.map((t) => t.name).join(','));
    }

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'create',
      entityType: 'item',
      entityId: newId,
      entityName: item.name + ' (copy)',
      details: { duplicatedFrom: item.id },
    });

    req.flash('success', 'Item duplicated.');
    res.redirect('/items/' + newId);
  } catch (err) {
    console.error('Item duplicate error:', err);
    req.flash('error', 'Failed to duplicate item.');
    res.redirect('/items/' + req.params.id);
  }
});

module.exports = router;
