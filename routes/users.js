const express = require('express');
const router = express.Router();
const knex = require('../db');
const bcrypt = require('bcrypt'); // Require bcrypt for password hashing
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Require auth middleware

// GET users listing.
router.get('/', isAuthenticated, authorizeRoles(['manager']), async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const totalUsers = await knex('users').count('userid as count').first();
  const totalPages = Math.ceil(totalUsers.count / pageSize);

  const users = await knex('users').select('*').limit(pageSize).offset(offset);
  
  res.render('users/index', { 
    users: users, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages
  });
});

// GET route for adding a new user
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('users/add', { user: req.session.user });
});

// POST route for adding a new user
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await knex('users').insert({
    userfirstname: firstName,
    userlastname: lastName,
    useremail: email,
    password: hashedPassword,
    userrole: role
  });
  res.redirect('/users');
});

// GET route for editing a user
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const targetUser = await knex('users').where('userid', userId).first();
  if (!targetUser) {
    return res.redirect('/users');
  }
  res.render('users/edit', { targetUser: targetUser, user: req.session.user });
});

// POST route for updating a user
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, email, password, role } = req.body;

  const updateData = {
    userfirstname: firstName,
    userlastname: lastName,
    useremail: email,
    userrole: role
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await knex('users').where('userid', userId).update(updateData);
  res.redirect('/users');
});

// POST route for deleting a user
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  // Prevent a manager from deleting their own account
  if (req.session.user && req.session.user.id === userId) {
    req.session.message = 'You cannot delete your own account.';
    return res.redirect('/users');
  }
  await knex('users').where('userid', userId).del();
  res.redirect('/users');
});

module.exports = router;
