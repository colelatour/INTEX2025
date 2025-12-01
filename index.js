const express = require('express');
const session = require('express-session');
const path = require('path');

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

// Route handlers
app.use('/users', usersRouter);
app.use('/participants', participantsRouter);
app.use('/events', eventsRouter);
app.use('/surveys', surveysRouter);
app.use('/milestones', milestonesRouter);
app.use('/donations', donationsRouter);

// Routes
app.get('/', (req, res) => {
  res.render('dashboard', { title: 'Ella Rises Dashboard' });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/login', (req, res) => {
  // TODO: Implement actual authentication logic
  res.redirect('/');
});

app.post('/register', (req, res) => {
  // TODO: Implement actual registration logic
  res.redirect('/login');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
