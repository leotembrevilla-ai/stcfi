# Student Grade Portal (Teacher & Student View)

## Overview
- Teacher login (stored in SQLite, hashed with bcrypt)
- Teacher dashboard to add/edit/delete student subject rows
- Student public view: check grades by entering student ID

## Default credentials
- Username: `teacher1`
- Password: `password123`

## Setup
1. Install Node.js (LTS)
2. In the project folder run:
   ```bash
   npm install
   node db_init.js
   node server.js
