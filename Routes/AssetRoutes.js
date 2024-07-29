const express = require('express');
const router = express.Router();
const { Asset, AssetCategory, Issue, Employee } = require('../models');

// Add/Edit/View Assets
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.findAll({ 
      include: { model: AssetCategory, as: 'category' } 
    });
    const categories = await AssetCategory.findAll();
    res.render('asset', { assets, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/add', async (req, res) => {
  try {
    await Asset.create(req.body);
    res.redirect('/assets');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/edit/:id', async (req, res) => {
  try {
    const assetId = req.params.id;
    const { make, model, assetCategoryId, status, location, purchaseDate, cost } = req.body;
    
    // Parse and format the purchase date
    const formattedPurchaseDate = new Date(purchaseDate);
    if (isNaN(formattedPurchaseDate.getTime())) {
      console.error('Invalid date format:', purchaseDate);
      return res.status(400).send('Invalid date format');
    }
    
    // Update the asset in the database
    await Asset.update({
      make,
      model,
      assetCategoryId,
      status,
      location,
      purchaseDate: formattedPurchaseDate,
      cost
    }, {
      where: { id: assetId }
    });

    res.redirect('/assets');
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Delete asset
router.get('/delete/:id', async (req, res) => {
  try {
    await Asset.destroy({
      where: { id: req.params.id }
    });
    res.redirect('/assets');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/issue', async (req, res) => {
  try {
    const assets = await Asset.findAll();
    const employees = await Employee.findAll();
    res.render('issue', { assets, employees });
  } catch (error) {
    res.status(500).send('Error loading data');
  }
});

// Handle the Issue Asset form submission
router.post('/issue', async (req, res) => {
  const { assetId, employeeId, issueDate } = req.body;
  try {
    // Create a new issue record
    await Issue.create({ assetId, employeeId, issueDate });
    
    // Update the status of the asset
    await Asset.update({ status: 'Issued' }, { where: { id: assetId } });
    
    res.redirect('/assets/issue');
  } catch (error) {
    res.status(500).send('Error issuing asset');
  }
});

module.exports = router;
