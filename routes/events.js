// Core Express dependencies for routing
const express = require('express');
const router = express.Router();

// Database connection via Knex.js - handles all our SQL queries
const knex = require('../db');

// Custom middleware to protect routes and check user permissions
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

/**
 * GET /events - Display a paginated list of all event occurrences
 * 
 * This system uses a template pattern for events:
 * - EventTemplates: Define the general event type (e.g., "Python Workshop", "Career Fair")
 * - EventOccurrences: Specific instances of those templates (e.g., "Python Workshop on March 15")
 * 
 * This route is public (no authentication required), allowing anyone to browse upcoming events.
 * Joins with eventtemplates to pull in the event type and description.
 * Supports searching by event name or location.
 */
router.get('/', async function(req, res, next) {
  // Parse pagination parameters from query string, default to page 1
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Show 10 events per page
  const offset = (page - 1) * pageSize; // Calculate how many records to skip
  
  // Get the search term from query string, default to empty string if not provided
  const searchTerm = req.query.search || '';

  // Build our database queries
  // Main query joins eventoccurrences with eventtemplates to get full event details
  let query = knex('eventoccurrences').join('eventtemplates', 'eventoccurrences.eventtemplateid', '=', 'eventtemplates.eventtemplateid');
  // Count query stays simple - just counts occurrences without the join for efficiency
  let countQuery = knex('eventoccurrences');

  // If the user entered a search term, filter the results
  if (searchTerm) {
    // Search by event name OR location (case-insensitive)
    // For example: "workshop" finds all workshops, "Denver" finds all events in Denver
    // The 'ilike' operator is PostgreSQL-specific for case-insensitive matching
    query = query.where('eventoccurrences.eventname', 'ilike', `%${searchTerm}%`)
                 .orWhere('eventoccurrences.eventlocation', 'ilike', `%${searchTerm}%`);
    // Apply the same filter to count query for accurate pagination
    countQuery = countQuery.where('eventname', 'ilike', `%${searchTerm}%`)
                           .orWhere('eventlocation', 'ilike', `%${searchTerm}%`);
  }

  // Count total matching events to calculate number of pages needed
  const totalEventsResult = await countQuery.count('eventoccurrenceid as count').first();
  const totalEvents = parseInt(totalEventsResult ? totalEventsResult.count : 0); // Ensure it's a number, handle null/undefined
  const totalPages = Math.ceil(totalEvents / pageSize);

  // Fetch the actual event data for the current page
  // We're pulling data from both tables and aliasing to camelCase for cleaner JavaScript
  const events = await query
    .select(
      'eventoccurrences.eventoccurrenceid as id',
      'eventoccurrences.eventname as name',
      'eventoccurrences.eventdate as date',
      'eventoccurrences.eventtimestart as timeStart',
      'eventoccurrences.eventtimeend as timeEnd',
      'eventoccurrences.eventlocation as location',
      'eventoccurrences.eventcapacity as capacity',
      'eventoccurrences.eventregistrationdeadline as registrationDeadline',
      'eventtemplates.eventtype as eventType',              // From template: type (e.g., "Workshop", "Seminar")
      'eventtemplates.eventdescription as description'      // From template: general description
    )
    .limit(pageSize)
    .offset(offset);
  
  // Render the events list page with all necessary data
  res.render('events/index', { 
    events: events,                  // The actual event records to display
    user: req.session.user,          // Current logged-in user (for nav/display)
    currentPage: page,               // Which page we're on
    totalPages: totalPages,          // How many pages total (for pagination controls)
    searchTerm: searchTerm           // Keep the search term in the form
  });
});

// 1. GET Route: Display the "Create New Event" Form
// We need this to render the HTML page where the user types in the details.
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  try {
    // We need to fetch the Event Templates (e.g., "Workshop", "Seminar", "Gala")
    // so we can populate a dropdown menu <select> in the form. 
    // An event occurrence usually needs to be linked to a specific template type.
    const templates = await knex('eventtemplates')
      .select('eventtemplateid', 'eventtype', 'eventdescription');

    // Render the 'add' view and pass the templates to it
    res.render('events/add', { 
      user: req.session.user, 
      templates: templates 
    });

  } catch (error) {
    console.error('Error loading add event form:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 2. POST Route: Process the Form Submission
// This is where the actual "Saving" happens when the user clicks Submit.
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Destructure the raw form data from req.body
  // These names (event_name, event_date, etc.) must match the 'name' attributes in your HTML form inputs
  const { 
    event_name, 
    event_date, 
    time_start, 
    time_end, 
    location, 
    capacity, 
    registration_deadline,
    template_id // This comes from the <select> dropdown we populated in the GET route
  } = req.body;

  try {
    // Validate that a template was actually selected
    if (!template_id) {
        // You might want to handle this better (e.g., flash message), but here is a basic check
        return res.status(400).send("Event Template is required");
    }

    // Insert the new record into the 'eventoccurrences' table
    await knex('eventoccurrences').insert({
      eventname: event_name,
      eventdate: event_date,
      eventtimestart: time_start,
      eventtimeend: time_end,
      eventlocation: location,
      eventcapacity: parseInt(capacity) || 0, // Ensure this is a number
      eventregistrationdeadline: registration_deadline,
      eventtemplateid: parseInt(template_id)  // Link this occurrence to the parent template
    });

    // If successful, redirect the user back to the main list so they can see their new event
    res.redirect('/events');

  } catch (error) {
    // Log the error for debugging
    console.error('Error adding new event:', error);
    
    // Ideally, you would redirect back to the add form with a flash message saying "Error adding event"
    // For now, we redirect to the list to prevent the app from hanging
    res.redirect('/events');
  }
});

