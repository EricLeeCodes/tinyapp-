const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const { app } = require('../express_server');


chai.use(chaiHttp);

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
    chai.assert.strictEqual(user, expectedUserObject);
  });

  it("should return undefined with an email not in our database", function() {
    const user = getUserByEmail("notInDatabase@example.com", testUsers);
    chai.assert.isNull(user);
  });
});



//Used ChatGPT for this code.
describe('Testing URL routes', function() {
  const agent = chai.request.agent('http://localhost:8080');

  it('should redirect GET / to /login with status 302 with the final status code of 200', function() {
    return agent
      .get('/')
      .then(function(res) {
        // console.log(res);
        expect(res).to.redirect;
        expect(res).to.redirectTo('http://localhost:8080/login');
        expect(res).to.have.status(200);
      });
  });

  it('should redirect GET /urls/new to /login with status 302 with the final status of code 200', function() {
    return agent
      .get('/urls/new')
      .then(function(res) {
        expect(res).to.redirect;
        expect(res).to.redirectTo('http://localhost:8080/login');
        expect(res).to.have.status(200);
      });
  });

  it('should respond with status 404 for GET /urls/NOTEXISTS', function() {
    return agent
      .get('/urls/NOTEXISTS')
      .then(function(res) {
        expect(res).to.have.status(404);
      });
  });

  it('should respond with status 403 for GET /urls/b6UTxQ', function() {
    return agent
      .get('/urls/b6UTxQ')
      .then(function(res) {
        expect(res).to.have.status(403);
      });
  });

  after(function() {
    // Clean up after all tests
    agent.close();
  });
});

//Used chatGPT to fix code as it lead me to the IP address instead of localhost.
describe("Login and Access Control Test", () => {
  it('should return 403 status code for unauthorized access to "http://localhost:8080/urls/b6UTxQ"', () => {
    const agent = chai.request.agent("http://localhost:8080");

    // Step 1: Login with valid credentials
    return agent
      .post("/login")
      .send({ email: "user2@example.com", password: "dishwasher-funk" })
      .then((loginRes) => {
        // Step 2: Make a GET request to a protected resource
        return agent.get("/urls/b6UTxQ").then((accessRes) => {
          // Step 3: Expect the status code to be 403
          expect(accessRes).to.have.status(403);
        });
      });
  });
});