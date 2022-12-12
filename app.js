const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
app.get("/users/", async (request, response) => {
  let users = `
    select * from user
    `;
  let details = await db.all(users);
  response.send(details);
});

//register

app.post("/users/", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const userDetails = `
  select * from user
  where username = "${username}"
  `;

  const dbUser = await db.run(userDetails);
  if (dbUser === undefined) {
    let newUser = `
      INSERT INTO user (username,name,password,gender,location)
      VALUES (
          '${username}','${name}','${hashedPassword}','${gender}','${location}'
      )
      `;
    await db.run(newUser);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("username exits");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userDetails = `
  select * from user
  where username = "${username}"
  `;

  const dbUser = await db.get(userDetails);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, dbUser.password);

    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
