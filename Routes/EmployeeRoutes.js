const express = require('express');
const router = express.Router();
const { Employee } = require('../models');

// Add/Edit/View Employees
router.get('/', async (req, res) => {
  const employees = await Employee.findAll();
  const message = req.query.message || '';
  const type = req.query.type || '';
  res.render('employee', { employees, message, type });
});

router.post('/add', async (req, res) => {
  try {
    await Employee.create(req.body);
    res.redirect('/employees?message=Employee added successfully&type=success');
  } catch (error) {
    res.redirect('/employees?message=Error adding employee&type=error');
  }
});

router.post('/edit/:id', async (req, res) => {
  try {
    await Employee.update(req.body, {
      where: { id: req.params.id }
    });
    res.redirect('/employees?message=Employee updated successfully&type=success');
  } catch (error) {
    res.redirect('/employees?message=Error updating employee&type=error');
  }
});

router.get('/delete/:id', async (req, res) => {
  try {
    await Employee.destroy({
      where: { id: req.params.id }
    });
    res.redirect('/employees?message=Employee deleted successfully&type=success');
  } catch (error) {
    res.redirect('/employees?message=Error deleting employee&type=error');
  }
});

module.exports = router;
