const express = require('express');
const Item = require('../models/Item');
const Location = require('../models/Location');
const Category = require('../models/Category');
const ItemType = require('../models/ItemType');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [stats, locationCount, categoryCount, recentItems, recentActivity, categoryDistribution, statusDistribution, locationDistribution, typeDistribution, lowStockItems] = await Promise.all([
      Item.getStats(),
      Location.count(),
      Category.count(),
      Item.getRecent(8),
      ActivityLog.getRecent(5),
      Item.getCategoryDistribution(),
      Item.getStatusDistribution(),
      Item.getLocationDistribution(),
      Item.getTypeDistribution(),
      Item.getLowStock(),
    ]);

    res.render('dashboard/index', {
      title: 'Dashboard',
      stats,
      locationCount,
      categoryCount,
      recentItems,
      recentActivity,
      categoryDistribution,
      statusDistribution,
      locationDistribution,
      typeDistribution,
      lowStockItems,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Failed to load dashboard.');
    res.render('dashboard/index', {
      title: 'Dashboard',
      stats: { total: 0, total_quantity: 0 },
      locationCount: 0,
      categoryCount: 0,
      recentItems: [],
      recentActivity: [],
      categoryDistribution: [],
      statusDistribution: [],
      locationDistribution: [],
      typeDistribution: [],
      lowStockItems: [],
    });
  }
});

module.exports = router;
