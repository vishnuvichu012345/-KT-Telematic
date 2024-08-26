const express = require('express');
const router = express.Router();
const { Employee } = require('../models');
const amqp = require('amqplib/callback_api');

// Add/Edit/View Employees
router.get('/', async (req, res) => {
  const employees = await Employee.findAll();
  const message = req.query.message || '';
  const type = req.query.type || '';
  res.render('employee', { employees, message, type });
});


router.post('/add', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);

    // Publish a message to RabbitMQ
    amqp.connect('amqp://localhost', (error0, connection) => {
      if (error0) {
        throw error0;
      }
      connection.createChannel((error1, channel) => {
        if (error1) {
          throw error1;
        }

        const queue = 'employee_notifications';
        const message = JSON.stringify({
          email: employee.email,
          name: employee.name,
          employeeId: employee.employeeId
        });

        channel.assertQueue(queue, {
          durable: false
        });

        channel.sendToQueue(queue, Buffer.from(message));
        console.log(" [x] Sent '%s'", message);
      });

      setTimeout(() => {
        connection.close();
      }, 500);
    });

    res.redirect('/employees?message=Employee added successfully&type=success');
  } catch (error) {
    res.redirect('/employees?message=Error adding employee&type=error');
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
