const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" })); // Configure CORS as needed
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "trichytourplanner",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database.");
});

app.post("/createid", (req, res) => {
  console.log("Received data for /createid:", req.body);
  const sql = "INSERT INTO login (`name`, `email`, `password`,`adminAccess`,`quatationAccess`,`quatatioedtAccess`,) VALUES (?)";
  const values = [req.body.username, req.body.email, req.body.password,req.body.admin,req.body.editAccess,req.body.quotation];
  db.query(sql, [values], (err, data) => {
    if (err) {
      console.error("Failed to insert new user:", err);
      return res.status(500).json({ error: "Failed to insert new user." });
    }
    return res.status(200).json({ message: "User created successfully." });
  });
});

app.post("/authenticateUser", (req, res) => {
  const { userName, password } = req.body;
  const sql = "SELECT * FROM login WHERE email = ? AND password = ?";

  db.query(sql, [userName, password], (err, results) => {
    if (err) {
      console.error("Error authenticating user:", err);
      return res.status(500).json({ error: "Authentication failed due to a server error." });
    }
    if (results.length > 0) {
      return res.status(200).json({ message: "Authentication successful.", user: results[0] });
    } else {
      return res.status(401).json({ message: "Authentication failed. Invalid email or password." });
    }
  });
});



app.listen(8081, () => {
  console.log("Server is listening on port 8081.");
});
