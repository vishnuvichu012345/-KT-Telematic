const express = require('express');
const router = express.Router();
const { Employee } = require('../models');

// Add/Edit/View Employees
router.get('/', async (req, res) => {
  const employees = await Employee.findAll();
  res.render('employee', { employees });
});

router.post('/add', async (req, res) => {
  await Employee.create(req.body);
  res.redirect('/employees');
});

router.post('/edit/:id', async (req, res) => {
  await Employee.update(req.body, {
    where: { id: req.params.id }
  });
  res.redirect('/employees');
});

router.get('/delete/:id', async (req, res) => {
  await Employee.destroy({
    where: { id: req.params.id }
  });
  res.redirect('/employees');
});

module.exports = router;
