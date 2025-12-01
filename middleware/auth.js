exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.session.message = 'Please log in to view this resource.';
    res.redirect('/login');
  }
};

exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    if (roles.includes(req.session.user.role)) {
      next();
    } else {
      req.session.message = 'You do not have permission to view this resource.';
      res.redirect('/'); // Redirect to dashboard or a "not authorized" page
    }
  };
};
