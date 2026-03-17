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

module.exports = { requireAuth, requirePasswordChange };
