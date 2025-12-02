const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const path = require('path');
const dummyData = require('./dummy-data'); // Require dummy data
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
  res.render('login', { message: message, user: req.session.user || null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = dummyData.users.find(u => u.username === username);

  if (user) {
    // In a real app, passwords would be hashed. For dummy data, we compare plaintext.
    // If you were hashing, it would look like: await bcrypt.compare(password, user.password)
    if (password === user.password) {
      req.session.user = { id: user.id, username: user.username, role: user.role };
      req.session.message = 'Login successful!'; // Set a success message
      return res.redirect('/');
    }
  }
  req.session.message = 'Invalid username or password';
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null });
});

app.post('/register', (req, res) => {
  // TODO: Implement actual registration logic
  req.session.message = 'Registration not yet implemented.';
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    // Redirect to the previous page or a default page if Referer is not available
    res.redirect(req.get('Referer') || '/');
  });
});

// Apply isAuthenticated middleware to all routes that need protection

// Protected Route Handlers (after authentication)
app.use('/users', authorizeRoles(['manager']), usersRouter);
app.use('/participants', participantsRouter);
app.use('/events', eventsRouter);
app.use('/surveys', surveysRouter);
app.use('/milestones', milestonesRouter);
app.use('/donations', authorizeRoles(['manager']), donationsRouter);


// Routes
app.get('/', (req, res) => {
  res.render('dashboard', { title: 'Ella Rises Dashboard', user: req.session.user || null });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
