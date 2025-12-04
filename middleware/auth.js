// ==========================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==========================================
// This file contains "middleware" functions. In Express, middleware acts like a checkpoint.
// When a user requests a page, they have to pass through these functions before the server 
// sends them the final page.

// --- Basic Authentication Check ---
// This function answers the question: "Is the user logged in at all?"
exports.isAuthenticated = (req, res, next) => {
  // Check if the session object has a 'user' property.
  // This property is usually created when the user successfully logs in.
  if (req.session.user) {
    // Success! The user is logged in.
    // 'next()' tells Express to move on to the next function in the chain 
    // (usually the actual route handler that renders the page).
    next();
  } else {
    // Failure. The user is just a guest.
    // We set a user-friendly message to display on the login screen.
    req.session.message = 'Please log in to view this page.'; 
    
    // UX Feature: Store the URL they were *trying* to visit.
    // Once they log in, we can redirect them back here so they don't lose their place.
    req.session.returnTo = req.originalUrl; 
    
    // Send them to the login page.
    res.redirect('/login');
  }
};

// --- Strict Authentication Check ---
// This appears to be a duplicate or alias of 'isAuthenticated'.
// In some systems, 'isFullyAuthenticated' might check for extra security (like 2FA),
// but currently, it performs the exact same logic as the function above.
exports.isFullyAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next(); // User is logged in, proceed.
  }
  
  // User is not logged in. Save their destination and kick them to login.
  req.session.returnTo = req.originalUrl;
  req.session.message = 'Please log in to view this page.';
  res.redirect('/login');
};



// --- Role-Based Authorization ---
// This is a "Higher-Order Function" (a function that returns another function).
// It answers the question: "Does the user have the SPECIFIC rank required?"
// Usage example: authorizeRoles(['admin', 'manager'])
exports.authorizeRoles = (roles) => {
  // We return the actual middleware function that Express will use.
  return (req, res, next) => {
    
    // 1. Safety Check: Are they even logged in?
    // We can't check a role if the user object doesn't exist.
    if (!req.session.user) {
      req.session.message = 'You must be logged in to view this resource.';
      return res.redirect('/login');
    }

    // 2. Role Check: Is the user's role in the allowed list?
    // We use .includes() to see if 'req.session.user.role' exists in the 'roles' array passed in above.
    if (roles.includes(req.session.user.role)) {
      // Success! They have the right permission (e.g., they are an 'admin').
      next();
    } else {
      // Failure. They are logged in, but their rank is too low.
      // We redirect them to the home page (or a 403 error page) rather than login,
      // because logging in again wouldn't fix the issue—they just don't have access.
      req.session.message = 'You do not have permission to view this resource.';
      res.redirect('/'); 
    }
  };
};