const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;


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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  console.log("users stored", users);
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: req.cookies["user_id"] };

  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const randomUserID = generateRandomUserID();
  const candidateID = randomUserID;
  const candidateEmail = req.body.email;
  const candidatePassword = req.body.password;
  //Adding new users by registration
  users[candidateID] = {};
  users[candidateID].id = candidateID;
  users[candidateID].email = candidateEmail;
  users[candidateID].password = candidatePassword;
  console.log(users);
  res.cookie('user_id', req.body.email);
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id", (req, res) => {
  let editedLongURL = req.body.editedLongURL;
  urlDatabase[req.params.id] = editedLongURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  res.cookie('user', req.body.username);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  res.redirect(`/urls`);
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
