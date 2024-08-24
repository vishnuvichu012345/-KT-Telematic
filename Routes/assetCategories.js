const express = require('express');
const router = express.Router();
const { AssetCategory } = require('../models');

// Get all asset categories
router.get('/', async (req, res) => {
  try {
    const categories = await AssetCategory.findAll();
    const message = req.query.message || '';
    const type = req.query.type || '';
    res.render('assetCategory', { categories, message, type });
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.redirect('/assetCategories?message=Error fetching asset categories&type=error');
  }
});

// Add a new asset category
router.post('/add', async (req, res) => {
  try {
    const { name, description } = req.body;
    await AssetCategory.create({ name, description });
    res.redirect('/assetCategories?message=Asset category added successfully&type=success');
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
  } catch (error) {
    console.error('Error deleting asset category:', error);
    res.redirect('/assetCategories?message=Error deleting asset category&type=error');
  }
});

module.exports = router;
