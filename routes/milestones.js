// Core Express dependencies for routing
const express = require('express');
const router = express.Router();

// Database connection via Knex.js - handles all our SQL queries
const knex = require('../db');

// Custom middleware to protect routes and check user permissions
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

/**
 * GET /milestones - Display a paginated list of all milestones
 * 
 * Milestones track important achievements or events for participants
 * (e.g., "Completed Python Course", "First Published Paper", "Graduation").
 * This route requires authentication - all logged-in users can view milestones.
 * 
 * Joins with the participants table to show who achieved each milestone.
 * Supports searching by milestone title or participant name.
 */
router.get('/', isAuthenticated, async function(req, res, next) {
  // Parse pagination parameters from query string, default to page 1
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Show 10 milestones per page
  const offset = (page - 1) * pageSize; // Calculate how many records to skip
  
  // Get the search term from query string, default to empty string if not provided
  const searchTerm = req.query.search || '';

  // Build our database queries
  // Both queries join milestones with participants to get participant names
  let query = knex('milestones').join('participants', 'milestones.participantid', '=', 'participants.participantid');
  let countQuery = knex('milestones').join('participants', 'milestones.participantid', '=', 'participants.participantid');

  // If the user entered a search term, filter the results
  if (searchTerm) {
    // Split the search term by spaces and remove empty strings
    // This allows searching for "Jane Smith" as firstName + lastName
    const searchTerms = searchTerm.split(' ').filter(term => term);
    
    if (searchTerms.length > 1) {
      // Multiple words = assume first name and last name search
      // For example: "John Doe" searches for firstName like "John" AND lastName like "Doe"
      // The 'ilike' operator is PostgreSQL-specific for case-insensitive matching
      query = query.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
      // Apply the same filter to the count query for accurate pagination
      countQuery = countQuery.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
    } else {
      // Single word = search across milestone title, first name, OR last name
      // This is flexible - "graduation" finds milestones titled "graduation",
      // while "Smith" finds all milestones for anyone named Smith
      query = query.where('milestones.milestonetitle', 'ilike', `%${searchTerm}%`)
                   .orWhere('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                   .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`);
      countQuery = countQuery.where('milestones.milestonetitle', 'ilike', `%${searchTerm}%`)
                             .orWhere('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                             .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`);
    }
  }

  // Count total matching milestones to calculate number of pages needed
  const totalMilestones = await countQuery.count('milestoneid as count').first();
  const totalPages = Math.ceil(totalMilestones.count / pageSize);

  // Fetch the actual milestone data for the current page
  // We're selecting specific columns and aliasing them to camelCase for cleaner JavaScript usage
  const milestones = await query
    .select(
      'milestones.milestoneid as id',
      'milestones.milestonetitle as title',
      'milestones.milestonedate as milestoneDate',
      'milestones.participantemail as participantEmail',
      'participants.participantfirstname',                    // Participant's first name
      'participants.participantlastname'                      // Participant's last name
    )
    .limit(pageSize)
    .offset(offset);
  
  // Render the milestones list page with all necessary data
  const message = req.session.message;
  delete req.session.message;
  
  res.render('milestones/index', { 
    milestones: milestones,          // The actual milestone records to display
    user: req.session.user,          // Current logged-in user (for nav/display)
    currentPage: page,               // Which page we're on
    totalPages: totalPages,          // How many pages total (for pagination controls)
    searchTerm: searchTerm,           // Keep the search term in the form
    message
  });
});

/**
 * GET /milestones/add - Display the form to add a new milestone
 * 
 * Only managers can add milestones (protected by middleware).
 * Loads all participants for the dropdown so you can select who achieved the milestone.
 */
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Fetch all participants for the dropdown menu
  // Using PascalCase aliases here (unusual choice - typically camelCase is preferred)
  const participants = await knex('participants').select(
    'participantid as ParticipantID',
    'participantfirstname as ParticipantFirstName',
    'participantlastname as ParticipantLastName',
    'participantemail as ParticipantEmail'
  );
  
  // Render the add form with the participant options
  res.render('milestones/add', { 
    user: req.session.user, 
    participants,
    error: null, // No error on initial load
    formData: {} // Empty form data on initial load
  });
});

