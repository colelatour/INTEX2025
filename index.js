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
  const { email, password } = req.body; // Changed from username to email
  const user = dummyData.users.find(u => u.email === email); // Find user by email

  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      req.session.user = { id: user.id, username: user.username, firstName: user.firstName, role: user.role }; // Include firstName in session
      console.log('User object after successful login:', user); // Debug log
      console.log('Session user object after successful login:', req.session.user); // Debug log
      req.session.message = 'Login successful!'; // Set a success message
      return res.redirect('/');
    }
  }
  req.session.message = 'Invalid email or password'; // Updated message
  res.redirect('/login');
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user || null });
});

app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  // Check if username or email already exists
  const usernameExists = dummyData.users.some(user => user.username === username);
  const emailExists = dummyData.users.some(user => user.email === email);

  if (usernameExists) {
    req.session.message = 'Username already taken.';
    return res.redirect('/register');
  }

  if (emailExists) {
    req.session.message = 'Email already registered.';
    return res.redirect('/register');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: dummyData.users.length > 0 ? Math.max(...dummyData.users.map(u => u.id)) + 1 : 1,
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role: 'common' // Default role for new registrations
    };
    dummyData.users.push(newUser);
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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
