const express = require('express');
const router = express.Router();
const { Employee } = require('../models');
const amqp = require('amqplib/callback_api');
const redisClient = require('../config/redisClient');


// Add/Edit/View Employees
router.get('/', async (req, res) => {
  redisClient.get('employee', async (err, employeeData) => {
    if (err) {
      console.error('Redis GET error:', err);
      return res.status(500).send('Internal Server Error');
    }

    if (employeeData) {
      try {
        const employees = JSON.parse(employeeData); // Directly parse the array of employees
        console.log('Parsed Data:', employees);  // Logs the employee array

        const message = req.query.message || '';
        const type = req.query.type || '';

        return res.render('employee', { employees, message, type });
      } catch (parseError) {
        console.error('Error parsing cached data:', parseError);
        return res.status(500).send('Internal Server Error');
      }
    } else {
      try {
        console.log('Cache miss. Fetching from database...');
        const employees = await Employee.findAll();
        const message = req.query.message || '';
        const type = req.query.type || '';

        redisClient.setex('employee', 3600, JSON.stringify(employees)); // Cache the employee array directly
        return res.render('employee', { employees, message, type });
      } catch (dbError) {
        console.error('Error fetching employees from the database:', dbError);
        return res.status(500).send('Internal Server Error');
      }
    }
  });
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
    await redisClient.del('employee');
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
    await redisClient.del('employee');
    res.redirect('/employees?message=Employee deleted successfully&type=success');
  } catch (error) {
    res.redirect('/employees?message=Error deleting employee&type=error');
  }
});



// Route to handle the form submission and update employee details
router.post('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    await Employee.update(updatedData, {
      where: { id: id }
    });

    // Clear the cache
    await redisClient.del('employee');

    res.redirect('/employees?message=Employee updated successfully&type=success');
  } catch (error) {
    console.error('Error updating employee:', error);
    res.redirect('/employees?message=Error updating employee&type=error');
  }
});



module.exports = router;
