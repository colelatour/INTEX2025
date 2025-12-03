const express = require('express');
const router = express.Router();
const knex = require('../db');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth'); // Assuming auth middleware is available

// GET donations listing.
router.get('/', isAuthenticated, async function(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const searchTerm = req.query.search || '';

  let query = knex('donations').join('participants', 'donations.participantid', '=', 'participants.participantid');
  let countQuery = knex('donations').join('participants', 'donations.participantid', '=', 'participants.participantid');

  if (searchTerm) {
    const searchTerms = searchTerm.split(' ').filter(term => term);
    if (searchTerms.length > 1) {
      // Search for first name and last name
      query = query.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
      countQuery = countQuery.where(function() {
        this.where('participants.participantfirstname', 'ilike', `%${searchTerms[0]}%`)
            .andWhere('participants.participantlastname', 'ilike', `%${searchTerms[1]}%`);
      });
    } else {
      // Search for a single term in first name, last name, or date
      query = query.where('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                   .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`)
                   .orWhereRaw(`CAST(donations.donationdate AS TEXT) ILIKE ?`, [`%${searchTerm}%`]);
      countQuery = countQuery.where('participants.participantfirstname', 'ilike', `%${searchTerm}%`)
                             .orWhere('participants.participantlastname', 'ilike', `%${searchTerm}%`)
                             .orWhereRaw(`CAST(donations.donationdate AS TEXT) ILIKE ?`, [`%${searchTerm}%`]);
    }
  }

  const totalDonations = await countQuery.count('donationid as count').first();
  const totalPages = Math.ceil(totalDonations.count / pageSize);

  const donations = await query
    .select(
      'donations.donationid as id',
      'donations.donationamount as amount',
      'donations.donationdate as donationDate',
      'donations.participantemail as participantEmail',
      'participants.participantfirstname',
      'participants.participantlastname'
    )
    .limit(pageSize)
    .offset(offset);
  
  const userDonorSearchTerm = req.query.userDonorSearch || '';

  // Fetch userdonor data
  let userDonors = [];
  try {
    let userDonorQuery = knex.raw('SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor');

    if (userDonorSearchTerm) {
      userDonorQuery = knex.raw(
        'SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor WHERE userdonorfirstname ILIKE ? OR userdonorlastname ILIKE ?',
        [`%${userDonorSearchTerm}%`, `%${userDonorSearchTerm}%`]
      );
    }
    
    userDonors = await userDonorQuery;
    userDonors = userDonors.rows; // Knex.raw for PostgreSQL returns { rows: [], fields: [] }
    console.log('Fetched userDonors data:', userDonors);
  } catch (err) {
    console.error('Error fetching userDonors:', err);
    // If there's an error fetching userDonors, ensure it's an empty array
    userDonors = [];
  }
  console.log('Rendering donations/index with userDonors:', userDonors);

    res.render('donations/index', {
      donations: donations,
      user: req.session.user,
      currentPage: page,
      totalPages: totalPages,
      searchTerm: searchTerm,
      userDonors: userDonors, // Pass userDonors data to the template
      userDonorSearchTerm: userDonorSearchTerm // Pass userDonorSearchTerm to the template
    });
  });
  
// GET route for editing a user donor
  
    router.get('/userdonor/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
      const userDonorId = parseInt(req.params.id);
  
      
  
      try {
  
        const userDonor = await knex.raw('SELECT userdonorid, userdonorfirstname, userdonorlastname, userdonoramount, userdonordate FROM userdonor WHERE userdonorid = ?', [userDonorId]);
  
        if (!userDonor.rows || userDonor.rows.length === 0) {
  
          req.session.message = 'User Donor not found.';
  
          return res.redirect('/donations');
  
        }
  
        const donor = userDonor.rows[0];
  
    
  
        // Format the date for the date input field
  
        if (donor.userdonordate) {
  
            donor.userdonordate = new Date(donor.userdonordate).toISOString().split('T')[0];
  
        }
  
    
  
        res.render('donations/userdonor/edit', { user: req.session.user, userDonor: donor });
  
      } catch (error) {
  
        console.error('Error fetching user donor for edit:', error);
  
        req.session.message = 'Error fetching user donor for edit: ' + error.message;
  
        res.redirect('/donations');
  
        }
  
      });
  
      
  
      // POST route for updating a user donor
  
      router.post('/userdonor/edit/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
        const userDonorId = parseInt(req.params.id);
  
        const { userdonorfirstname, userdonorlastname, userdonoramount, userdonordate } = req.body;
  
      
  
        try {
  
          await knex.raw('UPDATE userdonor SET userdonorfirstname = ?, userdonorlastname = ?, userdonoramount = ?, userdonordate = ? WHERE userdonorid = ?', 
  
            [userdonorfirstname, userdonorlastname, parseFloat(userdonoramount) || 0.00, userdonordate, userDonorId]);
  
          req.session.message = 'User Donor updated successfully!';
  
          res.redirect('/donations');
  
        } catch (error) {
  
          console.error('Error updating user donor:', error);
  
          req.session.message = 'Error updating user donor: ' + error.message;
  
          res.redirect(`/donations/userdonor/edit/${userDonorId}`);
  
          }
  
        });
  
        
  
        // POST route for deleting a user donor
  
        router.post('/userdonor/delete/:id', isAuthenticated, authorizeRoles(['manager']), async (req, res) => {
  
          const userDonorId = parseInt(req.params.id);
  
        
  
          try {
  
            await knex.raw('DELETE FROM userdonor WHERE userdonorid = ?', [userDonorId]);
  
            req.session.message = 'User Donor deleted successfully!';
  
            res.redirect('/donations');
  
          } catch (error) {
  
            console.error('Error deleting user donor:', error);
  
            req.session.message = 'Error deleting user donor: ' + error.message;
  
            res.redirect('/donations');
  
          }
  
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
