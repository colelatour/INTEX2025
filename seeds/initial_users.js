const bcrypt = require('bcrypt');
const dummyData = require('../dummy-data'); // Adjust path as needed

exports.seed = async function(knex) {
  // Deletes ALL existing entries for 'users' table
  await knex('users').del();

  const usersToInsert = [];
  for (const user of dummyData.users) {
    // Hash password if it's not already hashed (check for bcrypt signature)
    let hashedPassword = user.password;
    if (!user.password.startsWith('$2b$')) { // Simple check if it looks like a bcrypt hash
      hashedPassword = await bcrypt.hash(user.password, 10);
    }

    usersToInsert.push({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPassword,
      role: user.role
    });
  }
  
  await knex('users').insert(usersToInsert);
};
