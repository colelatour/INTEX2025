const express = require('express');
const router = express.Router();
const data = require('../dummy-data');

// GET surveys listing.
router.get('/', function(req, res, next) {
  res.render('surveys/index', { surveys: data.surveys });
});

module.exports = router;
