const express = require('express');
const router = express.Router();
const { AssetCategory } = require('../models');

// Get all asset categories
router.get('/', async (req, res) => {
    const categories = await AssetCategory.findAll();
    res.render('assetCategory', { categories });
});

// Add a new asset category
router.post('/add', async (req, res) => {
    await AssetCategory.create(req.body);
    res.redirect('/assetCategories');
});

// Other routes for edit, view, etc.

module.exports = router;
