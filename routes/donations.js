// This file sets up the routes for managing 'donations' and 'userdonor' data.
// It handles fetching, searching, pagination, and CRUD operations (Create, Read, Update, Delete).

// Load the Express framework to create the router.
const express = require('express');
// Create a new router object, which we'll use to define all our donation-related endpoints.
const router = express.Router();
// Import the Knex instance, which is configured to connect to our database.
const knex = require('../db');
// Import middleware for user authentication (is the user logged in?) and role-based authorization 
// (does the user have the necessary permissions, like 'manager'?).
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); 

// --- GET All Donations and User Donors Route ---
// This route fetches a paginated and searchable list of all system donations 
// and a separate list of manually entered ('user') donors.
// Accessible only if the user is logged in (isAuthenticated).
router.get('/', isAuthenticated, async function(req, res, next) {
  // 1. --- Pagination Setup ---
  // Get the requested page number from the query string (e.g., /donations?page=3). Default to page 1.
  const page = parseInt(req.query.page) || 1;
  // Define how many records we want per page.
  const pageSize = 10;
  // Calculate the offset (how many records to skip) based on the page number.
  const offset = (page - 1) * pageSize;
  // Get the general search term for 'donations' from the query string. Default to an empty string.
  const searchTerm = req.query.search || '';

  // 2. --- Initial Knex Queries for Donations ---
  // Start the main query for fetching the donation records. We join 'donations' with 'participants'
  // to get the donor's name and details alongside the donation amount.
  let query = knex('donations').join('participants', 'donations.participantid', '=', 'participants.participantid');
  // Start a separate query just for counting the total number of records that match the filter.
  // This is needed for pagination to calculate the total number of pages.
  let countQuery = knex('donations').join('participants', 'donations.participantid', '=', 'participants.participantid');

  // 3. --- Apply Search Filters for Donations ---
  if (searchTerm) {
    // If a search term is provided, we need to apply filters.
    const searchTerms = searchTerm.split(' ').filter(term => term);
    
    if (searchTerms.length > 1) {
      // If the user entered two words, assume they are searching for a full name (First Name + Last Name).
      // We wrap the AND condition in a function to ensure it's grouped correctly in the WHERE clause.
      query = query.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
      // Apply the same filter to the count query.
      countQuery = countQuery.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
    } else {
      // If only one word is entered, search for it in First Name, Last Name, or the Donation Date.
      // `orWhereRaw` is used for the date search because we need to explicitly cast the date field to text 
      // for a proper string match (ILIKE) in PostgreSQL.
      query = query.where('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                   .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`)
                   .orWhereRaw(`CAST(donations.donationdate AS TEXT) ILIKE ?`, [`%${searchTerm}%`]);
      // Apply the same broad filter to the count query.
      countQuery = countQuery.where('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                             .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`)
                             .orWhereRaw(`CAST(donations.donationdate AS TEXT) ILIKE ?`, [`%${searchTerm}%`]);
    }
  }

  // 4. --- Execute Donation Queries ---
  // Get the total number of filtered donations. This is an asynchronous operation.
  const totalDonations = await countQuery.count('donationid as count').first();
  // Calculate the total number of pages needed for the UI.
  const totalPages = Math.ceil(totalDonations.count / pageSize);

  // Execute the main donation query, applying the selected columns, limit, and offset for pagination.
  const donations = await query
    .select(
      'donations.donationid as id',
      'donations.donationamount as amount',
      'donations.donationdate as donationDate',
      'donations.participantemail as participantEmail',
      'participants.participantfirstname',
      'participants.participantlastname'
    )
    .limit(pageSize) // Limit to the number of items per page.
    .offset(offset); // Skip the records for previous pages.
  
  // Get the search term specifically for the separate 'userdonor' list.
  const userDonorSearchTerm = req.query.userDonorSearch || '';

  // 5. --- Fetch User Donor Data ---
  let userDonors = [];
  try {
    // Start the raw SQL query to select all manually entered donors.
    let userDonorQuery = knex.raw('SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor');

    if (userDonorSearchTerm) {
      // If a search term is provided for user donors, modify the raw query to include a filter 
      // on first name OR last name (case-insensitive ILIKE).
      userDonorQuery = knex.raw(
        'SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor WHERE userdonorfirstname ILIKE ? OR userdonorlastname ILIKE ?',
        [`%${userDonorSearchTerm}%`, `%${userDonorSearchTerm}%`]
      );
    }
    
    // Execute the raw query. Knex.raw, especially with PostgreSQL, returns an object with a 'rows' array.
    userDonors = await userDonorQuery;
    userDonors = userDonors.rows; // Extract the actual array of results.
    console.log('Fetched userDonors data:', userDonors);
  } catch (err) {
    // Handle any error during the fetching of user donors gracefully.
    console.error('Error fetching userDonors:', err);
    // Ensure `userDonors` is an empty array so the template doesn't crash.
    userDonors = [];
  }
  console.log('Rendering donations/index with userDonors:', userDonors);

  const message = req.session.message;
  delete req.session.message;
  
  // 6. --- Render the View ---
  // Render the 'donations/index' view, passing all the fetched data and pagination variables.
  res.render('donations/index', {
    donations: donations, // The list of filtered and paginated system donations.
    user: req.session.user, // User session data for display/auth checks in the view.
    currentPage: page, // The current page number.
    totalPages: totalPages, // The total number of pages available.
    searchTerm: searchTerm, // The general donation search term for persistence in the search box.
    userDonors: userDonors, // The list of manually entered user donors.
    userDonorSearchTerm: userDonorSearchTerm, // The user donor search term for persistence.
    message
  });
});
  
// --- GET Route for Editing a User Donor ---
// This route fetches a single user donor's data to populate an edit form.
// Requires authentication and the user must have the 'manager' role.
router.get('/userdonor/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
  // Get the ID of the user donor to be edited from the URL parameters.
  const userDonorId = parseInt(req.params.id);
  
  try {
    // Fetch the specific user donor from the database using raw SQL.
    const userDonor = await knex.raw('SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor WHERE userdonorid = ?', [userDonorId]);
  
    if (!userDonor.rows || userDonor.rows.length === 0) {
      // If no donor is found with that ID, set an error message and redirect.
      req.session.message = 'User Donor not found.';
      return res.redirect('/donations');
    }
  
    const donor = userDonor.rows[0];
  
    
    // Format the date: database dates often include a time component. 
    // We convert it to 'YYYY-MM-DD' format (ISO string part before 'T') so it works correctly 
    // in an HTML `<input type="date">` field.
    if (donor.userdonordate) {
        donor.userdonordate = new Date(donor.userdonordate).toISOString().split('T')[0];
    }
  
    // Render the edit form, passing the user session and the specific donor data.
    res.render('donations/userdonor/edit', { user: req.session.user, userDonor: donor });
  
  } catch (error) {
    // Log the error and set a user-friendly message before redirecting back.
    console.error('Error fetching user donor for edit:', error);
    req.session.message = 'Error fetching user donor for edit: ' + error.message;
    res.redirect('/donations');
  }
});
  
// --- POST Route for Updating a User Donor ---
// This route handles the form submission to update a user donor's details.
// Requires authentication and the 'manager' role.
router.post('/userdonor/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
  // Get the ID from the URL.
  const userDonorId = parseInt(req.params.id);
  // Destructure the updated fields from the submitted form data (`req.body`).
  const { userdonorfirstname, userdonorlastname, userdonoramount, userdonordate } = req.body;
  
  try {
    // Execute the raw SQL UPDATE statement with the new data.
    // We use raw SQL again for direct control and ensure the amount is a valid number (defaulting to 0.00).
    await knex.raw('UPDATE userdonor SET userdonorfirstname = ?, userdonorlastname = ?, userdonoramount = ?, userdonordate = ? WHERE userdonorid = ?', 
      [userdonorfirstname, userdonorlastname, parseFloat(userdonoramount) || 0.00, userdonordate, userDonorId]);
  
    // Set a success message and redirect to the main donations list.
    req.session.message = 'User Donor updated successfully!';
    res.redirect('/donations');
  
  } catch (error) {
    // Handle the update error, set an error message, and redirect back to the edit page 
    // to allow the user to try again without losing context.
    console.error('Error updating user donor:', error);
    req.session.message = 'Error updating user donor: ' + error.message;
    res.redirect(`/donations/userdonor/edit/${userDonorId}`);
  }
});
  
