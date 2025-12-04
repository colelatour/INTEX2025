// Core Express dependencies for routing
const express = require('express');
const router = express.Router();

// Database connection via Knex.js - handles all our SQL queries
const knex = require('../db');

// bcrypt for secure password hashing - never store plain text passwords!
const bcrypt = require('bcrypt');

// Custom middleware to protect routes and check user permissions
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

/**
 * GET /users - Display a paginated list of all users
 * 
 * This is the main users listing page with search functionality.
 * Only managers can access this route (protected by middleware).
 * Supports pagination and searching by first name, last name, or email.
 */
router.get('/', isAuthenticated, authorizeRoles(['manager']), async function(req, res, next) {
  // Parse pagination parameters from query string, default to page 1
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10; // Show 10 users per page
  const offset = (page - 1) * pageSize; // Calculate how many records to skip
  
  // Get the search term from query string, default to empty string if not provided
  const searchTerm = req.query.search || '';

  // Start building our database queries
  // We need two queries: one for the actual data, one for counting total results
  let query = knex('users');
  let countQuery = knex('users');

  // If the user entered a search term, filter the results
  if (searchTerm) {
    // Split the search term by spaces and remove empty strings
    // This lets us search for "John Doe" as firstName + lastName
    const searchTerms = searchTerm.split(' ').filter(term => term);
    
    if (searchTerms.length > 1) {
      // Multiple words = assume first name and last name search
      // For example: "John Doe" searches for firstName like "John" AND lastName like "Doe"
      query = query.where(function() {
        this.where('userfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('userlastname', 'ilike', `%${searchTerms[1]}%`);
      });
      // Apply the same filter to the count query for accurate pagination
      countQuery = countQuery.where(function() {
        this.where('userfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('userlastname', 'ilike', `%${searchTerms[1]}%`);
      });
    } else {
      // Single word = search across first name, last name, OR email
      // The 'ilike' operator makes it case-insensitive (PostgreSQL specific)
      // The % wildcards mean "match anywhere in the string"
      query = query.where('userfirstname', 'ilike', `%${searchTerm}%`)
                   .orWhere('userlastname', 'ilike', `%${searchTerm}%`)
                   .orWhere('useremail', 'ilike', `%${searchTerm}%`);
      countQuery = countQuery.where('userfirstname', 'ilike', `%${searchTerm}%`)
                             .orWhere('userlastname', 'ilike', `%${searchTerm}%`)
                             .orWhere('useremail', 'ilike', `%${searchTerm}%`);
    }
  }

  // Count total matching users for pagination calculation
  const totalUsers = await countQuery.count('userid as count').first();
  const totalPages = Math.ceil(totalUsers.count / pageSize);

  // Fetch the actual user data for the current page
  const users = await query.select('*').limit(pageSize).offset(offset);
  
  // Render the users list page with all the data it needs
  res.render('users/index', { 
    users: users,                    // The actual user records to display
    user: req.session.user,          // Current logged-in user (for nav/display)
    currentPage: page,               // Which page we're on
    totalPages: totalPages,          // How many pages total (for pagination controls)
    searchTerm: searchTerm           // Keep the search term in the form
  });
});

/**
 * GET /users/add - Display the form to add a new user
 * 
 * Only managers can access this. Shows a blank form for creating a new user account.
 */
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('users/add', { user: req.session.user });
});

/**
 * POST /users/add - Handle the submission of the new user form
 * 
 * Takes the form data, hashes the password, and creates a new user in the database.
 * Always hash passwords before storing them - never store plain text!
 */
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Extract all the form fields from the request body
  const { firstName, lastName, email, password, role } = req.body;
  
  // Hash the password with bcrypt using a salt round of 10
  // This is a one-way hash - we can verify passwords but can't decrypt them
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert the new user into the database
  // Note: Using the exact column names from our database schema
  await knex('users').insert({
    userfirstname: firstName,
    userlastname: lastName,
    useremail: email,
    password: hashedPassword,  // Store the hashed version, not the original
    userrole: role
  });
  
  // After successful creation, redirect back to the users list
  res.redirect('/users');
});

/**
 * GET /users/edit/:id - Display the form to edit an existing user
 * 
 * Loads the user's current data and shows it in an edit form.
 * If the user doesn't exist, just redirect back to the list.
 */
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  // Parse the user ID from the URL parameter
  const userId = parseInt(req.params.id);
  
  // Fetch the user from the database
  const targetUser = await knex('users').where('userid', userId).first();
  
  // If user doesn't exist (maybe deleted by someone else), go back to the list
  if (!targetUser) {
    return res.redirect('/users');
  }
  
  // Render the edit form with the user's current data pre-filled
  res.render('users/edit', { 
    targetUser: targetUser,      // The user being edited
    user: req.session.user       // Current logged-in user (for nav)
  });
});

/**
 * POST /users/edit/:id - Handle the submission of the user edit form
 * 
 * Updates the user's information. If a new password is provided, it gets hashed.
 * If the password field is empty, we keep the existing password.
 */
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, email, password, role } = req.body;

  // Build the update object with all the fields we always want to update
  const updateData = {
    userfirstname: firstName,
    userlastname: lastName,
    useremail: email,
    userrole: role
  };

  // Only update the password if a new one was provided
  // This way, leaving the password field blank keeps the existing password
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Apply the updates to the database
  await knex('users').where('userid', userId).update(updateData);
  
  // Redirect back to the users list to see the updated info
  res.redirect('/users');
});

/**
 * POST /users/delete/:id - Delete a user from the system
 * 
 * Permanently removes a user. Includes a safety check to prevent managers
 * from accidentally deleting their own account (which would lock them out).
 */
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Safety check: Don't let a manager delete their own account
  // This prevents accidental lockouts where you delete yourself and can't log back in
  if (req.session.user && req.session.user.id === userId) {
    req.session.message = 'You cannot delete your own account.';
    return res.redirect('/users');
  }
  
  // Delete the user from the database
  // Note: In production, you might want to soft-delete (mark as inactive) instead
  // of permanently removing the record, especially if they have related data
  await knex('users').where('userid', userId).del();
  
  // Go back to the users list
  res.redirect('/users');
});

// Export the router so it can be mounted in the main app (usually as /users)
module.exports = router;