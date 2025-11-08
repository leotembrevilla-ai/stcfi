// server.js
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'grades.db'));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session config
app.use(session({
  secret: 'gradeportal_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Middleware for teacher routes
function requireTeacher(req, res, next) {
  if (req.session && req.session.teacher) return next();
  // If request came from a fetch expecting JSON, respond with 401 JSON
  if (req.headers.accept && req.headers.accept.indexOf('application/json') !== -1) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // otherwise redirect to login page
  res.redirect('/login.html');
}

/* -------------------------
   Authentication routes
   ------------------------- */

// Login (form POST from /login.html)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Username & password required');

  db.get('SELECT * FROM teachers WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).send('Database error');
    if (!row) return res.status(401).send('Invalid credentials');

    bcrypt.compare(password, row.password_hash, (err, ok) => {
      if (err) return res.status(500).send('Hash check error');
      if (!ok) return res.status(401).send('Invalid credentials');

      // success
      req.session.teacher = { id: row.id, username: row.username };
      res.redirect('/index.html');
    });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

/* -------------------------
   Teacher APIs (protected)
   ------------------------- */

// Get all student rows (for teacher dashboard)
app.get('/api/students', requireTeacher, (req, res) => {
  db.all('SELECT id, name, subject, grade FROM students ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a student record (id + subject row)
app.post('/api/students', requireTeacher, (req, res) => {
  const { id, name, subject, grade } = req.body;
  if (!id || !name || !subject || typeof grade === 'undefined') return res.status(400).json({ error: 'Missing fields' });

  db.run('INSERT INTO students (id, name, subject, grade) VALUES (?, ?, ?, ?)', [id, name, subject, grade], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ inserted: true });
  });
});

// Update grade for a student-subject (id + subject identifies row)
app.put('/api/students/:id', requireTeacher, (req, res) => {
  const id = req.params.id;
  const { subject, grade, name } = req.body;
  if (!subject || typeof grade === 'undefined') return res.status(400).json({ error: 'Missing subject or grade' });

  db.run('UPDATE students SET grade = ?, name = ? WHERE id = ? AND subject = ?', [grade, name || null, id, subject], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ updated: true });
  });
});

// Delete a student-subject row or all records for a student (teacher controlled)
app.delete('/api/students/:id', requireTeacher, (req, res) => {
  const id = req.params.id;
  const subject = req.query.subject; // optional: /api/students/1001?subject=Math

  if (subject) {
    db.run('DELETE FROM students WHERE id = ? AND subject = ?', [id, subject], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  } else {
    db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  }
});

/* -------------------------
   Student view (public)
   ------------------------- */

// Return all subject rows for a student id
app.get('/api/student/:id', (req, res) => {
  const id = req.params.id;
  db.all('SELECT id, name, subject, grade FROM students WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(rows);
  });
});

/* Fallback to index served from /public for anything else */
app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Student Grade Portal running: http://localhost:${PORT}`);
});
