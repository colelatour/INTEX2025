const express = require('express');
const router = express.Router();
const data = require('../dummy-data');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// GET participants listing.
router.get('/', function(req, res, next) {
  res.render('participants/index', { participants: data.participants, user: req.session.user });
});

// GET route for adding a new participant
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('participants/add', { user: req.session.user });
});

// POST route for adding a new participant
router.post('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;
  const newId = data.participants.length > 0 ? Math.max(...data.participants.map(p => p.id)) + 1 : 1;
  const newParticipant = {
    id: newId,
    firstName,
    lastName,
    email,
    dob,
    phone,
    city,
    state,
    zip,
    schoolEmployer,
    fieldOfInterest,
    totalDonations: parseFloat(totalDonations) || 0.00
  };
  data.participants.push(newParticipant);
  res.redirect('/participants');
});

// GET route for editing a participant
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const participantId = parseInt(req.params.id);
  const participant = data.participants.find(p => p.id === participantId);
  if (!participant) {
    return res.redirect('/participants');
  }
  res.render('participants/edit', { participant, user: req.session.user });
});

// POST route for updating a participant
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const participantId = parseInt(req.params.id);
  const { firstName, lastName, email, dob, phone, city, state, zip, schoolEmployer, fieldOfInterest, totalDonations } = req.body;
  const participantIndex = data.participants.findIndex(p => p.id === participantId);

  if (participantIndex !== -1) {
    data.participants[participantIndex] = {
      ...data.participants[participantIndex],
      firstName,
      lastName,
      email,
      dob,
      phone,
      city,
      state,
      zip,
      schoolEmployer,
      fieldOfInterest,
      totalDonations: parseFloat(totalDonations) || 0.00
    };
  }
  res.redirect('/participants');
});

// POST route for deleting a participant
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const participantId = parseInt(req.params.id);
  data.participants = data.participants.filter(p => p.id !== participantId);
  res.redirect('/participants');
});

module.exports = router;
