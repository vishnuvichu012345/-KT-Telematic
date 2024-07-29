const express = require('express');
const router = express.Router();
const { Asset } = require('../models');

// Add/Edit/View Employees
router.get('/', async (req, res) => {
  const stocks = await Asset.findAll();
  res.render('stock',{stocks});
});



// Other routes for edit and view

module.exports = router;
