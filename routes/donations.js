const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET donations listing.
router.get('/', isAuthenticated, async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const totalDonations = await knex('donations').count('donationid as count').first();
  const totalPages = Math.ceil(totalDonations.count / pageSize);

  const donations = await knex('donations')
    .select(
      'donations.donationid as id',
      'donations.donationamount as amount',
      'donations.donationdate as donationDate',
      'donations.participantemail as participantEmail',
      'participants.participantfirstname',
      'participants.participantlastname'
    )
    .join('participants', 'donations.participantid', '=', 'participants.participantid')
    .limit(pageSize)
    .offset(offset);
  
  res.render('donations/index', { 
    donations: donations, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages
  });
});

// GET route for adding a new donation
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
  res.render('donations/add', { user: req.session.user, participants });
});

// POST route for adding a new donation
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { participant_id, amount, donation_date } = req.body;
  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    req.session.message = 'Invalid Participant selected.';
    return res.redirect('/donations/add');
  }

  await knex('donations').insert({
    participantid: participant.participantid,
    participantemail: participant.participantemail,
    donationamount: parseFloat(amount) || 0.00,
    donationdate: donation_date
  });
  res.redirect('/donations');
});

// GET route for editing a donation
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const donationId = parseInt(req.params.id);
  const donation = await knex('donations')
    .select(
      'donations.donationid as id',
      'donations.donationamount as amount',
      'donations.donationdate as donationDate',
      'donations.participantid as participant_id',
      'donations.participantemail as participantEmail'
    )
    .where('donationid', donationId)
    .first();

  if (!donation) {
    return res.redirect('/donations');
  }

  // Format the date for the date input field
  if (donation.donationDate) {
    donation.donationDate = new Date(donation.donationDate).toISOString().split('T')[0];
  }

  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');

  res.render('donations/edit', { donation, user: req.session.user, participants });
});

// POST route for updating a donation
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const donationId = parseInt(req.params.id);
  const { participant_id, amount, donation_date } = req.body;

  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    req.session.message = 'Invalid Participant selected.';
    return res.redirect(`/donations/edit/${donationId}`);
  }

  await knex('donations')
    .where('donationid', donationId)
    .update({
      participantid: participant.participantid,
      participantemail: participant.participantemail,
      donationamount: parseFloat(amount) || 0.00,
      donationdate: donation_date
    });
  res.redirect('/donations');
});

// POST route for deleting a donation
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const donationId = parseInt(req.params.id);
  await knex('donations').where('donationid', donationId).del();
  res.redirect('/donations');
});

module.exports = router;
