const express = require('express');
const router = express.Router();
const data = require('../dummy-data');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET events listing.
router.get('/', function(req, res, next) {
  res.render('events/index', { events: data.events, user: req.session.user });
});

// GET route for adding a new event
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('events/add', { user: req.session.user });
});

// POST route for adding a new event
router.post('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const { name, date, description, timeStart, timeEnd, location, capacity, registrationDeadline } = req.body;
  const newId = data.events.length > 0 ? Math.max(...data.events.map(e => e.id)) + 1 : 1;
  const newEvent = {
    id: newId,
    name,
    date,
    description,
    timeStart,
    timeEnd,
    location,
    capacity: parseInt(capacity) || 0,
    registrationDeadline
  };
  data.events.push(newEvent);
  res.redirect('/events');
});

// GET route for editing an event
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = data.events.find(e => e.id === eventId);
  if (!event) {
    return res.redirect('/events');
  }
  res.render('events/edit', { event, user: req.session.user });
});

// POST route for updating an event
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const eventId = parseInt(req.params.id);
  const { name, date, description, timeStart, timeEnd, location, capacity, registrationDeadline } = req.body;
  const eventIndex = data.events.findIndex(e => e.id === eventId);

  if (eventIndex !== -1) {
    data.events[eventIndex] = {
      ...data.events[eventIndex],
      name,
      date,
      description,
      timeStart,
      timeEnd,
      location,
      capacity: parseInt(capacity) || 0,
      registrationDeadline
    };
  }
  res.redirect('/events');
});

// POST route for deleting an event
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const eventId = parseInt(req.params.id);
  data.events = data.events.filter(e => e.id !== eventId);
  res.redirect('/events');
});

module.exports = router;
