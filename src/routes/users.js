const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// All user management requires admin role
router.use(requireRole('admin'));

// List users
router.get('/', async (req, res) => {
  try {
    const users = await User.getAll();
    res.render('users/index', {
      title: 'Users',
      users,
    });
  } catch (err) {
    console.error('Users list error:', err);
    req.flash('error', 'Failed to load users.');
    res.redirect('/');
  }
});

// Create user form
router.get('/create', (req, res) => {
  res.render('users/form', {
    title: 'Add User',
  });
});

// Create user
router.post('/create', async (req, res) => {
  try {
    const { username, email, password, must_change_password, role } = req.body;

    if (!username || !password) {
      req.flash('error', 'Username and password are required.');
      return res.redirect('/users/create');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/users/create');
    }

    const existing = await User.findByUsername(username);
    if (existing) {
      req.flash('error', 'Username already taken.');
      return res.redirect('/users/create');
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      passwordHash: hash,
      mustChangePassword: !!must_change_password,
      role: role || 'editor',
    });

    req.flash('success', 'User created.');
    res.redirect('/users');
  } catch (err) {
    console.error('User create error:', err);
    req.flash('error', 'Failed to create user.');
    res.redirect('/users/create');
  }
});

// Delete user
router.post('/:id/delete', async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.session.user.id) {
      req.flash('error', 'You cannot delete yourself.');
      return res.redirect('/users');
    }

    await User.delete(req.params.id);
    req.flash('success', 'User deleted.');
    res.redirect('/users');
  } catch (err) {
    console.error('User delete error:', err);
    req.flash('error', err.message || 'Failed to delete user.');
    res.redirect('/users');
  }
});

module.exports = router;
