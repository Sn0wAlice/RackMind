require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { doubleCsrf } = require('csrf-csrf');

const { requireAuth, requirePasswordChange } = require('./middleware/auth');
const flashMiddleware = require('./middleware/flash');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Cookie parser (needed for CSRF)
app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret-change-me'));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
    },
  })
);

// Flash messages
app.use(flash());
app.use(flashMiddleware);

// Set view defaults early (before CSRF which might trigger error pages)
app.use((req, res, next) => {
  res.locals.user = null;
  res.locals.currentPath = req.path;
  res.locals.toOrderCount = 0;
  res.locals.csrfToken = '';
  next();
});

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth/login', authLimiter);

// CSRF protection
const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'dev-secret-change-me',
  getSessionIdentifier: (req) => req.session?.id || '',
  cookieName: '_csrf',
  cookieOptions: { httpOnly: true, sameSite: 'strict', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  getCsrfTokenFromRequest: (req) => req.body._csrf || req.headers['x-csrf-token'],
});

// Apply CSRF to all non-GET/HEAD/OPTIONS routes (skip API v1)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1')) return next();
  if (req.path === '/items/create' && req.method === 'POST') return next();
  doubleCsrfProtection(req, res, next);
});

// Make CSRF token available in all views
app.use((req, res, next) => {
  res.locals.csrfToken = generateCsrfToken(req, res);
  next();
});

// Inject user + sidebar badge data into all views
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.toOrderCount = 0;
  if (req.session.user) {
    try {
      const Item = require('./models/Item');
      const lowStock = await Item.getLowStock();
      res.locals.toOrderCount = lowStock ? lowStock.length : 0;
    } catch { /* silent */ }
  }
  next();
});

// Image upload config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'images', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

app.locals.upload = upload;

// Routes
app.use('/auth', require('./routes/auth'));

// Protected routes
app.use(requireAuth);
app.use(requirePasswordChange);

app.use('/', require('./routes/dashboard'));
app.use('/items', require('./routes/items'));
app.use('/locations', require('./routes/locations'));
app.use('/categories', require('./routes/categories'));
app.use('/users', require('./routes/users'));
app.use('/settings', require('./routes/settings'));
app.use('/api', require('./routes/api'));
app.use('/activity', require('./routes/activity'));
app.use('/export', require('./routes/export'));
app.use('/to-order', require('./routes/toorder'));
app.use('/api/v1', require('./routes/api-v1'));

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404',
    message: 'Page not found',
  });
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message === 'invalid csrf token') {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: 'Invalid CSRF token. Please refresh the page.' });
    }
    req.flash('error', 'Form expired. Please try again.');
    return res.redirect('back');
  }
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RackMind running on http://localhost:${PORT}`);
});
