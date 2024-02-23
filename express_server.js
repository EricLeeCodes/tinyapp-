const express = require("express");
var cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


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

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.lighthouse.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Help from Larry AI
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.send('<h1>Please log in <a href="/login">here</a>!!!</h1>');
  }

  const user = users[userID];

  const userURLs = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === userID) {
      userURLs[key] = urlDatabase[key];
    }
  }

  const templateVars = {
    user,
    urls: userURLs
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.redirect("/login");
  } else {
    const user = users[userID];
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

//Help from Larry AI
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  const urlEntry = urlDatabase[req.params.id];

  if (!urlEntry) {
    return res.status(404).send("URL not found.");
  }
  if (userID !== urlEntry.userID) {
    return res.status(404).send("Please log in to access this!");
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.render("register");
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  console.log("##1 userID ==>", userID);
  if (!userID) {
    res.render("login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:id", (req, res) => {
  const shortLinkID = req.params.id;
  if (shortLinkID === "undefined") {
    return res.send(`Sorry! The short link you're accessing does not exist!`);
  }
  const longURL = urlDatabase[shortLinkID];
  if (longURL) {
    res.redirect(longURL);
  }
});

app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.send("Sorry. You cannot shorten URLs because you are not logged in.");
  } else {
    const longURLInput = req.body.longURL;
    const key = generateRandomString();
    urlDatabase[key] = {};
    urlDatabase[key].longURL = longURLInput;
    urlDatabase[key].userID = user;
    res.redirect(`/urls/${key}`);
  }

});

app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  const urlEntry = urlDatabase[req.params.id];
  if (user !== urlEntry.userID) {
    return res.send("Please log in to access your files!");
  }
  let editedLongURL = req.body.editedLongURL;
  if (editedLongURL.length < 3) {
    res.send("Please put in a valid website");
  }
  urlDatabase[req.params.id].longURL = editedLongURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!urlDatabase[req.params.id]) {
    return res.send("Short link does not exist.");
  }
  if (!userID) {
    return res.send("Please log in to access your files!");
  }
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  const candidateEmail = req.body.email;
  const candidatePassword = req.body.password;

  //Checking if email or password is empty
  if (!candidateEmail || !candidatePassword) {
    return res.status(400).send("Email or password field is empty!");
  }

  //Checking if email is there
  if (userLookUp(candidateEmail)) {
    return res.status(400).send("Email already exists!");
  }

  const candidateID = generateRandomUserID();
  const hashedPassword = bcrypt.hashSync(candidatePassword, 10);

  //Adding new users by registration
  users[candidateID] = {
    id: candidateID,
    email: candidateEmail,
    password: hashedPassword
  };

  req.session.user_id = candidateID;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const candidateEmail = req.body.email;
  const user = userLookUp(candidateEmail);
  //Comparing inputted password with stored password.

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

  bcrypt.compareSync(req.body.password, user.password);

  // res.cookie('user_id', user.id);
  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/login`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//https://attacomsian.com/blog/javascript-generate-random-string used for inspiration
function generateRandomString() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";

  while (randomString.length < 6) {
    randomString += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomString;
}

function generateRandomUserID() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomUserID = "";

  while (randomUserID.length < 6) {
    randomUserID += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return randomUserID;
}

//Checking if email is already registered
function userLookUp(email) {
  for (const userID in users) {
    if (email === users[userID].email) {
      return users[userID];
    }
  }

  return null;
}
