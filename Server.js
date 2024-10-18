const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const session = require('express-session');
const crypto = require('crypto');

// Generate a secret key (use this only once and save it for future use)
const secret = crypto.randomBytes(64).toString('hex');

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}));

app.use(session({
  secret: secret, // Your generated secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

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
  const sql = "INSERT INTO login (`name`, `email`, `password`,`adminAccess`,`quatationAccess`,`quatationedtaccess` ,  `userId`) VALUES (?)";
  const values = [req.body.username, req.body.email, req.body.password, req.body.admin, req.body.editAccess, req.body.quotation, ''];
  db.query(sql, [values], (err, data) => {
    if (err) {
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

app.get("/places", (req, res) => {
  const sql = "SELECT * FROM places";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching places:", err);
      return res.status(500).json({ error: "Failed to fetch places." });
    }
    return res.status(200).json(results);
  });
});

app.get("/places/cost/:id", (req, res) => {
  const { id } = req.params; // ID of the place
  const { adults } = req.query;  // Query parameter for the number of adults

  const sql = "SELECT * FROM places WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching place:", err);
      return res.status(500).json({ error: "Failed to fetch place." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Place not found." });
    }

    const place = results[0];
    const adultRate = place.adultrate;

    // Calculate total cost based on the number of adults
    const totalCost = (adults * adultRate);

    return res.status(200).json({
      place: place.name,
      totalCost,
      adults: adults || 0
    });
  });
});


app.put("/places/:id", (req, res) => {
  const { id } = req.params;
  const { adultrate } = req.body;  // New adult rate passed in the request body

  const sql = "UPDATE places SET adultrate = ? WHERE id = ?";

  db.query(sql, [adultrate, id], (err, result) => {
    if (err) {
      console.error("Error updating adultrate:", err);
      return res.status(500).json({ error: "Failed to update adultrate." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Place not found." });
    }

    return res.status(200).json({ message: "Adult rate updated successfully." });
  });
});


// Fetch extraactivities data
app.get('/extraactivites', (req, res) => {
  let query = `SELECT * FROM extraactivites`;

  // Search query filter
  const search = req.query.search;
  if (search) {
      query += ` WHERE city LIKE '%${search}%' OR name LIKE '%${search}%'`;
  }

  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.json(results);
  });
});




app.post("/createQuotation", (req, res) => {
  const sql = "INSERT INTO quotationdatabaseall (  createdBy, createdByID, createdAt ) VALUES (?)";
  const values = [req.body.userId, req.body.name, Date.now()];
  db.query(sql, [values], (err, results) => {
    if (err) {
      console.error("Error creating quotation record:", err);
      return res.status(500).json({ error: "Failed to create new quotation record." });
    }
    const newId = results.insertId;
    return res.status(200).json({ message: "Quotation ID generated successfully.", id: newId, status: 200 });
  });
});



app.post("/saveQuatation/:id", (request, response) => {
  const id = request.params.id;
  const { packageType, startDate, endDate, inbetweenDays } = request.body;

  // Ensure that startDate and endDate are not null or undefined
  if (!startDate || !endDate) {
    return response.status(400).send({ status: 400, message: 'Start date and End date are required' });
  }

  const sqlQuery = "UPDATE quotationdatabaseall SET packagetype = ?, StartDate = ?, EndDate = ?, inbetweendays = ? WHERE id = ?";
  db.query(sqlQuery, [packageType, startDate, endDate, inbetweenDays, id], (error, result) => {
    if (error) {
      return response.status(500).send({ status: 500, message: error.message });
    }
    response.json({ status: 200, message: 'Data updated' });
  });
});


app.post("/getquatationbyID/:id", (request, response) => {
  const id = request.params.id;
  const sqlQuery = `SELECT * FROM quotationdatabaseall WHERE createdBy  =  ?`
  db.query(sqlQuery, [id], (error, result) => {
    if (error) {
      return response.status(500).send(error)
    }
    response.json({ status: 200, result })
  })
})


app.post("/getquatationbyQuatationid/:id", (request, response) => {
  const id = request.params.id;
  const sqlQuery = `SELECT * FROM quotationdatabaseall WHERE id  =  ?`
  db.query(sqlQuery, [id], (error, result) => {
    if (error) {
      return response.status(500).send(error)
    }
    response.json({ status: 200, result })
  })
})




app.listen(8081, () => {
  console.log("Server is listening on port 8081.");
});
