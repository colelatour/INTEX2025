const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// GET participants listing.
router.get('/', async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const totalParticipants = await knex('participants').count('participantid as count').first();
  const totalPages = Math.ceil(totalParticipants.count / pageSize);

  const participants = await knex('participants').select('*').limit(pageSize).offset(offset);
  
  res.render('participants/index', { 
    participants: participants, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages
  });
});

// GET route for adding a new participant
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('participants/add', { user: req.session.user });
});

// POST route for adding a new participant
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;
  await knex('participants').insert({
    participantfirstname: firstName,
    participantlastname: lastName,
    participantemail: email,
    participantdob: dob,
    participantphone: phone,
    participantcity: city,
    participantstate: state,
    participantzip: zip,
    participantschooloremployer: schoolEmployer,
    participantfieldofinterest: fieldOfInterest,
    totaldonations: parseFloat(totalDonations) || 0.00
  });
  res.redirect('/participants');
});

// GET route for editing a participant
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participantId = parseInt(req.params.id);
  const participant = await knex('participants').where('participantid', participantId).first();
  if (!participant) {
    return res.redirect('/participants');
  }

  // Format the date for the date input field
  if (participant.participantdob) {
    participant.participantdob = new Date(participant.participantdob).toISOString().split('T')[0];
  }

  res.render('participants/edit', { participant, user: req.session.user });
});

// POST route for updating a participant
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participantId = parseInt(req.params.id);
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;

  await knex('participants').where('participantid', participantId).update({
    participantfirstname: firstName,
    participantlastname: lastName,
    participantemail: email,
    participantdob: dob,
    participantphone: phone,
    participantcity: city,
    participantstate: state,
    participantzip: zip,
    participantschooloremployer: schoolEmployer,
    participantfieldofinterest: fieldOfInterest,
    totaldonations: parseFloat(totalDonations) || 0.00
  });
  res.redirect('/participants');
});

// POST route for deleting a participant
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participantId = parseInt(req.params.id);
  await knex('participants').where('participantid', participantId).del();
  res.redirect('/participants');
});

module.exports = router;
