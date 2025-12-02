const express = require('express');
const router = express.Router();
const data = require('../dummy-data');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// GET surveys listing.
router.get('/', function(req, res, next) {
  res.render('surveys/index', { surveys: data.surveys, user: req.session.user });
});

// GET route for adding a new survey
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('surveys/add', {
    user: req.session.user,
    participants: data.participants,
    events: data.events
  });
});

// POST route for adding a new survey
router.post('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const {
    participant_id, event_id, title, description,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  const newId = data.surveys.length > 0 ? Math.max(...data.surveys.map(s => s.id)) + 1 : 1;
  const participant = data.participants.find(p => p.id == participant_id);
  const event = event_id ? data.events.find(e => e.id == event_id) : null;

  const newSurvey = {
    id: newId,
    participant_id: parseInt(participant_id),
    participantEmail: participant ? participant.email : '',
    event_id: event ? parseInt(event_id) : null,
    eventName: event ? event.name : '',
    eventDate: event ? event.date : '',
    eventTimeStart: event ? event.timeStart : '',
    title,
    description,
    satisfactionScore: parseInt(satisfactionScore) || 0,
    usefulnessScore: parseInt(usefulnessScore) || 0,
    instructorScore: parseInt(instructorScore) || 0,
    recommendationScore: parseInt(recommendationScore) || 0,
    overallScore: parseFloat(overallScore) || 0.0,
    npsBucket,
    comments,
    submissionDate,
    submissionTime
  };
  data.surveys.push(newSurvey);
  res.redirect('/surveys');
});

// GET route for editing a survey
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const surveyId = parseInt(req.params.id);
  const survey = data.surveys.find(s => s.id === surveyId);
  if (!survey) {
    return res.redirect('/surveys');
  }
  res.render('surveys/edit', {
    survey,
    user: req.session.user,
    participants: data.participants,
    events: data.events
  });
});

// POST route for updating a survey
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const surveyId = parseInt(req.params.id);
  const {
    participant_id, event_id, title, description,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  const surveyIndex = data.surveys.findIndex(s => s.id === surveyId);
  const participant = data.participants.find(p => p.id == participant_id);
  const event = event_id ? data.events.find(e => e.id == event_id) : null;

  if (surveyIndex !== -1) {
    data.surveys[surveyIndex] = {
      ...data.surveys[surveyIndex],
      participant_id: parseInt(participant_id),
      participantEmail: participant ? participant.email : '',
      event_id: event ? parseInt(event_id) : null,
      eventName: event ? event.name : '',
      eventDate: event ? event.date : '',
      eventTimeStart: event ? event.timeStart : '',
      title,
      description,
      satisfactionScore: parseInt(satisfactionScore) || 0,
      usefulnessScore: parseInt(usefulnessScore) || 0,
      instructorScore: parseInt(instructorScore) || 0,
      recommendationScore: parseInt(recommendationScore) || 0,
      overallScore: parseFloat(overallScore) || 0.0,
      npsBucket,
      comments,
      submissionDate,
      submissionTime
    };
  }
  res.redirect('/surveys');
});

// POST route for deleting a survey
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const surveyId = parseInt(req.params.id);
  data.surveys = data.surveys.filter(s => s.id !== surveyId);
  res.redirect('/surveys');
});

module.exports = router;
