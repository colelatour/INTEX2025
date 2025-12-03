const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// GET surveys listing.
router.get('/', async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const searchTerm = req.query.search || '';

  let query = knex('surveys').join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid');
  let countQuery = knex('surveys');

  if (searchTerm) {
    query = query.where('surveys.participantemail', 'ilike', `%${searchTerm}%`)
                 .orWhere('surveys.eventname', 'ilike', `%${searchTerm}%`);
    countQuery = countQuery.where('participantemail', 'ilike', `%${searchTerm}%`)
                           .orWhere('eventname', 'ilike', `%${searchTerm}%`);
  }

  const totalSurveys = await countQuery.count('surveyid as count').first();
  const totalPages = Math.ceil(totalSurveys.count / pageSize);

  const surveys = await query
    .select(
      'surveys.surveyid as id',
      'surveys.participantemail as participantEmail',
      'surveys.eventname as eventName',
      'surveys.eventdate as eventDate',
      'surveys.eventtimestart as eventTimeStart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .limit(pageSize)
    .offset(offset);
  
  res.render('surveys/index', { 
    surveys: surveys, 
    user: req.session.user,
    currentPage: page,
    totalPages: totalPages,
    searchTerm: searchTerm
  });
});

// GET route for viewing a single survey
router.get('/view/:id', isAuthenticated, async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const survey = await knex('surveys')
    .select(
      'surveys.surveyid as id',
      'surveys.registrationid',
      'surveys.participantemail',
      'surveys.eventname',
      'surveys.eventdate',
      'surveys.eventtimestart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid')
    .where('surveys.surveyid', surveyId)
    .first();

  if (!survey) {
    return res.redirect('/surveys'); // Or render an error page
  }

  if (survey.submissionDate) {
    survey.submissionDate = new Date(survey.submissionDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  }

  res.render('surveys/view', {
    survey,
    user: req.session.user
  });
});

// GET route for adding a new survey
router.get('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const participants = await knex('participants').select(
    'participantid as id',
    'participantfirstname as firstName',
    'participantlastname as lastName',
    'participantemail as email'
  );
  const events = await knex('eventoccurrences').select(
    'eventoccurrenceid as id',
    'eventname as name',
    'eventdate as date',
    'eventtimestart as timeStart'
  );
  res.render('surveys/add', {
    user: req.session.user,
    participants: participants,
    events: events
  });
});

// POST route for adding a new survey
router.post('/add', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const {
    participant_id, event_id,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  const participant = await knex('participants').where('participantid', participant_id).first();
  const eventOccurrence = await knex('eventoccurrences').where('eventoccurrenceid', event_id).first();

  if (!participant || !eventOccurrence) {
    req.session.message = 'Invalid Participant or Event selected.';
    return res.redirect('/surveys/add');
  }

  const registration = await knex('registrations')
    .where({
      participantid: participant_id,
      eventoccurrenceid: event_id,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart
    })
    .first();

  if (!registration) {
    req.session.message = 'No matching registration found for the selected participant and event.';
    return res.redirect('/surveys/add');
  }

  await knex('surveys').insert({
    registrationid: registration.registrationid,
    participantemail: participant.participantemail,
    eventname: eventOccurrence.eventname,
    eventdate: eventOccurrence.eventdate,
    eventtimestart: eventOccurrence.eventtimestart,
    surveysatisfactionscore: parseInt(satisfactionScore) || null,
    surveyusefulnessscore: parseInt(usefulnessScore) || null,
    surveyinstructorscore: parseInt(instructorScore) || null,
    surveyrecommendationscore: parseInt(recommendationScore) || null,
    surveyoverallscore: parseFloat(overallScore) || null,
    surveynpsbucket: npsBucket,
    surveycomments: comments,
    surveysubmissiondate: submissionDate,
    surveysubmissiontime: submissionTime
  });
  res.redirect('/surveys');
});

// GET route for editing a survey
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const survey = await knex('surveys')
    .select(
      'surveys.surveyid as id',
      'surveys.registrationid',
      'surveys.participantemail',
      'surveys.eventname',
      'surveys.eventdate',
      'surveys.eventtimestart',
      'surveys.surveysatisfactionscore as satisfactionScore',
      'surveys.surveyusefulnessscore as usefulnessScore',
      'surveys.surveyinstructorscore as instructorScore',
      'surveys.surveyrecommendationscore as recommendationScore',
      'surveys.surveyoverallscore as overallScore',
      'surveys.surveynpsbucket as npsBucket',
      'surveys.surveycomments as comments',
      'surveys.surveysubmissiondate as submissionDate',
      'surveys.surveysubmissiontime as submissionTime',
      'registrations.participantid as participant_id',
      'registrations.eventoccurrenceid as event_id'
    )
    .join('registrations', 'surveys.registrationid', '=', 'registrations.registrationid')
    .where('surveys.surveyid', surveyId)
    .first();

  if (!survey) {
    return res.redirect('/surveys');
  }

  // Format the dates for the date input fields
  if (survey.eventdate) {
    survey.eventdate = new Date(survey.eventdate).toISOString().split('T')[0];
  }
  if (survey.submissionDate) {
    survey.submissionDate = new Date(survey.submissionDate).toISOString().split('T')[0];
  }

  const participants = await knex('participants').select('participantid', 'participantfirstname', 'participantlastname', 'participantemail');
  const events = await knex('eventoccurrences').select('eventoccurrenceid', 'eventname', 'eventdate', 'eventtimestart');

  res.render('surveys/edit', {
    survey,
    user: req.session.user,
    participants,
    events
  });
});

// POST route for updating a survey
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const {
    participant_id, event_id,
    satisfactionScore, usefulnessScore, instructorScore,
    recommendationScore, overallScore, npsBucket, comments,
    submissionDate, submissionTime
  } = req.body;

  const participant = await knex('participants').where('participantid', participant_id).first();
  const eventOccurrence = await knex('eventoccurrences').where('eventoccurrenceid', event_id).first();

  if (!participant || !eventOccurrence) {
    req.session.message = 'Invalid Participant or Event selected.';
    return res.redirect(`/surveys/edit/${surveyId}`);
  }

  const registration = await knex('registrations')
    .where({
      participantid: participant_id,
      eventoccurrenceid: event_id,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart
    })
    .first();

  if (!registration) {
    req.session.message = 'No matching registration found for the selected participant and event.';
    return res.redirect(`/surveys/edit/${surveyId}`);
  }

  await knex('surveys')
    .where('surveyid', surveyId)
    .update({
      registrationid: registration.registrationid,
      participantemail: participant.participantemail,
      eventname: eventOccurrence.eventname,
      eventdate: eventOccurrence.eventdate,
      eventtimestart: eventOccurrence.eventtimestart,
      surveysatisfactionscore: parseInt(satisfactionScore) || null,
      surveyusefulnessscore: parseInt(usefulnessScore) || null,
      surveyinstructorscore: parseInt(instructorScore) || null,
      surveyrecommendationscore: parseInt(recommendationScore) || null,
      surveyoverallscore: parseFloat(overallScore) || null,
      surveynpsbucket: npsBucket,
      surveycomments: comments,
      surveysubmissiondate: submissionDate,
      surveysubmissiontime: submissionTime
    });
  res.redirect('/surveys');
});

// POST route for deleting a survey
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  const surveyId = parseInt(req.params.id);
  await knex('surveys').where('surveyid', surveyId).del();
  res.redirect('/surveys');
});

module.exports = router;
