const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user object valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserObject = testUsers["userRandomID"];
    assert.strictEqual(user, expectedUserObject);
  });
});

describe('getUserByEmail', function() {
  it("should return undefined with an email not in our database", function() {
    const user = getUserByEmail("notInDatabase@example.com", testUsers);
    assert.isNull(user);
  });
});

