// bcrypt is used to securely hash and compare passwords
const bcrypt = require('bcrypt');

// Express is the main web framework handling routing and middleware
const express = require('express');

// express-session manages user sessions (keeps users logged in)
const session = require('express-session');

// path helps build file paths in a safe way
const path = require('path');

// Knex is your SQL query builder/connection to the database
const knex = require('./db');

// Custom middleware for authentication and role-based authorization
const { isAuthenticated, authorizeRoles } = require('./middleware/auth');

// Route handlers (modularized for organization)
const usersRouter = require('./routes/users');
const participantsRouter = require('./routes/participants');
const eventsRouter = require('./routes/events');
const surveysRouter = require('./routes/surveys');
const milestonesRouter = require('./routes/milestones');
const donationsRouter = require('./routes/donations');

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 if none is set

// ---------------------------
// VIEW ENGINE SETUP
// ---------------------------

// Tells Express where your EJS templates are located
app.set('views', path.join(__dirname, 'views'));

// Tells Express you’re using EJS as your template engine
app.set('view engine', 'ejs');

// ---------------------------
// GLOBAL MIDDLEWARE
// ---------------------------

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data (like HTML forms)
app.use(express.urlencoded({ extended: false }));

// Expose the "public" folder for static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------
// SESSION CONFIGURATION
// ---------------------------

// Sets up sessions so users remain logged in across requests
app.use(session({
  // IMPORTANT: should be changed in production for security
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-local-dev', 

  resave: false,              // Don’t force session to save if nothing changed
  saveUninitialized: false,   // Don’t save new empty sessions
  cookie: { secure: false }   // secure: true requires HTTPS — good for production
}));

// ---------------------------
// MAKE USER DATA AVAILABLE IN ALL VIEWS
// ---------------------------

// This runs on every request
app.use((req, res, next) => {
  // Expose user info to templates (if logged in)
  res.locals.user = req.session.user;

  // Expose flash message if one exists
  res.locals.message = req.session.message;

  next();
});

// ---------------------------
// PUBLIC ROUTES (NO LOGIN REQUIRED)
// ---------------------------

// Login page
app.get('/login', (req, res) => {
  const message = req.session.message;
  req.session.message = null; // Clear flash message after showing it

  // Store the last page the user tried to access, so we redirect back after login
  if (req.headers.referer &&
      !req.headers.referer.includes('/login') &&
      !req.headers.referer.includes('/register')) {

    req.session.returnTo = req.headers.referer;
  } 
  else if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  } 
  else {
    req.session.returnTo = '/'; // Default redirect destination
  }

  res.render('login', { message, user: req.session.user || null });
});

// Login form submission
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Try to find user in the database
  const user = await knex('users').where('useremail', email).first();

  if (user) {
    let passwordMatch = false;

    // If stored password is a bcrypt hash
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {

      passwordMatch = await bcrypt.compare(password, user.password);

    } else {
      // TEMPORARY: Plain-text comparison (backward compatibility)
      passwordMatch = (password === user.password);
    }

    if (passwordMatch) {

      // If password used to be plain text, upgrade it to bcrypt
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await knex('users')
          .where('userid', user.userid)
          .update({ password: hashedPassword });
      }

      // Store minimal user info in the session
      req.session.user = {
        id: user.userid,
        firstName: user.userfirstname,
        role: user.userrole
      };

      console.log('User object after successful login:', user);
      console.log('Session user object after successful login:', req.session.user);

      // Redirect user back to where they started
      const redirectUrl = req.session.returnTo || '/';
      delete req.session.returnTo;
      return res.redirect(redirectUrl);

    } else {
      req.session.message = 'Incorrect email or password.';
    }

  } else {
    req.session.message = 'Incorrect email or password.';
  }

  res.redirect('/login');
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register', { 
    user: req.session.user || null,
    message: req.session.message || null
  });
  delete req.session.message;
});

