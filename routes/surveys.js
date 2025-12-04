// Core Express dependencies for routing
const express = require('express');
const router = express.Router();

// Database connection via Knex.js - handles all our SQL queries
const knex = require('../db');

// Custom middleware to protect routes and check user permissions
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

/**
 * GET /surveys - Display a paginated list of all surveys
 * 
 * This is the main surveys listing page with search functionality.
 * Unlike other routes, this one is public (no authentication required).
 * Joins with registrations table to get participant and event details.
 * Supports pagination and searching by participant email or event name.
 */
router.get('/', async function(req, res, next) {
  // Parse pagination parameters from query string, default to page 1
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Show 10 surveys per page
  const offset = (page - 1) * pageSize; // Calculate how many records to skip
  
  // Get the search term from query string, default to empty string if not provided
  const searchTerm = req.query.search || '';

  // Build our database queries
  // Main query joins surveys with registrations to get full participant/event info
  let query = knex('surveys').join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid');
  // Count query stays simple - just counts surveys without the join for efficiency
  let countQuery = knex('surveys');

  // If the user entered a search term, filter the results
  if (searchTerm) {
    // Search by participant email OR event name (case-insensitive)
    // The 'ilike' operator is PostgreSQL-specific for case-insensitive matching
    query = query.where('surveys.participantemail', 'ilike', `%${searchTerm}%`)
                 .orWhere('surveys.eventname', 'ilike', `%${searchTerm}%`);
    // Apply the same filter to count query for accurate pagination
    countQuery = countQuery.where('participantemail', 'ilike', `%${searchTerm}%`)
                           .orWhere('eventname', 'ilike', `%${searchTerm}%`);
  }

  // Count total matching surveys to calculate number of pages needed
  const totalSurveys = await countQuery.count('surveyid as count').first();
  const totalPages = Math.ceil(totalSurveys.count / pageSize);

  // Fetch the actual survey data for the current page
  // We're aliasing database column names to camelCase for cleaner JavaScript usage
  const surveys = await query
    .select(
      'surveys.surveyid as id',
      'surveys.participantemail as participantEmail',
      'surveys.eventname as eventName',
      'surveys.eventdate as eventDate',
      'surveys.eventtimestart as eventTimeStart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .limit(pageSize)
    .offset(offset);
  
  const message = req.session.message;
  delete req.session.message;
  
  // Render the surveys list page with all necessary data
  res.render('surveys/index', { 
    surveys: surveys,                // The actual survey records to display
    user: req.session.user,          // Current logged-in user (for nav/display)
    currentPage: page,               // Which page we're on
    totalPages: totalPages,          // How many pages total (for pagination controls)
    searchTerm: searchTerm,           // Keep the search term in the form
    message
  });
});

/**
 * GET /surveys/view/:id - Display detailed view of a single survey
 * 
 * Shows all the details of one survey response including scores and comments.
 * Requires authentication but any authenticated user can view surveys.
 */
router.get('/view/:id', isAuthenticated, async (req, res) => {
  // Parse the survey ID from the URL parameter
  const surveyId = parseInt(req.params.id);
  
  // Fetch the complete survey data, joining with registrations for context
  const survey = await knex('surveys')
    .select(
      'surveys.surveyid as id',
      'surveys.registrationid',
      'surveys.participantemail',
      'surveys.eventname',
      'surveys.eventdate',
      'surveys.eventtimestart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid')
    .where('surveys.surveyid', surveyId)
    .first();

  // If survey doesn't exist (maybe deleted), redirect back to the list
  if (!survey) {
    return res.redirect('/surveys'); // Could also render a 404 error page
  }

  // Format the submission date for display in US format (MM-DD-YYYY)
  // This makes dates more readable in the UI
  if (survey.submissionDate) {
    survey.submissionDate = new Date(survey.submissionDate).toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '-'); // Replace slashes with dashes for consistency
  }

  // Render the survey detail page
  res.render('surveys/view', {
    survey,                    // The complete survey data
    user: req.session.user     // Current logged-in user (for nav)
  });
});

