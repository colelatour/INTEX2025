const express = require('express');
const router = express.Router();
const data = require('../dummy-data');

// GET participants listing.
router.get('/', function(req, res, next) {
  res.render('participants/index', { participants: data.participants });
});

module.exports = router;
