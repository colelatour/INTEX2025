exports.isAuthenticated = (req, res, next) => {
  // Allow GET requests for public viewing
  if (req.method === 'GET') {
    return next();
  }

  // For all other methods, require authentication
  if (req.session.user) {
    next();
  } else {
    req.session.message = 'Please log in to perform this action.';
    res.redirect('/login');
  }
};

exports.isFullyAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  
  // If user is not authenticated, store the original URL and redirect to login
  req.session.returnTo = req.originalUrl;
  req.session.message = 'Please log in to view this page.';
  res.redirect('/login');
};

exports.authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      // If the user is not logged in and the route requires a role, redirect to login
      req.session.message = 'You must be logged in to view this resource.';
      return res.redirect('/login');
    }

    if (roles.includes(req.session.user.role)) {
      next();
    } else {
      // If the user is logged in but does not have the required role
      req.session.message = 'You do not have permission to view this resource.';
      res.redirect('/'); 
    }
  };
};