// Registration handler
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  // Validate all fields are provided
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    req.session.message = 'All fields are required.';
    return res.redirect('/register');
  }

  // Check password match
  if (password !== confirmPassword) {
    req.session.message = 'Passwords do not match.';
    return res.redirect('/register');
  }

  // Check password length
  if (password.length < 6) {
    req.session.message = 'Password must be at least 6 characters long.';
    return res.redirect('/register');
  }

  // Check if email already exists in DB
  const emailExists = await knex('users')
    .where('useremail', email)
    .first();

  if (emailExists) {
    req.session.message = 'An account with this email already exists.';
    return res.redirect('/register');
  }

  try {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into DB
    await knex('users')
      .insert({
        userfirstname: firstName,
        userlastname: lastName,
        useremail: email,
        password: hashedPassword,
        userrole: 'common' // All new users start with basic permissions
      })
      .returning('userid');

    req.session.message = 'Account created successfully! Please login.';
    res.redirect('/login');

  } catch (error) {
    console.error('Error during registration:', error);
    req.session.message = 'An error occurred during registration. Please try again.';
    res.redirect('/register');
  }
});

// Logout
app.get('/logout', (req, res) => {
  const redirectTo = req.query.redirect || req.get('Referer') || '/';

  // Destroy session and redirect
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    res.redirect(redirectTo);
  });
});

// ---------------------------
// PUBLIC DONATION ROUTES
// Anyone can add a donor — no login required
// ---------------------------

// Render donation form
app.get('/donations/userdonor/add', (req, res) => {
  const message = req.session.message;
  delete req.session.message;

  res.render('donations/userdonor/add', {
    user: req.session.user,
    message
  });
});

// Handle donation form submission
app.post('/donations/userdonor/add', async (req, res) => {
  const { userdonorfirstname, userdonorlastname, userdonoramount, userdonordate } = req.body;

  try {
    // Insert donor record using raw SQL
    await knex.raw(
      'INSERT INTO userdonor (userdonorfirstname, userdonorlastname, userdonoramount, userdonordate) VALUES (?, ?, ?, ?)',
      [userdonorfirstname, userdonorlastname, parseFloat(userdonoramount) || 0.00, userdonordate]
    );

    req.session.message = 'User Donor added successfully!';
    res.redirect('/donations/userdonor/add');

  } catch (error) {
    console.error('Error adding user donor:', error);

    req.session.message = 'Error adding user donor: ' + error.message;
    res.redirect('/donations/userdonor/add');
  }
});

// ---------------------------
// PROTECTED ROUTES (LOGIN REQUIRED)
// ---------------------------

// Only managers can access /users routes
app.use('/users', isAuthenticated, authorizeRoles(['manager']), usersRouter);

// All other modules require basic authentication
app.use('/participants', isAuthenticated, participantsRouter);
app.use('/events', isAuthenticated, eventsRouter);
app.use('/surveys', isAuthenticated, surveysRouter);
app.use('/milestones', isAuthenticated, milestonesRouter);
app.use('/donations', isAuthenticated, donationsRouter);

// Dashboard view (must be logged in)
app.get('/dashboard', isAuthenticated, (req, res) => {
  const message = req.session.message;
  req.session.message = null;

  res.render('dashboard', {
    title: 'Ella Rises Dashboard',
    user: req.session.user || null,
    message
  });
});

// Homepage route
app.get('/', async (req, res) => {
  try {
    // Get participant count
    const participantCount = await knex('participants').count('* as count').first();
    
    // Get total donations (sum from both participant donations and user donations)
    const participantDonations = await knex('participants')
      .sum('totaldonations as total')
      .first();
    
    const userDonations = await knex('userdonor')
      .sum('userdonoramount as total')
      .first();
    
    const totalDonations = 
      (parseFloat(participantDonations?.total) || 0) + 
      (parseFloat(userDonations?.total) || 0);
    
    res.render('index', { 
      title: 'Ella Rises', 
      user: req.session.user || null,
      participantCount: participantCount?.count || 0,
      totalDonations: totalDonations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.render('index', { 
      title: 'Ella Rises', 
      user: req.session.user || null,
      participantCount: 0,
      totalDonations: '0.00'
    });
  }
});

// Fun “I'm a teapot” route
app.get('/teapot', (req, res) => {
  res.status(418).render('teapot');
});

// ---------------------------
// START THE SERVER
// ---------------------------

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