/**
 * GET /events/edit/:id - Display the form to edit an existing event occurrence
 * 
 * Loads the event data from both tables (occurrence + template) and formats
 * the dates properly for HTML date input fields (YYYY-MM-DD format).
 */
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Parse the event occurrence ID from the URL parameter
  const eventId = parseInt(req.params.id);
  
  // Fetch the event data, joining with the template to get type and description
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
      'eventoccurrences.eventtemplateid as templateId',
      'eventtemplates.eventtype as eventType',
      'eventtemplates.eventdescription as description'
    )
    .where('eventoccurrences.eventoccurrenceid', eventId)
    .first();

  // If event doesn't exist (maybe deleted by someone else), go back to the list
  if (!event) {
    return res.redirect('/events');
  }

  // Format dates for HTML date input fields (requires YYYY-MM-DD format)
  // We convert the database dates to ISO format and extract just the date part
  if (event.date) {
    event.date = new Date(event.date).toISOString().split('T')[0];
  }
  if (event.registrationDeadline) {
    event.registrationDeadline = new Date(event.registrationDeadline).toISOString().split('T')[0];
  }

  // Fetch all templates for the dropdown
  const templates = await knex('eventtemplates')
    .select('eventtemplateid', 'eventtype', 'eventdescription');

  // Render the edit form with the event data pre-filled
  res.render('events/edit', { 
    event,                           // The event being edited
    templates,                       // All templates for dropdown
    user: req.session.user           // Current logged-in user (for nav)
  });
});

/**
 * POST /events/edit/:id - Handle the submission of the event edit form
 * 
 * Similar to the add route, this requires the event name to match an existing
 * template. If you change the event name, it must match a different template.
 * This could be confusing for users - they might think they're just renaming
 * the event, but they're actually changing which template it's linked to.
 */
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const eventOccurrenceId = parseInt(req.params.id);
  
  // Extract all the form fields
  const { event_name, event_date, time_start, time_end, location, capacity, registration_deadline, template_id } = req.body;

  // Validate that a template was selected
  if (!template_id) {
    return res.status(400).send("Event Template is required");
  }

  // Update the event occurrence
  await knex('eventoccurrences')
    .where('eventoccurrenceid', eventOccurrenceId)
    .update({
      eventtemplateid: parseInt(template_id),
      eventname: event_name,
      eventdate: event_date,
      eventtimestart: time_start,
      eventtimeend: time_end,
      eventlocation: location,
      eventcapacity: parseInt(capacity) || null,
      eventregistrationdeadline: registration_deadline
    });
  
  // Success! Redirect back to the events list
  res.redirect('/events');
});

/**
 * POST /events/delete/:id - Delete an event occurrence from the system
 * 
 * Permanently removes an event occurrence. Only managers can do this.
 * 
 * WARNING: This could have serious data integrity issues!
 * If this event has registrations or surveys associated with it, this delete
 * might fail due to foreign key constraints, or worse, cascade delete all
 * that related data depending on your database schema.
 * 
 * Consider implementing:
 * - Soft delete (mark as cancelled instead of removing)
 * - Check for registrations before allowing deletion
 * - Cascade considerations (what happens to registrations/surveys?)
 * - Confirm dialog warning about data loss
 */
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const eventId = parseInt(req.params.id);
  
  // Delete the event occurrence from the database
  // This could cascade delete registrations and surveys if configured that way
  await knex('eventoccurrences').where('eventoccurrenceid', eventId).del();
  
  // Redirect back to the events list
  res.redirect('/events');
});

// Export the router so it can be mounted in the main app (usually as /events)
module.exports = router;