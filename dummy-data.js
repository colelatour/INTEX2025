module.exports = {
  users: [
    { id: 1, email: 'manager@example.com', password: '$2b$10$/n1aTmuX967BcKXSq/2Qbu5r6CgZHpEpi687p4yGCQgD0Qjfh8mnq', role: 'manager', firstName: 'Manager', lastName: 'User' },
    { id: 2, email: 'commonuser@example.com', password: '$2b$10$/n1aTmuX967BcKXSq/2Qbu5r6CgZHpEpi687p4yGCQgD0Qjfh8mnq', role: 'common', firstName: 'User', lastName: 'Common' }
  ],
  participants: [
    { id: 1, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', dob: '1990-05-15', phone: '555-123-4567', city: 'Springfield', state: 'IL', zip: '62704', schoolEmployer: 'Springfield High', fieldOfInterest: 'Technology', totalDonations: 150.00 },
    { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', dob: '1992-08-22', phone: '555-987-6543', city: 'Shelbyville', state: 'IL', zip: '62565', schoolEmployer: 'Shelbyville University', fieldOfInterest: 'Arts', totalDonations: 200.00 },
    { id: 3, firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@example.com', dob: '1991-11-01', phone: '555-111-2222', city: 'Capital City', state: 'IL', zip: '62701', schoolEmployer: 'Capital City College', fieldOfInterest: 'Science', totalDonations: 75.00 }
  ],
  events: [
    { id: 1, name: 'Community Meetup', date: '2025-12-15', description: 'A get-together for the community.', timeStart: '18:00', timeEnd: '20:00', location: 'Community Hall', capacity: 100, registrationDeadline: '2025-12-10' },
    { id: 2, name: 'Fundraising Gala', date: '2026-01-20', description: 'A formal event to raise funds.', timeStart: '19:00', timeEnd: '23:00', location: 'Grand Ballroom', capacity: 200, registrationDeadline: '2026-01-15' },
    { id: 3, name: 'Workshop on STEAM', date: '2026-02-01', description: 'Interactive workshop on Science, Technology, Engineering, Arts, and Mathematics.', timeStart: '09:00', timeEnd: '16:00', location: 'University Lab', capacity: 50, registrationDeadline: '2026-01-25' }
  ],
  surveys: [
    { id: 1, participant_id: 1, participantEmail: 'john.doe@example.com', event_id: 1, eventName: 'Community Meetup', eventDate: '2025-12-15', eventTimeStart: '18:00', title: 'Post-Event Survey', description: 'Feedback on the Community Meetup.', satisfactionScore: 4, usefulnessScore: 5, instructorScore: 4, recommendationScore: 8, overallScore: 4.2, npsBucket: 'Promoter', comments: 'Very insightful event!', submissionDate: '2025-12-16', submissionTime: '10:00' },
    { id: 2, participant_id: 2, participantEmail: 'jane.smith@example.com', event_id: 1, eventName: 'Community Meetup', eventDate: '2025-12-15', eventTimeStart: '18:00', title: 'General Feedback', description: 'General feedback about our programs.', satisfactionScore: 3, usefulnessScore: 4, instructorScore: 3, recommendationScore: 6, overallScore: 3.5, npsBucket: 'Passive', comments: 'Good, but could be more interactive.', submissionDate: '2025-12-17', submissionTime: '11:30' },
    { id: 3, participant_id: 3, participantEmail: 'alice.j@example.com', event_id: 2, eventName: 'Fundraising Gala', eventDate: '2026-01-20', eventTimeStart: '19:00', title: 'Gala Experience Survey', description: 'Feedback on the Fundraising Gala.', satisfactionScore: 5, usefulnessScore: 5, instructorScore: 5, recommendationScore: 10, overallScore: 5.0, npsBucket: 'Promoter', comments: 'Absolutely wonderful evening!', submissionDate: '2026-01-21', submissionTime: '09:00' }
  ],
  milestones: [
    { id: 1, title: 'Complete Orientation', description: 'Finish the initial orientation program.', milestoneDate: '2025-12-31' },
    { id: 2, title: 'Attend First Event', description: 'Attend one of our community events.', milestoneDate: '2026-01-15' },
    { id: 3, title: 'Submit Mid-Program Survey', description: 'Provide feedback on program progress.', milestoneDate: '2026-03-01' }
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
