const express = require('express');
const router = express.Router();
const data = require('../dummy-data');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET donations listing.
router.get('/', function(req, res, next) {
  res.render('donations/index', { donations: data.donations, user: req.session.user });
});

// GET route for adding a new donation
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('donations/add', { user: req.session.user });
});

// POST route for adding a new donation
router.post('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const { donor_name, amount, donation_date } = req.body;
  const newId = data.donations.length > 0 ? Math.max(...data.donations.map(d => d.id)) + 1 : 1;
  const newDonation = {
    id: newId,
    donor_name,
    amount: parseFloat(amount) || 0.00,
    donation_date
  };
  data.donations.push(newDonation);
  res.redirect('/donations');
});

// GET route for editing a donation
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const donationId = parseInt(req.params.id);
  const donation = data.donations.find(d => d.id === donationId);
  if (!donation) {
    return res.redirect('/donations');
  }
  res.render('donations/edit', { donation, user: req.session.user });
});

// POST route for updating a donation
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const donationId = parseInt(req.params.id);
  const { donor_name, amount, donation_date } = req.body;
  const donationIndex = data.donations.findIndex(d => d.id === donationId);

  if (donationIndex !== -1) {
    data.donations[donationIndex] = {
      ...data.donations[donationIndex],
      donor_name,
      amount: parseFloat(amount) || 0.00,
      donation_date
    };
  }
  res.redirect('/donations');
});

// POST route for deleting a donation
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const donationId = parseInt(req.params.id);
  data.donations = data.donations.filter(d => d.id !== donationId);
  res.redirect('/donations');
});

module.exports = router;
