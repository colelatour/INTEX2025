const express = require('express');
const router = express.Router();
const dummyData = require('../dummy-data'); // Require dummy data
const bcrypt = require('bcrypt'); // Require bcrypt for password hashing
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Require auth middleware

// GET users listing.
router.get('/', isAuthenticated, authorizeRoles(['manager']), function(req, res, next) {
  const users = dummyData.users; // Use dummyData.users
  res.render('users/index', { users: users, user: req.session.user });
});

// GET route for adding a new user
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('users/add', { user: req.session.user });
});

// POST route for adding a new user
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const newId = dummyData.users.length > 0 ? Math.max(...dummyData.users.map(u => u.id)) + 1 : 1;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: newId,
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role
  };
  dummyData.users.push(newUser);
  res.redirect('/users');
});

// GET route for editing a user
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const userId = parseInt(req.params.id);
  const targetUser = dummyData.users.find(u => u.id === userId); // Renamed to targetUser
  if (!targetUser) {
    return res.redirect('/users');
  }
  res.render('users/edit', { targetUser: targetUser, user: req.session.user }); // Pass targetUser
});

// POST route for updating a user
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { firstName, lastName, email, password, role } = req.body;
  const userIndex = dummyData.users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    let hashedPassword = dummyData.users[userIndex].password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    dummyData.users[userIndex] = {
      ...dummyData.users[userIndex],
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role
    };
  }
  res.redirect('/users');
});

// POST route for deleting a user
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const userId = parseInt(req.params.id);
  // Prevent a manager from deleting their own account
  if (req.session.user && req.session.user.id === userId) {
    req.session.message = 'You cannot delete your own account.';
    return res.redirect('/users');
  }
  dummyData.users = dummyData.users.filter(u => u.id !== userId);
  res.redirect('/users');
});

module.exports = router;