/**
 * GET /surveys/add - Display the form to add a new survey
 * 
 * Only managers can manually add surveys (protected by middleware).
 * Loads dropdown lists of all participants and events for selection.
 * In production, surveys are usually submitted by participants themselves,
 * but this lets managers manually enter survey data if needed.
 */
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Fetch all participants for the dropdown - convert column names to camelCase
  const participants = await knex('participants').select(
    'participantid as id',
    'participantfirstname as firstName',
    'participantlastname as lastName',
    'participantemail as email'
  );
  
  // Fetch all event occurrences for the dropdown
  const events = await knex('eventoccurrences').select(
    'eventoccurrenceid as id',
    'eventname as name',
    'eventdate as date',
    'eventtimestart as timeStart'
  );
  
  // Render the add form with the participant and event options
  res.render('surveys/add', {
    user: req.session.user,
    participants: participants,
    events: events,
    error: null,
    formData: {}
  });
});

/**
 * POST /surveys/add - Handle the submission of the new survey form
 * 
 * This is more complex than typical add routes because surveys are tied to registrations.
 * We need to:
 * 1. Verify the participant and event exist
 * 2. Find the matching registration (participant + event)
 * 3. Create the survey linked to that registration
 * 
 * This ensures data integrity - you can't have a survey without a registration.
 */
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Extract all the form fields from the request body
  const {
    participant_id, event_id,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  try {
    // First, verify that both the participant and event actually exist
    const participant = await knex('participants').where('participantid', participant_id).first();
    const eventOccurrence = await knex('eventoccurrences').where('eventoccurrenceid', event_id).first();

    if (!participant || !eventOccurrence) {
      const participants = await knex('participants').select('participantid as id', 'participantfirstname as firstName', 'participantlastname as lastName', 'participantemail as email');
      const events = await knex('eventoccurrences').select('eventoccurrenceid as id', 'eventname as name', 'eventdate as date', 'eventtimestart as timeStart');
      return res.render('surveys/add', {
        user: req.session.user,
        participants,
        events,
        error: 'Invalid Participant or Event selected.',
        formData: req.body
      });
    }

    // Now find the registration that links this participant to this event
    let registration = await knex('registrations')
      .where({
        participantid: participant_id,
        eventoccurrenceid: event_id
      })
      .first();

    // If there's no matching registration, create one on the fly
    if (!registration) {
      const newRegistrationIds = await knex('registrations').insert({
        participantid: participant.participantid,
        eventoccurrenceid: event_id,
        participantemail: participant.participantemail,
        eventname: eventOccurrence.eventname,
        eventdate: eventOccurrence.eventdate,
        eventtimestart: eventOccurrence.eventtimestart
      }).returning('registrationid');
      
      registration = newRegistrationIds[0];
    }

    // All validation passed - create the survey
    // We store denormalized data (email, event name, etc.) for historical accuracy
    // Even if the participant or event changes later, the survey reflects what it was at the time
    await knex('surveys').insert({
      registrationid: registration.registrationid,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart,
      // Parse scores as integers/floats, use null if empty
      // The || null ensures empty strings become null instead of 0
      surveysatisfactionscore: parseInt(satisfactionScore) || null,
      surveyusefulnessscore: parseInt(usefulnessScore) || null,
      surveyinstructorscore: parseInt(instructorScore) || null,
      surveyrecommendationscore: parseInt(recommendationScore) || null,
      surveyoverallscore: parseFloat(overallScore) || null,
      surveynpsbucket: npsBucket,
      surveycomments: comments,
      surveysubmissiondate: submissionDate,
      surveysubmissiontime: submissionTime
    });
    
    req.session.message = 'Survey added successfully!';
    res.redirect('/surveys');
  } catch (error) {
    console.error('Error adding survey:', error);
    const participants = await knex('participants').select('participantid as id', 'participantfirstname as firstName', 'participantlastname as lastName', 'participantemail as email');
    const events = await knex('eventoccurrences').select('eventoccurrenceid as id', 'eventname as name', 'eventdate as date', 'eventtimestart as timeStart');
    res.render('surveys/add', {
      user: req.session.user,
      participants,
      events,
      error: 'Error adding survey. Please check your input and try again.',
      formData: req.body
    });
  }
});

