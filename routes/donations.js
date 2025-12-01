const express = require('express');
const router = express.Router();
const data = require('../dummy-data');

// GET donations listing.
router.get('/', function(req, res, next) {
  res.render('donations/index', { donations: data.donations });
});

module.exports = router;
