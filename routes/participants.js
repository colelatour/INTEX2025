// Core Express dependencies for routing
const express = require('express');
const router = express.Router();

// Database connection via Knex.js - handles all our SQL queries
const knex = require('../db');

// Custom middleware to protect routes and check user permissions
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

/**
 * GET /participants - Display a paginated list of all participants
 * 
 * This is the main participants listing page with search functionality.
 * Unlike some other routes, this is public (no authentication required),
 * allowing anyone to browse participants. This might be intentional for
 * a community directory, but worth reviewing based on privacy requirements.
 * 
 * Search supports both single terms (searches across first name, last name, email)
 * and two-word searches (treated as "first name" + "last name").
 */
router.get('/', async function(req, res, next) {
  // Parse pagination parameters from query string, default to page 1
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Show 10 participants per page
  const offset = (page - 1) * pageSize; // Calculate how many records to skip
  
  // Get the search term from query string, default to empty string if not provided
  const searchTerm = req.query.search || '';

  // Start building our database queries
  // We need two queries: one for the actual data, one for counting total results
  let query = knex('participants');
  let countQuery = knex('participants');

  // If the user entered a search term, filter the results
  if (searchTerm) {
    // Split the search term by spaces and remove empty strings
    // This allows searching for "John Doe" as firstName + lastName
    const searchTerms = searchTerm.split(' ').filter(term => term);
    
    if (searchTerms.length > 1) {
      // Multiple words = assume first name and last name search
      // For example: "Jane Smith" searches for firstName like "Jane" AND lastName like "Smith"
      // The 'ilike' operator is PostgreSQL-specific for case-insensitive matching
      query = query.where(function() {
        this.where('participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
      // Apply the same filter to the count query for accurate pagination
      countQuery = countQuery.where(function() {
        this.where('participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
    } else {
      // Single word = search across first name, last name, OR email
      // This is more flexible - "John" will find anyone with John in any of these fields
      // The % wildcards mean "match anywhere in the string"
      query = query.where('participantfirstname', 'ilike', `%${searchTerm}%`)
                   .orWhere('participantlastname', 'ilike', `%${searchTerm}%`)
                   .orWhere('participantemail', 'ilike', `%${searchTerm}%`);
      countQuery = countQuery.where('participantfirstname', 'ilike', `%${searchTerm}%`)
                             .orWhere('participantlastname', 'ilike', `%${searchTerm}%`)
                             .orWhere('participantemail', 'ilike', `%${searchTerm}%`);
    }
  }

  // Count total matching participants to calculate number of pages needed
  const totalParticipants = await countQuery.count('participantid as count').first();
  const totalPages = Math.ceil(totalParticipants.count / pageSize);

  // Fetch the actual participant data for the current page
  const participants = await query.select('*').limit(pageSize).offset(offset);
  
  const message = req.session.message;
  delete req.session.message;
  
  // Render the participants list page with all necessary data
  res.render('participants/index', { 
    participants: participants,      // The actual participant records to display
    user: req.session.user,          // Current logged-in user (for nav/display)
    currentPage: page,               // Which page we're on
    totalPages: totalPages,          // How many pages total (for pagination controls)
    searchTerm: searchTerm,           // Keep the search term in the form
    message
  });
});

/**
 * GET /participants/add - Display the form to add a new participant
 * 
 * Only managers can add participants (protected by middleware).
 * Shows a blank form for creating a new participant record.
 */
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('participants/add', { 
    user: req.session.user,
    error: null,
    formData: {}
  });
});

/**
 * POST /participants/add - Handle the submission of the new participant form
 * 
 * Creates a new participant record with all their contact info, demographics,
 * and interests. The totalDonations field tracks cumulative donations and
 * defaults to 0.00 if not provided.
 */
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Extract all the form fields from the request body
  // This is a lot of fields - participants have comprehensive profiles
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;
  
  try {
    // Insert the new participant into the database
    // Note: Using the exact column names from our database schema (snake_case style)
    await knex('participants').insert({
      participantfirstname: firstName,
      participantlastname: lastName,
      participantemail: email,
      participantdob: dob,                                    // Date of birth
      participantphone: phone,
      participantcity: city,
      participantstate: state,
      participantzip: zip,
      participantschooloremployer: schoolEmployer,            // Where they work/study
      participantfieldofinterest: fieldOfInterest,            // What topics interest them
      totaldonations: parseFloat(totalDonations) || 0.00      // Parse as decimal, default to 0.00
    });
    
    // For success, we can use a flash message and redirect
    req.session.message = 'Participant added successfully!';
    res.redirect('/participants');
  } catch (error) {
    console.error('Error adding participant:', error);
    res.render('participants/add', {
      user: req.session.user,
      error: 'Error adding participant. Please check your input and try again. The email may already be in use.',
      formData: req.body
    });
  }
});

/**
 * GET /participants/edit/:id - Display the form to edit an existing participant
 * 
 * Loads the participant's current data and shows it in an edit form.
 * Special handling for the date of birth field to work with HTML date inputs.
 */
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Parse the participant ID from the URL parameter
  const participantId = parseInt(req.params.id);
  
  // Fetch the participant from the database
  const participant = await knex('participants').where('participantid', participantId).first();
  
  // If participant doesn't exist (maybe deleted by someone else), go back to the list
  if (!participant) {
    return res.redirect('/participants');
  }

  // Format the date of birth for HTML date input fields
  // Date inputs require YYYY-MM-DD format, so we convert the database date
  // and extract just the date part (ignoring time and timezone)
  if (participant.participantdob) {
    participant.participantdob = new Date(participant.participantdob).toISOString().split('T')[0];
  }

  // Render the edit form with the participant's current data pre-filled
  res.render('participants/edit', { 
    participant,                     // The participant being edited
    user: req.session.user           // Current logged-in user (for nav)
  });
});

/**
 * POST /participants/edit/:id - Handle the submission of the participant edit form
 * 
 * Updates all of the participant's information. Unlike user editing where we
 * might conditionally update the password, here we update all fields every time.
 */
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participantId = parseInt(req.params.id);
  
  // Extract all the form fields from the request body
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;

  // Update the participant record in the database
  // All fields are updated - there's no conditional logic here
  await knex('participants').where('participantid', participantId).update({
    participantfirstname: firstName,
    participantlastname: lastName,
    participantemail: email,
    participantdob: dob,
    participantphone: phone,
    participantcity: city,
    participantstate: state,
    participantzip: zip,
    participantschooloremployer: schoolEmployer,
    participantfieldofinterest: fieldOfInterest,
    totaldonations: parseFloat(totalDonations) || 0.00      // Parse as decimal, default to 0.00
  });
  
  // Redirect back to the participants list to see the updated info
  res.redirect('/participants');
});

/**
 * POST /participants/delete/:id - Delete a participant from the system
 * 
 * Permanently removes a participant record. Only managers can do this.
 * 
 * WARNING: This is a hard delete with potential data integrity issues!
 * If this participant has related records (registrations, surveys, donations),
 * this delete might fail due to foreign key constraints, or worse, it might
 * cascade delete all their related data depending on your DB schema.
 * 
 * Consider implementing:
 * - Soft delete (mark as inactive instead of removing)
 * - Check for related records before allowing deletion
 * - Confirm dialog in the UI warning about data loss
 */
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participantId = parseInt(req.params.id);
  
  // Delete the participant from the database
  // This will fail if there are foreign key constraints protecting related data
  await knex('participants').where('participantid', participantId).del();
  
  // Redirect back to the participants list
  res.redirect('/participants');
});

// Export the router so it can be mounted in the main app (usually as /participants)
module.exports = router;