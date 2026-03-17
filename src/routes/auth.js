const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { title: 'Login', layout: 'layouts/auth' });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash('error', 'Username and password are required.');
      return res.redirect('/auth/login');
    }

    const user = await User.findByUsername(username);
    if (!user) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/auth/login');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'editor',
      must_change_password: user.must_change_password,
    };

    if (user.must_change_password) {
      return res.redirect('/auth/change-password');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'An error occurred.');
    res.redirect('/auth/login');
  }
});

router.get('/change-password', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('auth/change-password', { title: 'Change Password' });
});

router.post('/change-password', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');

    const { password, password_confirm } = req.body;

    if (!password || password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/auth/change-password');
    }

    if (password !== password_confirm) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/change-password');
    }

    const hash = await bcrypt.hash(password, 10);
    await User.updatePassword(req.session.user.id, hash);

    req.session.user.must_change_password = 0;
    req.flash('success', 'Password changed successfully.');
    res.redirect('/');
  } catch (err) {
    console.error('Change password error:', err);
    req.flash('error', 'An error occurred.');
    res.redirect('/auth/change-password');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
