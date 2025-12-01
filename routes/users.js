const express = require('express');
const router = express.Router();

// GET users listing.
router.get('/', function(req, res, next) {
  // TODO: Fetch users from database
  const users = [
    { id: 1, username: 'admin', email: 'admin@ellarises.org', role: 'Admin' },
    { id: 2, username: 'manager', email: 'manager@ellarises.org', role: 'Manager' },
    { id: 3, username: 'user1', email: 'user1@ellarises.org', role: 'User' }
  ];
  res.render('users/index', { users: users });
});

module.exports = router;
