const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const path = require('path');
const knex = require('./db');
const { isAuthenticated, authorizeRoles } = require('./middleware/auth'); // Require auth middleware

const usersRouter = require('./routes/users');
const participantsRouter = require('./routes/participants');
const eventsRouter = require('./routes/events');
const surveysRouter = require('./routes/surveys');
const milestonesRouter = require('./routes/milestones');
const donationsRouter = require('./routes/donations');

const app = express();
const port = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: 'your_secret_key', // a comment to remind user to replace
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

// Middleware to make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.message = req.session.message; // Make message available to templates
  next();
});

// Public routes (no authentication required)
app.get('/login', (req, res) => {
  const message = req.session.message;
  req.session.message = null; // Clear the message after retrieving it for rendering

  // Store the URL of the page the user was trying to access, excluding /login itself
  if (req.headers.referer && !req.headers.referer.includes('/login')) {
    req.session.returnTo = req.headers.referer;
  } else if (req.query.returnTo) { // Handle explicit returnTo query parameter if present
    req.session.returnTo = req.query.returnTo;
  } else {
    req.session.returnTo = '/'; // Default return to homepage
  }

  res.render('login', { message: message, user: req.session.user || null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await knex('users').where('useremail', email).first();

  if (user) {
    let passwordMatch = false;
    // Check if the password looks like a bcrypt hash
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password comparison
      passwordMatch = (password === user.password);
    }

    if (passwordMatch) {
      // If the password was plain text, hash it and update the database
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await knex('users').where('userid', user.userid).update({ password: hashedPassword });
      }

      req.session.user = { id: user.userid, firstName: user.userfirstname, role: user.userrole };
      console.log('User object after successful login:', user);
      console.log('Session user object after successful login:', req.session.user);
      req.session.message = 'Login successful!';
      const redirectUrl = req.session.returnTo || '/';
      delete req.session.returnTo;
      return res.redirect(redirectUrl);
    }
  }
  req.session.message = 'Invalid email or password';
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null });
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if email already exists
  const emailExists = await knex('users').where('useremail', email).first();

  if (emailExists) {
    req.session.message = 'Email already registered.';
    return res.redirect('/register');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUserId] = await knex('users').insert({
      userfirstname: firstName,
      userlastname: lastName,
      useremail: email,
      password: hashedPassword,
      userrole: 'common' // Default role for new registrations
    }).returning('userid'); // Assuming UserID is the primary key and auto-increments
    req.session.message = 'Registration successful! Please log in.';
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);
    req.session.message = 'Registration failed. Please try again.';
    res.redirect('/register');
  }
});

app.get('/logout', (req, res) => {
  const redirectTo = req.query.redirect || req.get('Referer') || '/'; // Get redirect from query, then Referer, then default
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    res.redirect(redirectTo);
  });
});

// Apply isAuthenticated middleware to all routes that need protection

// Protected Route Handlers (after authentication)
app.use('/users', isAuthenticated, authorizeRoles(['manager']), usersRouter);
app.use('/participants', isAuthenticated, participantsRouter);
app.use('/events', isAuthenticated, eventsRouter);
app.use('/surveys', isAuthenticated, surveysRouter);
app.use('/milestones', isAuthenticated, milestonesRouter);
app.use('/donations', isAuthenticated, donationsRouter);


app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Ella Rises Dashboard', user: req.session.user || null });
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Ella Rises', user: req.session.user || null });
});

app.get('/teapot', (req, res) => {
  res.status(418).render('teapot');
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