/**
 * POST /milestones/add - Handle the submission of the new milestone form
 * 
 * Creates a new milestone record for a participant. We verify the participant
 * exists first to maintain data integrity. The milestone stores a denormalized
 * copy of the participant's email for historical accuracy (even if they change
 * their email later, the milestone remembers what it was at the time).
 */
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Extract form fields - note that description was removed from this form
  const { participant_id, title, milestoneDate } = req.body;
  
  // Verify that the selected participant actually exists in the database
  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    // Re-render the form with an error message and the user's input
    const participants = await knex('participants').select(
      'participantid as ParticipantID',
      'participantfirstname as ParticipantFirstName',
      'participantlastname as ParticipantLastName',
      'participantemail as ParticipantEmail'
    );
    return res.render('milestones/add', {
      user: req.session.user,
      participants,
      error: 'Invalid Participant selected.',
      formData: req.body // Pass the submitted form data back to the view
    });
  }

  // All validation passed - create the milestone
  // We're storing both the participant ID (for the relationship) and their email
  // (denormalized for historical record keeping)
  await knex('milestones').insert({
    participantid: participant.participantid,
    participantemail: participant.participantemail,          // Denormalized data
    milestonetitle: title,
    milestonedate: milestoneDate
  });
  
  // For success, we can use a flash message and redirect
  req.session.message = 'Milestone added successfully!';
  res.redirect('/milestones');
});

/**
 * GET /milestones/edit/:id - Display the form to edit an existing milestone
 * 
 * Loads the milestone's current data and all participants for the dropdown.
 * Formats the date properly for HTML date input fields (YYYY-MM-DD format).
 */
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Parse the milestone ID from the URL parameter
  const milestoneId = parseInt(req.params.id);
  
  // Fetch the milestone from the database with aliased column names
  const milestone = await knex('milestones')
    .select(
      'milestones.milestoneid as id',
      'milestones.milestonetitle as title',
      'milestones.milestonedate as milestoneDate',
      'milestones.participantid as participant_id',
      'milestones.participantemail as participantEmail'
    )
    .where('milestoneid', milestoneId)
    .first();

  // If milestone doesn't exist (maybe deleted by someone else), go back to the list
  if (!milestone) {
    return res.redirect('/milestones');
  }

  // Format the milestone date for HTML date input fields
  // Date inputs require YYYY-MM-DD format, so we convert the database date
  // and extract just the date part (ignoring time and timezone)
  if (milestone.milestoneDate) {
    milestone.milestoneDate = new Date(milestone.milestoneDate).toISOString().split('T')[0];
  }

  // Load all participants for the dropdown menu
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');

  // Render the edit form with the milestone data pre-filled
  res.render('milestones/edit', { 
    milestone,                       // The milestone being edited
    user: req.session.user,          // Current logged-in user (for nav)
    participants                     // All participants for dropdown
  });
});

/**
 * POST /milestones/edit/:id - Handle the submission of the milestone edit form
 * 
 * Updates the milestone. We verify the participant exists and update the
 * denormalized email field to keep everything in sync.
 * 
 * NOTE: There's a potential bug here - the WHERE clause is missing in the update!
 * This will update ALL milestones in the database, not just the one being edited.
 * Should be: .where('milestoneid', milestoneId).update({...})
 */
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const milestoneId = parseInt(req.params.id);
  
  // Extract form fields
  const { participant_id, title, milestoneDate } = req.body;

  // Verify the participant exists
  const participant = await knex('participants').where('participantid', participant_id).first();

  // If participant is invalid, show error and stay on edit page
  if (!participant) {
    req.session.message = 'Invalid Participant selected.';
    return res.redirect(`/milestones/edit/${milestoneId}`);
  }

  // CRITICAL BUG: Missing WHERE clause!
  // This will update ALL milestones to have the same data, overwriting everything
  // Should be: .where('milestoneid', milestoneId).update({...})
  await knex('milestones')
    .update({
      participantid: participant.participantid,
      participantemail: participant.participantemail,        // Update denormalized email
      milestonetitle: title,
      milestonedate: milestoneDate
    });
  
  // Redirect back to the milestones list
  res.redirect('/milestones');
});

/**
 * POST /milestones/delete/:id - Delete a milestone from the system
 * 
 * Permanently removes a milestone record. Only managers can do this.
 * This is a hard delete - the milestone data is gone forever.
 * 
 * Since milestones don't have foreign key relationships to other tables,
 * this should be safe to delete without cascading issues.
 */
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const milestoneId = parseInt(req.params.id);
  
  // Delete the milestone from the database
  await knex('milestones').where('milestoneid', milestoneId).del();
  
  // Redirect back to the milestones list
  res.redirect('/milestones');
});

// Export the router so it can be mounted in the main app (usually as /milestones)
module.exports = router;