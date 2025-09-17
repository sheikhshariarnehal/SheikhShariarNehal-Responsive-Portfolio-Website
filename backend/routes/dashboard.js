const express = require('express');
const path = require('path');
// const auth = require('../middleware/auth'); // Authentication disabled

const router = express.Router();

// Dashboard routes (no authentication required)
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/admin.html'));
});

// Debug login page
router.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/debug-login.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/login.html'));
});

router.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/admin.html'));
});

router.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/projects.html'));
});

router.get('/add-project', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/add-project.html'));
});

router.get('/edit-project/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/edit-project.html'));
});

module.exports = router;
