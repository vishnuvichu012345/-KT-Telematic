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
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",req.body); // Log the request body
    const { name, description } = req.body;
    await AssetCategory.create({ name, description });
    res.redirect('/assetCategories');
});

router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    await AssetCategory.update({ name, description }, { where: { id } });
    res.redirect('/assetCategories');
});

// Delete an asset category
router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await AssetCategory.destroy({ where: { id } });
    res.redirect('/assetCategories');
});

module.exports = router;
