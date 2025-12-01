module.exports = {
  users: [
    { id: 1, username: 'manager', role: 'manager' },
    { id: 2, username: 'commonuser', role: 'common' }
  ],
  participants: [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' }
  ],
  events: [
    { id: 1, name: 'Community Meetup', date: '2025-12-15', description: 'A get-together for the community.' },
    { id: 2, name: 'Fundraising Gala', date: '2026-01-20', description: 'A formal event to raise funds.' }
  ],
  surveys: [
    { id: 1, participant_id: 1, title: 'Post-Event Survey', description: 'Feedback on the Community Meetup.' },
    { id: 2, participant_id: 2, title: 'General Feedback', description: 'General feedback about our programs.' }
  ],
  milestones: [
    { id: 1, title: 'Complete Orientation', description: 'Finish the initial orientation program.' },
    { id: 2, title: 'Attend First Event', description: 'Attend one of our community events.' }
  ],
  participant_milestones: [
    { id: 1, participant_id: 1, milestone_id: 1, completed_date: '2025-12-10' },
    { id: 2, participant_id: 1, milestone_id: 2, completed_date: '2025-12-15' },
    { id: 3, participant_id: 2, milestone_id: 1, completed_date: '2025-12-12' }
  ],
  donations: [
    { id: 1, donor_name: 'Anonymous', amount: '100.00', donation_date: '2025-12-01' },
    { id: 2, donor_name: 'A. Friend', amount: '50.00', donation_date: '2025-12-05' }
  ]
};