/**
 * GET /surveys/edit/:id - Display the form to edit an existing survey
 * 
 * Loads the survey data and all participants/events for the dropdowns.
 * Formats dates properly for HTML date input fields (YYYY-MM-DD format).
 */
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Parse the survey ID from the URL parameter
  const surveyId = parseInt(req.params.id);
  
  // Fetch the survey data, joining with registrations to get participant/event IDs
  const survey = await knex('surveys')
    .select(
      'surveys.surveyid as id',
      'surveys.registrationid',
      'surveys.participantemail',
      'surveys.eventname',
      'surveys.eventdate',
      'surveys.eventtimestart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid')
    .where('surveys.surveyid', surveyId)
    .first();

  // If survey doesn't exist, redirect back to the list
  if (!survey) {
    return res.redirect('/surveys');
  }

  // Format dates for HTML date input fields (requires YYYY-MM-DD format)
  // We convert the database dates to ISO format and extract just the date part
  if (survey.eventdate) {
    survey.eventdate = new Date(survey.eventdate).toISOString().split('T')[0];
  }
  if (survey.submissionDate) {
    survey.submissionDate = new Date(survey.submissionDate).toISOString().split('T')[0];
  }

  // Load all participants and events for the dropdown menus
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
  const events = await knex('eventoccurrences').select('eventoccurrenceid', 'eventname', 'eventdate', 'eventtimestart');

  // Render the edit form with the survey data pre-filled
  res.render('surveys/edit', {
    survey,                    // The survey being edited
    user: req.session.user,    // Current logged-in user (for nav)
    participants,              // All participants for dropdown
    events                     // All events for dropdown
  });
});

/**
 * POST /surveys/edit/:id - Handle the submission of the survey edit form
 * 
 * Similar validation logic to the add route - we need to verify the participant,
 * event, and registration all exist and are properly linked before updating.
 */
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  // Extract all the form fields
  const {
    participant_id, event_id,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  // Verify the participant and event exist
  const participant = await knex('participants').where('participantid', participant_id).first();
  const eventOccurrence = await knex('eventoccurrences').where('eventoccurrenceid', event_id).first();

  // If either is invalid, show error and stay on the edit page
  if (!participant || !eventOccurrence) {
    req.session.message = 'Invalid Participant or Event selected.';
    return res.redirect(`/surveys/edit/${surveyId}`);
  }

  // Find the registration linking this participant to this event
  const registration = await knex('registrations')
    .where({
      participantid: participant_id,
      eventoccurrenceid: event_id,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart
    })
    .first();

  // Can't update a survey to reference a non-existent registration
  if (!registration) {
    req.session.message = 'No matching registration found for the selected participant and event.';
    return res.redirect(`/surveys/edit/${surveyId}`);
  }

  // All validation passed - update the survey
  await knex('surveys')
    .where('surveyid', surveyId)
    .update({
      registrationid: registration.registrationid,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart,
      surveysatisfactionscore: parseInt(satisfactionScore) || null,
      surveyusefulnessscore: parseInt(usefulnessScore) || null,
      surveyinstructorscore: parseInt(instructorScore) || null,
      surveyrecommendationscore: parseInt(recommendationScore) || null,
      surveyoverallscore: parseFloat(overallScore) || null,
      surveynpsbucket: npsBucket,
      surveycomments: comments,
      surveysubmissiondate: submissionDate,
      surveysubmissiontime: submissionTime
    });
  
  // Success! Redirect back to the surveys list
  res.redirect('/surveys');
});

/**
 * POST /surveys/delete/:id - Delete a survey from the system
 * 
 * Permanently removes a survey response. Only managers can do this.
 * Note: This is a hard delete - the data is gone forever.
 * In some systems, you might want to soft-delete (mark as archived) instead
 * to maintain historical records, especially for compliance or analytics.
 */
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const surveyId = parseInt(req.params.id);
  
  // Delete the survey from the database
  await knex('surveys').where('surveyid', surveyId).del();
  
  // Redirect back to the surveys list
  res.redirect('/surveys');
});

// Export the router so it can be mounted in the main app (usually as /surveys)
module.exports = router;