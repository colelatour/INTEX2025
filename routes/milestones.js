const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET milestones listing.
router.get('/', isAuthenticated, async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const totalMilestones = await knex('milestones').count('milestoneid as count').first();
  const totalPages = Math.ceil(totalMilestones.count / pageSize);

  const milestones = await knex('milestones')
    .select(
      'milestones.milestoneid as id',
      'milestones.milestonetitle as title',
      'milestones.milestonedate as milestoneDate',
      'milestones.participantemail as participantEmail',
      'participants.participantfirstname',
      'participants.participantlastname'
    )
    .join('participants', 'milestones.participantid', '=', 'participants.participantid')
    .limit(pageSize)
    .offset(offset);
  
  res.render('milestones/index', { 
    milestones: milestones, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages
  });
});

// GET route for adding a new milestone
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
  res.render('milestones/add', { user: req.session.user, participants });
});

// POST route for adding a new milestone
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const { participant_id, title, milestoneDate } = req.body; // Removed description
  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    req.session.message = 'Invalid Participant selected.';
    return res.redirect('/milestones/add');
  }

  await knex('milestones').insert({
    participantid: participant.participantid,
    participantemail: participant.participantemail,
    milestonetitle: title,
    milestonedate: milestoneDate
  });
  res.redirect('/milestones');
});

// GET route for editing a milestone
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const milestoneId = parseInt(req.params.id);
  const milestone = await knex('milestones')
    .select(
      'milestones.milestoneid as id',
      'milestones.milestonetitle as title',
      'milestones.milestonedate as milestoneDate',
      'milestones.participantid as participant_id',
      'milestones.participantemail as participantEmail'
    )
    .where('milestoneid', milestoneId)
    .first();

  if (!milestone) {
    return res.redirect('/milestones');
  }

  // Format the date for the date input field
  if (milestone.milestoneDate) {
    milestone.milestoneDate = new Date(milestone.milestoneDate).toISOString().split('T')[0];
  }

  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');

  res.render('milestones/edit', { milestone, user: req.session.user, participants });
});

// POST route for updating a milestone
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const milestoneId = parseInt(req.params.id);
  const { participant_id, title, milestoneDate } = req.body; // Removed description

  const participant = await knex('participants').where('participantid', participant_id).first();

  if (!participant) {
    req.session.message = 'Invalid Participant selected.';
    return res.redirect(`/milestones/edit/${milestoneId}`);
  }

  await knex('milestones')
    .update({
      participantid: participant.participantid,
      participantemail: participant.participantemail,
      milestonetitle: title,
      milestonedate: milestoneDate
    });
  res.redirect('/milestones');
});

// POST route for deleting a milestone
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const milestoneId = parseInt(req.params.id);
  await knex('milestones').where('milestoneid', milestoneId).del();
  res.redirect('/milestones');
});

module.exports = router;
