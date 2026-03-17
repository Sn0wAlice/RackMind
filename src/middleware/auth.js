function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/auth/login');
  }
  next();
}

function requirePasswordChange(req, res, next) {
  if (
    req.session.user &&
    req.session.user.must_change_password &&
    req.path !== '/auth/change-password' &&
    req.path !== '/auth/logout'
  ) {
    req.flash('info', 'You must change your password before continuing.');
    return res.redirect('/auth/change-password');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', 'Please log in to continue.');
      return res.redirect('/auth/login');
    }
    const userRole = req.session.user.role || 'editor';
    if (!roles.includes(userRole)) {
      req.flash('error', 'You do not have permission to access this page.');
      return res.redirect('/');
    }
    next();
  };
}

function requireEditor(req, res, next) {
  const role = req.session.user?.role || 'editor';
  if (role === 'viewer') {
    req.flash('error', 'Viewers cannot perform this action.');
    return res.redirect('back');
  }
  next();
}

module.exports = { requireAuth, requirePasswordChange, requireRole, requireEditor };
