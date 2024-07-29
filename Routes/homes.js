const express = require('express');
const router = express.Router();
// const { Employee } = require('../models');

// Add/Edit/View Employees
router.get('/', async (req, res) => {
//   const employees = await Employee.findAll();
  res.render('home');
});



// Other routes for edit and view

module.exports = router;
