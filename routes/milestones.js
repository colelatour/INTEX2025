const express = require('express');
const router = express.Router();
const data = require('../dummy-data');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET milestones listing.
router.get('/', function(req, res, next) {
  res.render('milestones/index', { milestones: data.milestones, user: req.session.user });
});

// GET route for adding a new milestone
router.get('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  res.render('milestones/add', { user: req.session.user });
});

// POST route for adding a new milestone
router.post('/add', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const { title, description, milestoneDate } = req.body;
  const newId = data.milestones.length > 0 ? Math.max(...data.milestones.map(m => m.id)) + 1 : 1;
  const newMilestone = {
    id: newId,
    title,
    description,
    milestoneDate
  };
  data.milestones.push(newMilestone);
  res.redirect('/milestones');
});

// GET route for editing a milestone
router.get('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const milestoneId = parseInt(req.params.id);
  const milestone = data.milestones.find(m => m.id === milestoneId);
  if (!milestone) {
    return res.redirect('/milestones');
  }
  res.render('milestones/edit', { milestone, user: req.session.user });
});

// POST route for updating a milestone
router.post('/edit/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const milestoneId = parseInt(req.params.id);
  const { title, description, milestoneDate } = req.body;
  const milestoneIndex = data.milestones.findIndex(m => m.id === milestoneId);

  if (milestoneIndex !== -1) {
    data.milestones[milestoneIndex] = {
      ...data.milestones[milestoneIndex],
      title,
      description,
      milestoneDate
    };
  }
  res.redirect('/milestones');
});

// POST route for deleting a milestone
router.post('/delete/:id', isAuthenticated, authorizeRoles(['manager']), (req, res) => {
  const milestoneId = parseInt(req.params.id);
  data.milestones = data.milestones.filter(m => m.id !== milestoneId);
  res.redirect('/milestones');
});

module.exports = router;
