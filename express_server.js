const express = require("express");
var cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Users database where new users will be added using the POST /register route.
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//Url Database where an ID is linked to the user and website they've created.
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.lighthouselabs.ca/",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
};

//Home page 
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  //if not logged in, redirect to login page
  if (!userID) {
    return res.redirect(302, "/login");
  } else {
    res.redirect("/urls"); //Redirects to the Urls page if logged in
  }

});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Help from Larry AI
//Displays the user's url options
app.get("/urls", (req, res) => {
  const userID = req.session.user_id; //accessing cookie session
  //if the user isn't logged in, send's an HTML message to log in.
  if (!userID) {
    return res.send('<h1>Please log in <a href="/login">here</a>!!!</h1>');
  }

  //Setting the user from the appropriate id
  const user = users[userID];

  //Gets the user's created Urls
  const userURLs = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === userID) {
      userURLs[key] = urlDatabase[key];
    }
  }

  const templateVars = {
    user,
    urls: userURLs //Connects the url to templateVars variable
  };

  //Allows access of templateVars variable in urls_index
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id; //Checks sessions to see if logged in
  //Redirects the user to login page when not logged in
  if (!userID) {
    res.redirect("/login");
  } else {
    const user = users[userID]; //Sets user from appropriate ID
    const templateVars = { user }; //Lets the user into templateVars variable

    //Allows access of templateVars variable on urls_new page
    res.render("urls_new", templateVars);
  }
});

//Help from Larry AI
//Shows the short url according to its ID
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id; //Checks login session
  const user = users[userID]; //Sets user according to session
  const urlEntry = urlDatabase[req.params.id]; //Sets appropriate URL based off of the url's id.

  //Checks if there was a matching URL
  if (!urlEntry) {
    return res.status(404).send("URL not found.");
  }
  //Checks if the userID matches the userID of a set url link
  if (userID !== urlEntry.userID) {
    return res.status(403).send("Please log in to access this!");
  }

  //templateVars variable containing the id of the url, longURL (actual url used to access websites), and the user
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user
  };

  //Connects templateVars to urls_show page
  res.render("urls_show", templateVars);
});

//Accesses the register page
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  //If user is not logged in, shows the register page
  if (!userID) {
    res.render("register");
  } else {
    res.redirect("/urls"); //If user is logged in, sends to /urls page
  }
});

//Accesses login page
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  //If user is not logged in, goes to login page
  if (!userID) {
    res.render("login");
  } else {
    res.redirect("/urls"); //If user is logged in, redirects to /urls
  }
});

//Sending html from js test.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Accessing the short link to go to associated longURL link to actually access the longURL given
app.get("/u/:id", (req, res) => {
  const shortLinkID = req.params.id;
  //If the shortLinkID doesn't exist, an html response saying it doesn't exist occurs
  if (shortLinkID === "undefined") {
    return res.send(`Sorry! The short link you're accessing does not exist!`);
  }

  //Accesses urlDatabase with the shortlink given and returns a longURL link
  const longURL = urlDatabase[shortLinkID].longURL;
  //If the link exists, access it.
  if (longURL) {
    res.redirect(longURL);
  }
});

//Submitting website address to be shortened
app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  //If no one is logged in, HTML page with explanations occures
  if (!user) {
    return res.send("Sorry. You cannot shorten URLs because you are not logged in.");
  } else {
    //Receives user inputted url from urls_new page
    const longURLInput = req.body.longURL;
    const key = generateRandomString(); //Generated a random string as the key
    urlDatabase[key] = {}; //Created an object with the key
    //Added longURL key with longURLInput as the value
    urlDatabase[key].longURL = longURLInput;
    //Added userID key with user as the value
    urlDatabase[key].userID = user;
    //redirects to the urls/id page
    res.redirect(`/urls/${key}`);
  }

});

//Accesses page where you can edit your url
app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const urlEntry = urlDatabase[req.params.id];
  //Checks if the user is logged in and gives an error if not
  if (user !== urlEntry.userID) {
    return res.send("Please log in to access your files!");
  }
  //Receives the editedLongURL from user input 
  let editedLongURL = req.body.editedLongURL;
  //Checks if the website is longer than 3 characters
  if (editedLongURL.length < 3) {
    res.send("Please put in a valid website");
  }
  //Inputs the edited URL into the database by replacing the older link
  urlDatabase[req.params.id].longURL = editedLongURL;
  //Redirects to /urls
  res.redirect(`/urls`);
});

//Deletes the urls in the database
app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  //If the link doesn't exist, an HTML error page displays
  if (!urlDatabase[req.params.id]) {
    return res.send("Short link does not exist.");
  }
  //If the user isn't logged in, an HTML error page displays
  if (!userID) {
    return res.send("Please log in to access your files!");
  }
  //Deletes the link in the database
  delete urlDatabase[req.params.id];

  //Redirects back to /urls
  res.redirect(`/urls`);
});


//Registers a user
app.post("/register", (req, res) => {
  const candidateEmail = req.body.email; //Stores user inputted email into a var
  //Stores user inputted password to a variable
  const candidatePassword = req.body.password;
  //Looks if the user is in the database by existing email
  const user = getUserByEmail(candidateEmail, users);
  //Checking if email or password is empty
  if (!candidateEmail || !candidatePassword) {
    return res.status(400).send("Email or password field is empty!");
  }
  //Checking if user is already there
  if (user !== null) {
    return res.status(400).send("Email already exists!");
  }

  //Generates a user's ID randomly
  const candidateID = generateRandomUserID();
  //Hashes password
  const hashedPassword = bcrypt.hashSync(candidatePassword, 10);

  //Adding new users by registration
  users[candidateID] = {
    id: candidateID,
    email: candidateEmail,
    password: hashedPassword
  };

  //stores the user ID into the session
  req.session.user_id = candidateID;
  res.redirect("/urls");
});

//Logs in user
app.post("/login", (req, res) => {
  const candidateEmail = req.body.email;
  //Gets the user by existing email in the database
  const user = getUserByEmail(candidateEmail, users);
  //Checking if user exists
  if (!user) {
    return res.status(403).send("Email not found!");
  }
  //Checking if emails and password matches
  if (!bcrypt.compareSync(req.body.password, user.password) || user.email !== req.body.email) {
    return res.status(403).send("Email and password does not match.");
  }
  //Checking if email or password is empty
  if (req.body.email <= 0 || req.body.password <= 0) {
    return res.status(400).send("Email or password field is empty!");
  }

  //Compares user inputted password to stored password
  bcrypt.compareSync(req.body.password, user.password);

  // res.cookie('user_id', user.id);
  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

//Logs out user
app.post("/logout", (req, res) => {
  //Discards session by setting it to null
  req.session = null;
  //Redirects to the log in page.
  res.redirect(`/login`);
});


const express_server = app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Generates random string ID
//https://attacomsian.com/blog/javascript-generate-random-string used for inspiration for this function
function generateRandomString() {

  //Sets an string of the alphabet in both upper and lower cases.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";

  //Sets a random string by using math.random and the overall length of the string to choose from.
  while (randomString.length < 6) {
    randomString += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomString;
}

//Generates random user ID
//Functionally similar to generateRandomString() but with different names
function generateRandomUserID() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomUserID = "";

  while (randomUserID.length < 6) {
    randomUserID += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomUserID;
}


module.exports = express_server;