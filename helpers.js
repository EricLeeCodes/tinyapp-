//Checking if email is already registered
function getUserByEmail(email, database) {

  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }

  return null;
}

module.exports = { getUserByEmail };