const express = require('express');
const router = express.Router();
const dummyData = require('../dummy-data'); // Require dummy data

// GET users listing.
router.get('/', function(req, res, next) {
  // TODO: Fetch users from database (currently using dummyData)
  const users = dummyData.users; // Use dummyData.users
  console.log('Users data being sent to users/index.ejs:', users); // Debug log
  res.render('users/index', { users: users });
});

module.exports = router;