// --- POST Route for Deleting a User Donor ---
// This route handles the deletion of a user donor record.
// Requires authentication and the 'manager' role.
router.post('/userdonor/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
  // Get the ID from the URL.
  const userDonorId = parseInt(req.params.id);
  
  try {
    // Execute the raw SQL DELETE statement.
    await knex.raw('DELETE FROM userdonor WHERE userdonorid = ?', [userDonorId]);
  
    // Set a success message and redirect to the main donations list.
    req.session.message = 'User Donor deleted successfully!';
    res.redirect('/donations');
  
  } catch (error) {
    // Handle the deletion error and redirect back to the main list with an error message.
    console.error('Error deleting user donor:', error);
    req.session.message = 'Error deleting user donor: ' + error.message;
    res.redirect('/donations');
  }
});
  
// --- GET Route for Adding a New Donation ---
// This route serves the form to create a new donation.
// Requires authentication and the 'manager' role.
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Fetch all existing participants to populate a dropdown in the form, allowing the user to select the donor.
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
  
  // Render the add donation form.
  res.render('donations/add', { 
    user: req.session.user, 
    participants,
    error: null, // No error on initial load
    formData: {} // Empty form data on initial load
  });
});

// --- POST Route for Adding a New Donation ---
// This route processes the form submission to insert a new donation record.
// Requires authentication and the 'manager' role.
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Destructure form data: selected participant ID, amount, and date.
  const { participant_id, amount, donation_date } = req.body;

  try {
    // Validate that the amount is greater than 0
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
      return res.render('donations/add', {
        user: req.session.user,
        participants,
        error: 'Donation amount must be greater than $0.',
        formData: req.body
      });
    }

    // Look up the selected participant to ensure they exist and to get their details.
    const participant = await knex('participants').where('participantid', participant_id).first();

    if (!participant) {
      // If the selected participant doesn't exist, re-render the form with an error.
      const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
      return res.render('donations/add', {
        user: req.session.user,
        participants,
        error: 'Invalid Participant selected.',
        formData: req.body
      });
    }

    // Insert the new donation into the 'donations' table.
    await knex('donations').insert({
      participantid: participant.participantid,
      participantemail: participant.participantemail, // Store the participant's email with the donation.
      donationamount: donationAmount,
      donationdate: donation_date
    });

    // Set a success message and redirect to the main donations list.
    req.session.message = 'Donation added successfully!';
    res.redirect('/donations');
  } catch (error) {
    // Handle any other errors during the process.
    console.error('Error adding donation:', error);
    const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
    res.render('donations/add', {
      user: req.session.user,
      participants,
      error: 'Error adding donation. Please check your input and try again.',
      formData: req.body
    });
  }
});

