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

app.post("/register/", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const userDetails = `
  select * from user
  where username = "${username}"
  `;

  const dbUser = await db.get(userDetails);
  try {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (dbUser === undefined) {
      let newUser = `
      INSERT INTO user (username,name,password,gender,location)
      VALUES (
          '${username}','${name}','${hashedPassword}','${gender}','${location}'
      )
      `;
      await db.run(newUser);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`db error ${e.message}`);
  }
});

//login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userDetails = `
  select * from user
  where username = "${username}"
  `;
  let user = await db.get(userDetails);
  try {
    if (user === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch === true) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (e) {
    console.log(`db error ${e.message}`);
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  console.log(newPassword);
  const oldHashedPassword = await bcrypt.hash(request.body.oldPassword, 10);
  const hashedPassword = await bcrypt.hash(request.body.newPassword, 10);
  let passwordUpdate = `
    select * from user where username= "${username}"

    `;
  let getOldPassword = await db.get(passwordUpdate);
  console.log(getOldPassword.password);

  try {
    if (getOldPassword.password !== newPassword) {
      response.status(400);
      response.status("Invalid current password");
    } else if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let updateNew = `
        UPDATE 
        user
        SET
        password="${hashedPassword}"
        `;
      await db.run(updateNew);

      response.status(200);
      response.send("Password updated");
    }
  } catch (e) {
    console.log(`db error ${e.message}`);
  }
});

module.exports = app;
