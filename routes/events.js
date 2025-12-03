const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET events listing.
router.get('/', async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const totalEvents = await knex('eventoccurrences').count('eventoccurrenceid as count').first();
  const totalPages = Math.ceil(totalEvents.count / pageSize);

  const events = await knex('eventoccurrences')
    .join('eventtemplates', 'eventoccurrences.eventtemplateid', '=', 'eventtemplates.eventtemplateid')
    .select(
      'eventoccurrences.eventoccurrenceid as id',
      'eventoccurrences.eventname as name',
      'eventoccurrences.eventdate as date',
      'eventoccurrences.eventtimestart as timeStart',
      'eventoccurrences.eventtimeend as timeEnd',
      'eventoccurrences.eventlocation as location',
      'eventoccurrences.eventcapacity as capacity',
      'eventoccurrences.eventregistrationdeadline as registrationDeadline',
      'eventtemplates.eventtype as eventType',
      'eventtemplates.eventdescription as description'
    )
    .limit(pageSize)
    .offset(offset);
  
  res.render('events/index', { 
    events: events, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages
  });
});

// GET route for adding a new event
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('events/add', { user: req.session.user });
});

// POST route for adding a new event
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { name, date, description, timeStart, timeEnd, location, capacity, registrationDeadline } = req.body;

  // Find the EventTemplateID for the given EventName
  const eventTemplate = await knex('eventtemplates').where('eventname', name).first();

  if (!eventTemplate) {
    // If event template not found, handle error or redirect with message
    req.session.message = `Event Template for "${name}" not found. Please ensure it exists.`;
    return res.redirect('/events/add');
  }

  await knex('eventoccurrences').insert({
    eventtemplateid: eventTemplate.eventtemplateid,
    eventname: name,
    eventdate: date,
    eventtimestart: timeStart,
    eventtimeend: timeEnd,
    eventlocation: location,
    eventcapacity: parseInt(capacity) || null,
    eventregistrationdeadline: registrationDeadline
  });
  res.redirect('/events');
});

// GET route for editing an event
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const eventId = parseInt(req.params.id);
  const event = await knex('eventoccurrences')
    .join('eventtemplates', 'eventoccurrences.eventtemplateid', '=', 'eventtemplates.eventtemplateid')
    .select(
      'eventoccurrences.eventoccurrenceid as id',
      'eventoccurrences.eventname as name',
      'eventoccurrences.eventdate as date',
      'eventoccurrences.eventtimestart as timeStart',
      'eventoccurrences.eventtimeend as timeEnd',
      'eventoccurrences.eventlocation as location',
      'eventoccurrences.eventcapacity as capacity',
      'eventoccurrences.eventregistrationdeadline as registrationDeadline',
      'eventtemplates.eventtype as eventType',
      'eventtemplates.eventdescription as description'
    )
    .where('eventoccurrences.eventoccurrenceid', eventId)
    .first();

  if (!event) {
    return res.redirect('/events');
  }

  // Format the dates for the date input fields
  if (event.date) {
    event.date = new Date(event.date).toISOString().split('T')[0];
  }
  if (event.registrationDeadline) {
    event.registrationDeadline = new Date(event.registrationDeadline).toISOString().split('T')[0];
  }

  res.render('events/edit', { event, user: req.session.user });
});

// POST route for updating an event
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const eventOccurrenceId = parseInt(req.params.id);
  const { name, date, description, timeStart, timeEnd, location, capacity, registrationDeadline } = req.body;

  // Find the EventTemplateID for the given EventName
  const eventTemplate = await knex('eventtemplates').where('eventname', name).first();

  if (!eventTemplate) {
    req.session.message = `Event Template for "${name}" not found. Please ensure it exists.`;
    return res.redirect(`/events/edit/${eventOccurrenceId}`);
  }

  await knex('eventoccurrences')
    .where('eventoccurrenceid', eventOccurrenceId)
    .update({
      eventtemplateid: eventTemplate.eventtemplateid,
      eventname: name,
      eventdate: date,
      eventtimestart: timeStart,
      eventtimeend: timeEnd,
      eventlocation: location,
      eventcapacity: parseInt(capacity) || null,
      eventregistrationdeadline: registrationDeadline
    });
  res.redirect('/events');
});

// POST route for deleting an event
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const eventId = parseInt(req.params.id);
  await knex('eventoccurrences').where('eventoccurrenceid', eventId).del();
  res.redirect('/events');
});

module.exports = router;
