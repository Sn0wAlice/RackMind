const express = require('express');
const Location = require('../models/Location');
const Item = require('../models/Item');
const ActivityLog = require('../models/ActivityLog');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

// List - tree view
router.get('/', async (req, res) => {
  try {
    const tree = await Location.getTree();
    const allLocations = await Location.getAll();

    res.render('locations/index', {
      title: 'Locations',
      tree,
      allLocations,
    });
  } catch (err) {
    console.error('Locations list error:', err);
    req.flash('error', 'Failed to load locations.');
    res.redirect('/');
  }
});

// Create form
router.get('/create', requireEditor, async (req, res) => {
  try {
    const locations = await Location.getAll();
    res.render('locations/form', {
      title: 'Add Location',
      location: null,
      locations,
      editing: false,
      currentIcon: 'fa-solid fa-location-dot',
      parentId: req.query.parent || '',
    });
  } catch (err) {
    console.error('Location create form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/locations');
  }
});

// Create
router.post('/create', requireEditor, async (req, res) => {
  try {
    const { parent_id, name, description, icon } = req.body;

    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/locations/create');
    }

    const id = await Location.create({
      parentId: parent_id || null,
      name,
      description,
      icon: icon || 'fa-solid fa-location-dot',
    });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'create',
      entityType: 'location',
      entityId: id,
      entityName: name,
    });

    req.flash('success', 'Location created.');
    res.redirect('/locations/' + id);
  } catch (err) {
    console.error('Location create error:', err);
    req.flash('error', 'Failed to create location.');
    res.redirect('/locations/create');
  }
});

// Show
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      req.flash('error', 'Location not found.');
      return res.redirect('/locations');
    }

    const [children, items, ancestors] = await Promise.all([
      Location.getChildren(location.id),
      Item.getByLocationId(location.id),
      Location.getAncestors(location.id),
    ]);

    res.render('locations/show', {
      title: location.name,
      location,
      children,
      items,
      ancestors,
    });
  } catch (err) {
    console.error('Location show error:', err);
    req.flash('error', 'Failed to load location.');
    res.redirect('/locations');
  }
});

// Edit form
router.get('/:id/edit', requireEditor, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      req.flash('error', 'Location not found.');
      return res.redirect('/locations');
    }

    const locations = await Location.getAll();

    res.render('locations/form', {
      title: 'Edit Location',
      location,
      locations: locations.filter((l) => l.id !== location.id),
      editing: true,
      currentIcon: location.icon,
      parentId: location.parent_id || '',
    });
  } catch (err) {
    console.error('Location edit form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/locations');
  }
});

// Update
router.post('/:id/edit', requireEditor, async (req, res) => {
  try {
    const { parent_id, name, description, icon } = req.body;

    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/locations/' + req.params.id + '/edit');
    }

    await Location.update(req.params.id, {
      parentId: parent_id || null,
      name,
      description,
      icon: icon || 'fa-solid fa-location-dot',
    });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'update',
      entityType: 'location',
      entityId: parseInt(req.params.id),
      entityName: name,
    });

    req.flash('success', 'Location updated.');
    res.redirect('/locations/' + req.params.id);
  } catch (err) {
    console.error('Location update error:', err);
    req.flash('error', err.message || 'Failed to update location.');
    res.redirect('/locations/' + req.params.id + '/edit');
  }
});

// Delete
router.post('/:id/delete', requireEditor, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    await Location.delete(req.params.id);

    if (location) {
      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'delete',
        entityType: 'location',
        entityId: parseInt(req.params.id),
        entityName: location.name,
      });
    }

    req.flash('success', 'Location deleted.');
    res.redirect('/locations');
  } catch (err) {
    console.error('Location delete error:', err);
    req.flash('error', 'Failed to delete location.');
    res.redirect('/locations/' + req.params.id);
  }
});

module.exports = router;
