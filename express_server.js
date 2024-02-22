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
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  console.log("users stored", users);

  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user };
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

  //Checking if email or password is empty
  if (candidateEmail.length <= 0 || candidatePassword <= 0) {
    res.status(400).send("Error 400!");
  }
  //Checking if email is there

  // console.log(candidateEmail);
  // for (const userID in users) {
  //   if (candidateEmail === users[userID].email) {
  //     res.status(400).send("Error 400!");
  //   }
  // }

  if (userLookUp(candidateEmail)) {
    res.status(400).send("Error 404");
  }

  //Adding new users by registration
  users[candidateID] = {};
  users[candidateID].id = candidateID;
  users[candidateID].email = candidateEmail;
  users[candidateID].password = candidatePassword;


  res.cookie('user_id', candidateID);
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
  res.cookie('user_id', req.body.email);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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

//Checking if email is already registered
function userLookUp(email) {
  for (const userID in users) {
    if (email === users[userID].email) {
      return userID;
    }
  }

  return null;
}
