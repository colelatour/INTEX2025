const express = require('express');
const router = express.Router();
const data = require('../dummy-data');

// GET milestones listing.
router.get('/', function(req, res, next) {
  res.render('milestones/index', { milestones: data.milestones });
});

module.exports = router;
