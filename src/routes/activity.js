const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, entity_type, user_id } = req.query;
    const result = await ActivityLog.getAll({
      page: parseInt(page),
      limit: 50,
      entityType: entity_type,
      userId: user_id,
    });

    const users = await User.getAll();

    res.render('activity/index', {
      title: 'Activity Log',
      ...result,
      filters: { entity_type: entity_type || '', user_id: user_id || '' },
      users,
      query: req.query,
    });
  } catch (err) {
    console.error('Activity log error:', err);
    req.flash('error', 'Failed to load activity log.');
    res.redirect('/');
  }
});

module.exports = router;
