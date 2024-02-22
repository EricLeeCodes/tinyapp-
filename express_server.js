const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");

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
  res.clearCookie('user_id');
  res.send("Hello!");

});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Help from Larry AI
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
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
  if (typeof req.cookies["user_id"] === 'undefined') {
    res.redirect("/login");
  } else {
    const user = users[req.cookies["user_id"]];
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

//Help from Larry AI
app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const userID = req.cookies["user_id"];
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
  if (typeof req.cookies["user_id"] !== 'undefined') {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

app.get("/login", (req, res) => {
  if (typeof req.cookies["user_id"] !== 'undefined') {
    res.redirect("/urls");
  } else {
    res.render("login");
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
  const user = req.cookies["user_id"];
  if (typeof user === 'undefined') {
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
  const user = req.cookies["user_id"];
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
  const userID = req.cookies["user_id"];
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
  const randomUserID = generateRandomUserID();
  const candidateID = randomUserID;
  const candidateEmail = req.body.email;
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  //Checking if email or password is empty
  if (req.body.email <= 0 || req.body.password <= 0) {
    return res.status(400).send("Email or password field is empty!");
  }
  //Checking if email is there

  if (userLookUp(candidateEmail) !== null) {
    return res.status(400).send("Email already exists!");
  }

  //Adding new users by registration
  users[candidateID] = {};
  users[candidateID].id = candidateID;
  users[candidateID].email = candidateEmail;
  users[candidateID].password = hashedPassword;


  res.cookie('user_id', candidateID);
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

  res.cookie('user_id', user.id);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
