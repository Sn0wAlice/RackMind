const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Settings page
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('settings/index', {
      title: 'Settings',
      profile: user,
    });
  } catch (err) {
    console.error('Settings error:', err);
    req.flash('error', 'Failed to load settings.');
    res.redirect('/');
  }
});

// Update profile
router.post('/profile', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || username.trim().length < 3) {
      req.flash('error', 'Username must be at least 3 characters.');
      return res.redirect('/settings');
    }

    // Check if username is taken by another user
    const existing = await User.findByUsername(username.trim());
    if (existing && existing.id !== req.session.user.id) {
      req.flash('error', 'Username already taken.');
      return res.redirect('/settings');
    }

    await User.updateProfile(req.session.user.id, {
      username: username.trim(),
      email: email ? email.trim() : null,
    });

    // Update session
    req.session.user.username = username.trim();
    req.session.user.email = email ? email.trim() : null;

    req.flash('success', 'Profile updated.');
    res.redirect('/settings');
  } catch (err) {
    console.error('Profile update error:', err);
    req.flash('error', 'Failed to update profile.');
    res.redirect('/settings');
  }
});

// Change password
router.post('/password', async (req, res) => {
  try {
    const { current_password, new_password, new_password_confirm } = req.body;

    if (!current_password || !new_password) {
      req.flash('error', 'All password fields are required.');
      return res.redirect('/settings');
    }

    // Verify current password
    const user = await User.findById(req.session.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/settings');
    }

    if (new_password.length < 6) {
      req.flash('error', 'New password must be at least 6 characters.');
      return res.redirect('/settings');
    }

    if (new_password !== new_password_confirm) {
      req.flash('error', 'New passwords do not match.');
      return res.redirect('/settings');
    }

    const hash = await bcrypt.hash(new_password, 10);
    await User.updatePassword(req.session.user.id, hash);

    req.flash('success', 'Password changed successfully.');
    res.redirect('/settings');
  } catch (err) {
    console.error('Password change error:', err);
    req.flash('error', 'Failed to change password.');
    res.redirect('/settings');
  }
});

module.exports = router;
