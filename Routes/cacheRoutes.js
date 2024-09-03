// routes/cacheRoutes.js
const express = require('express');
const router = express.Router();
const redisClient = require('../config/redisClient'); // Adjust path as needed

router.get('/cache', async (req, res) => {
    try {
        redisClient.get('employee', (err, employeeData) => {
            if (err) {
                console.error('Redis GET error:', err);
                return res.status(500).send('Error fetching cache data');
            }
            
            if (employeeData) {
                res.json({ cache: JSON.parse(employeeData) });
            } else {
                res.json({ cache: null, message: 'No data found in cache' });
            }
        });
    } catch (error) {
        console.error('Error fetching cache:', error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router;
