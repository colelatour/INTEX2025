const express = require('express');
const router = express.Router();
const data = require('../dummy-data');

// GET events listing.
router.get('/', function(req, res, next) {
  res.render('events/index', { events: data.events });
});

module.exports = router;