// --- GET Route for Editing a Donation ---
// This route fetches a single donation's data to populate the edit form.
// Requires authentication and the 'manager' role.
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Get the donation ID from the URL.
  const donationId = parseInt(req.params.id);
  // Fetch the specific donation details.
  const donation = await knex('donations')
    .select(
      'donations.donationid as id',
      'donations.donationamount as amount',
      'donations.donationdate as donationDate',
      'donations.participantid as participant_id', // Select the participant ID for the dropdown selection.
      'donations.participantemail as participantEmail'
    )
    .where('donationid', donationId)
    .first();

  if (!donation) {
    // If the donation doesn't exist, redirect to the main list.
    return res.redirect('/donations');
  }

  // Format the date for the HTML date input field (YYYY-MM-DD).
  if (donation.donationDate) {
    donation.donationDate = new Date(donation.donationDate).toISOString().split('T')[0];
  }

  // Fetch all participants to populate the selection dropdown (in case the donor needs to be changed).
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');

  // Render the edit form.
  res.render('donations/edit', { donation, user: req.session.user, participants });
});

// --- POST Route for Updating a Donation ---
// This route handles the form submission to update an existing donation record.
// Requires authentication and the 'manager' role.
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Get the donation ID from the URL.
  const donationId = parseInt(req.params.id);
  // Destructure updated data from the form.
  const { participant_id, amount, donation_date } = req.body;

  // Validate that the amount is greater than 0
  const donationAmount = parseFloat(amount);
  if (isNaN(donationAmount) || donationAmount <= 0) {
    req.session.message = 'Donation amount must be greater than $0.';
    return res.redirect(`/donations/edit/${donationId}`);
  }

  // Look up the selected participant again to ensure validity and get their current email.
  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    // Validation check.
    req.session.message = 'Invalid Participant selected.';
    return res.redirect(`/donations/edit/${donationId}`);
  }

  // Update the donation record in the database.
  await knex('donations')
    .where('donationid', donationId)
    .update({
      participantid: participant.participantid,
      participantemail: participant.participantemail,
      donationamount: donationAmount,
      donationdate: donation_date
    });
  // Redirect to the main donations list upon success.
  res.redirect('/donations');
});

// --- POST Route for Deleting a Donation ---
// This route handles the deletion of a donation record.
// Requires authentication and the 'manager' role.
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Get the donation ID from the URL.
  const donationId = parseInt(req.params.id);
  // Delete the donation record.
  await knex('donations').where('donationid', donationId).del();
  // Redirect to the main donations list.
  res.redirect('/donations');
});

// Export the router so it can be used by the main Express application.
module.exports = router;