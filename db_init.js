// db_init.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./grades.db');

db.serialize(() => {
  // Drop old tables (safe for dev)
  db.run('DROP TABLE IF EXISTS teachers');
  db.run('DROP TABLE IF EXISTS students');

  // Create teachers table
  db.run(`CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);

  // Create students table
  // Each student may have many subject rows; id is student id
  db.run(`CREATE TABLE students (
    id INTEGER,
    name TEXT,
    subject TEXT,
    grade INTEGER,
    PRIMARY KEY (id, subject)
  )`);

  // Insert default teacher (username: teacher1, password: password123)
  const saltRounds = 10;
  const password = 'password123';
  const hash = bcrypt.hashSync(password, saltRounds);
  db.run('INSERT OR IGNORE INTO teachers (username, password_hash) VALUES (?, ?)', ['teacher1', hash]);

  // Insert sample students (multiple subjects possible)
  const students = [
    [1001, 'John Cruz', 'Math', 90],
    [1001, 'John Cruz', 'Science', 87],
    [1002, 'Maria Santos', 'Science', 88],
    [1002, 'Maria Santos', 'Math', 85],
    [1003, 'Leo Dela Cruz', 'English', 92],
    [1003, 'Leo Dela Cruz', 'Math', 78]
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO students (id, name, subject, grade) VALUES (?, ?, ?, ?)');
  students.forEach(s => stmt.run(s));
  stmt.finalize();

  console.log('Database initialized: grades.db');
});

db.close();
