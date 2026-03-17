const express = require('express');
const Category = require('../models/Category');
const ItemType = require('../models/ItemType');
const ActivityLog = require('../models/ActivityLog');
const { requireEditor } = require('../middleware/auth');

const router = express.Router();

// List categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.getWithTypeCounts();

    // Get types for each category
    const categoriesWithTypes = await Promise.all(
      categories.map(async (cat) => {
        const types = await ItemType.getByCategoryId(cat.id);
        return { ...cat, types };
      })
    );

    res.render('categories/index', {
      title: 'Categories',
      categories: categoriesWithTypes,
    });
  } catch (err) {
    console.error('Categories list error:', err);
    req.flash('error', 'Failed to load categories.');
    res.redirect('/');
  }
});

// Create category form
router.get('/create', requireEditor, (req, res) => {
  res.render('categories/form', {
    title: 'Add Category',
    category: null,
    editing: false,
    currentIcon: 'fa-solid fa-folder',
  });
});

// Create category
router.post('/create', requireEditor, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/categories/create');
    }

    const id = await Category.create({ name, icon, description });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'create',
      entityType: 'category',
      entityId: id,
      entityName: name,
    });

    req.flash('success', 'Category created.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Category create error:', err);
    req.flash('error', 'Failed to create category. Name may already exist.');
    res.redirect('/categories/create');
  }
});

// Edit category form
router.get('/:id/edit', requireEditor, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/categories');
    }

    res.render('categories/form', {
      title: 'Edit Category',
      category,
      editing: true,
      currentIcon: category.icon,
    });
  } catch (err) {
    console.error('Category edit form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/categories');
  }
});

// Update category
router.post('/:id/edit', requireEditor, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/categories/' + req.params.id + '/edit');
    }

    await Category.update(req.params.id, { name, icon, description });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'update',
      entityType: 'category',
      entityId: parseInt(req.params.id),
      entityName: name,
    });

    req.flash('success', 'Category updated.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Category update error:', err);
    req.flash('error', 'Failed to update category.');
    res.redirect('/categories/' + req.params.id + '/edit');
  }
});

// Delete category
router.post('/:id/delete', requireEditor, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    await Category.delete(req.params.id);

    if (category) {
      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'delete',
        entityType: 'category',
        entityId: parseInt(req.params.id),
        entityName: category.name,
      });
    }

    req.flash('success', 'Category deleted.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Category delete error:', err);
    req.flash('error', 'Cannot delete default categories.');
    res.redirect('/categories');
  }
});

// Create type form
router.get('/:id/types/create', requireEditor, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/categories');
    }

    res.render('categories/type-form', {
      title: 'Add Type',
      category,
      type: null,
      editing: false,
      currentIcon: 'fa-solid fa-cube',
    });
  } catch (err) {
    console.error('Type create form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/categories');
  }
});

// Create type
router.post('/:id/types/create', requireEditor, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/categories/' + req.params.id + '/types/create');
    }

    const typeId = await ItemType.create({
      categoryId: req.params.id,
      name,
      icon,
      description,
    });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'create',
      entityType: 'type',
      entityId: typeId,
      entityName: name,
    });

    req.flash('success', 'Type created.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Type create error:', err);
    req.flash('error', 'Failed to create type. It may already exist in this category.');
    res.redirect('/categories/' + req.params.id + '/types/create');
  }
});

// Edit type form
router.get('/types/:id/edit', requireEditor, async (req, res) => {
  try {
    const type = await ItemType.findById(req.params.id);
    if (!type) {
      req.flash('error', 'Type not found.');
      return res.redirect('/categories');
    }

    const category = await Category.findById(type.category_id);

    res.render('categories/type-form', {
      title: 'Edit Type',
      category,
      type,
      editing: true,
      currentIcon: type.icon,
    });
  } catch (err) {
    console.error('Type edit form error:', err);
    req.flash('error', 'Failed to load form.');
    res.redirect('/categories');
  }
});

// Update type
router.post('/types/:id/edit', requireEditor, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      req.flash('error', 'Name is required.');
      return res.redirect('/categories/types/' + req.params.id + '/edit');
    }

    await ItemType.update(req.params.id, { name, icon, description });

    await ActivityLog.log({
      userId: req.session.user.id,
      action: 'update',
      entityType: 'type',
      entityId: parseInt(req.params.id),
      entityName: name,
    });

    req.flash('success', 'Type updated.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Type update error:', err);
    req.flash('error', 'Failed to update type.');
    res.redirect('/categories/types/' + req.params.id + '/edit');
  }
});

// Delete type
router.post('/types/:id/delete', requireEditor, async (req, res) => {
  try {
    const type = await ItemType.findById(req.params.id);
    await ItemType.delete(req.params.id);

    if (type) {
      await ActivityLog.log({
        userId: req.session.user.id,
        action: 'delete',
        entityType: 'type',
        entityId: parseInt(req.params.id),
        entityName: type.name,
      });
    }

    req.flash('success', 'Type deleted.');
    res.redirect('/categories');
  } catch (err) {
    console.error('Type delete error:', err);
    req.flash('error', err.message || 'Failed to delete type.');
    res.redirect('/categories');
  }
});

module.exports = router;
