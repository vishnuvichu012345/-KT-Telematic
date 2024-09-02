const express = require('express');
const router = express.Router();
const { AssetCategory,Asset } = require('../models');
const { Sequelize } = require('sequelize');
const redisClient = require('../config/redisClient');


// Get all asset categories
router.get('/', async (req, res) => {
  redisClient.get('AssetCat', async (err, AssetCatData) => {

    if (err) {
      console.error('Redis GET error:', err);
      return res.status(500).send('Internal Server Error');
    }
    if (AssetCatData) {
      try {
        const categories = JSON.parse(AssetCatData); // Directly parse the array of employees
        console.log('Parsed Data:', categories);  // Logs the employee array

        const message = req.query.message || '';
        const type = req.query.type || '';

        return res.render('assetCategory', { categories, message, type });
      } catch (parseError) {
        console.error('Error parsing cached data:', parseError);
        return res.status(500).send('Internal Server Error');
      }
    }else{

      try {
        console.log('Cache miss. Fetching from database...');
        const categories = await AssetCategory.findAll();
        const message = req.query.message || '';
        const type = req.query.type || '';

        redisClient.setex('AssetCat', 3600, JSON.stringify(categories)); // Cache the employee array directly
        res.render('assetCategory', { categories, message, type });
      } catch (error) {
        console.error('Error fetching asset categories:', error);
        res.redirect('/assetCategories?message=Error fetching asset categories&type=error');
      }
    }

});
});

// Add a new asset category
router.post('/add', async (req, res) => {
  try {
    const { name, description } = req.body;
    await AssetCategory.create({ name, description });
    res.redirect('/assetCategories?message=Asset category added successfully&type=success');
    await redisClient.del('AssetCat');

  } catch (error) {
    console.error('Error adding asset category:', error);
    res.redirect('/assetCategories?message=Error adding asset category&type=error');
  }
});

// Edit an asset category
router.post('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    await AssetCategory.update({ name, description }, { where: { id } });
    await redisClient.del('AssetCat');
    res.redirect('/assetCategories?message=Asset category updated successfully&type=success');
  } catch (error) {
    console.error('Error updating asset category:', error);
    res.redirect('/assetCategories?message=Error updating asset category&type=error');
  }
});

// Delete an asset category
router.get('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await AssetCategory.destroy({ where: { id } });
    res.redirect('/assetCategories?message=Asset category deleted successfully&type=success');
    await redisClient.del('AssetCat');

  } catch (error) {
    console.error('Error deleting asset category:', error);
    res.redirect('/assetCategories?message=Error deleting asset category&type=error');
  }
});




router.get('/asset-categories', async (req, res) => {
  try {
    const categories = await AssetCategory.findAll({
      attributes: [
        'name',
        [Sequelize.fn('COUNT', Sequelize.col('assets.id')), 'assetCount']
      ],
      include: [{
        model: Asset,
        as: 'assets',
        attributes: []
      }],
      group: ['AssetCategory.id']
    });

    res.json(categories); // Send the data as JSON response
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
