const express = require('express');
const router = express.Router();
const { Asset, AssetCategory, Issue, Employee,ReturnAssets } = require('../models');

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
    // Fetch all assets
    const assets = await Asset.findAll({ attributes: ['id', 'model', 'uniqueId'] });

    // Fetch all issued assets
    const issuedAssets = await Issue.findAll({
      attributes: ['assetId'],
      raw: true
    });

    // Get asset IDs that are issued
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);

    // Filter out issued assets
    const availableAssets = assets.filter(asset => !issuedAssetIds.includes(asset.id));

    // Fetch employees
    const employees = await Employee.findAll({ attributes: ['id', 'employeeId', 'name'] });

    // Fetch issued records for displaying in the table
    const issues = await Issue.findAll({
      attributes: ['assetId', 'employeeId', 'issueDate'],
      include: [
        { model: Asset, attributes: ['model', 'uniqueId'] },
        { model: Employee, attributes: ['employeeId', 'name'] }
      ]
    });

    res.render('issue', { assets: availableAssets, employees, issues });
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).send('Error loading data');
  }
});


router.post('/issue/add', async (req, res) => {
  const { assetId, employeeId, issueDate } = req.body;
  try {
    // Create a new issue record
    await Issue.create({ assetId, employeeId, issueDate });
    
    // Update the status of the asset
    await Asset.update({ status: 'Issued' }, { where: { id: assetId } });
    
    res.redirect('/assets/issue');
  } catch (error) {
    console.log("errror =====",error)
    res.status(500).send('Error issuing asset',error);
  }
});

router.get('/stock', async (req, res) => {
  try {
    // Fetch all assets
    console.log("Fetching all assets...");
    const assets = await Asset.findAll();
    console.log("Fetched assets:", assets);

    // Fetch all issued assets
    const issuedAssets = await Issue.findAll({
      attributes: ['assetId'],
      raw: true
    });

    // Get asset IDs that are issued
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);

    // Filter out issued assets
    const stock = assets.filter(asset => !issuedAssetIds.includes(asset.id));

    // Compute stock totals for each branch
    const stockByBranch = stock.reduce((acc, asset) => {
      const branch = asset.location; // Ensure 'location' corresponds to the branch field
      if (!acc[branch]) {
        acc[branch] = { totalAssets: 0, totalValue: 0 };
      }
      acc[branch].totalAssets += 1;
      acc[branch].totalValue += asset.cost || 0;
      return acc;
    }, {});

    // Convert the aggregated stock data to an array
    const stocks = Object.keys(stockByBranch).map(branch => ({
      branch,
      totalAssets: stockByBranch[branch].totalAssets,
      totalValue: stockByBranch[branch].totalValue
    }));

    res.render('stock', { stocks });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/stock/details', async (req, res) => {
  const { branch } = req.body;
  try {
    // Fetch all assets for the selected branch
    const assetsInBranch = await Asset.findAll({
      where: { location: branch }
    });

    // Fetch all issued assets for the selected branch
    const issuedAssets = await Issue.findAll({
      include: [{ model: Asset, attributes: ['id', 'location'] }],
      where: { '$Asset.location$': branch }
    });

    // Get asset IDs that are issued
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);

    // Filter out issued assets
    const availableAssets = assetsInBranch.filter(asset => !issuedAssetIds.includes(asset.id));

    // Convert the available assets to a format suitable for DataTables
    const assetDetails = availableAssets.map(asset => ({
      serialNumber: asset.serialNumber,
      uniqueId: asset.uniqueId,
      make: asset.make,
      model: asset.model,
      status: asset.status,
      location: asset.location,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toDateString() : '',
      cost: asset.cost || 0
    }));

    res.json(assetDetails);
  } catch (error) {
    console.error("Error fetching asset details:", error);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = router;
