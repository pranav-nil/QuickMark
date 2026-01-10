// server.js — Backend for Digital Library

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("path");
const bodyParser = require("body-parser");



const app = express();
const PORT = process.env.PORT || 3000;



/* ---------- Database Connection ---------- */
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // change if needed
  database: "diglab",
};

let pool;
(async () => {
  try {
    pool = await mysql.createPool(dbConfig);
    console.log("✅ Connected to MySQL Database");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

/* ---------- Middleware ---------- */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "digital-library-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));



/* ---------- Helper Middleware ---------- */
function ensureAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login.html");
}

/* ---------- Routes ---------- */

// Root redirect
app.get("/", ensureAuth, (req, res) => {
  res.redirect("/home.html");
});

/* ---------- Authentication ---------- */

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).send("Username and password are required.");

    const hashed = await bcrypt.hash(password, 10);
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existing.length > 0)
      return res.status(400).send("Username already exists.");

    await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashed,
    ]);
    res.redirect("/login.html");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error during signup.");
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).send("Username and password are required.");

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (rows.length === 0) return res.status(401).send("Invalid credentials.");

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Invalid credentials.");

    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect("/home.html");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error during login.");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login.html"));
});

/* ---------- API: Books ---------- */

// Get all books for the logged-in user
app.get("/api/books", ensureAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM books WHERE user_id = ? ORDER BY id DESC",
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch books error:", err);
    res.status(500).send("Failed to load books.");
  }
});

// Add a new book
app.post("/api/books", ensureAuth, async (req, res) => {
  try {
    const { title, author, link } = req.body;
    if (!title || !author || !link)
      return res.status(400).send("All fields are required.");

    const [result] = await pool.query(
      "INSERT INTO books (user_id, title, author, link) VALUES (?, ?, ?, ?)",
      [req.session.userId, title, author, link]
    );

    const [newBook] = await pool.query("SELECT * FROM books WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(newBook[0]);
  } catch (err) {
    console.error("Add book error:", err);
    res.status(500).send("Failed to add book.");
  }
});

// Delete a book
app.delete("/api/books/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM books WHERE id = ? AND user_id = ?",
      [id, req.session.userId]
    );
    if (result.affectedRows === 0)
      return res.status(404).send("Book not found or not authorized.");
    res.status(204).end();
  } catch (err) {
    console.error("Delete book error:", err);
    res.status(500).send("Failed to delete book.");
  }
});

/* ---------- Catch-All ---------- */
app.use((req, res) => {
  res.status(404).send("Page not found.");
});

/* ---------- Server Start ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
