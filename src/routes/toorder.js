const express = require('express');
const Item = require('../models/Item');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Item.getToOrder();
    res.render('toorder/index', {
      title: 'To Order',
      items,
    });
  } catch (err) {
    console.error('To order error:', err);
    req.flash('error', 'Failed to load to-order list.');
    res.redirect('/');
  }
});

module.exports = router;
