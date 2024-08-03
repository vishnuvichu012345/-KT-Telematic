const express = require('express');
const router = express.Router();
const { Asset, AssetCategory, Issue, Employee,ReturnAsset  } = require('../models');

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




// Fetch all required data and render the issue page
router.get('/issue', async (req, res) => {
  try {
    const assets = await Asset.findAll({ attributes: ['id', 'model', 'uniqueId'] });
    const issuedAssets = await Issue.findAll({ attributes: ['assetId'], raw: true });
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);
    const availableAssets = assets.filter(asset => !issuedAssetIds.includes(asset.id));
    const employees = await Employee.findAll({ attributes: ['id', 'employeeId', 'name'] });
    const issues = await Issue.findAll({
      attributes: ['id', 'assetId', 'employeeId', 'issueDate'],
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

// Add a new issue
router.post('/issue/add', async (req, res) => {
  const { assetId, employeeId, issueDate } = req.body;
  try {
    await Issue.create({ assetId, employeeId, issueDate });
    await Asset.update({ status: 'Issued' }, { where: { id: assetId } });
    res.redirect('/assets/issue');
  } catch (error) {
    console.error('Error issuing asset:', error);
    res.status(500).send('Error issuing asset');
  }
});

// Delete an issue
router.delete('/issue/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await Issue.findByPk(id);
    if (issue) {
      await issue.destroy();
      await Asset.update({ status: 'Available' }, { where: { id: issue.assetId } });
      res.sendStatus(200);
    } else {
      res.status(404).send('Issue not found');
    }
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).send('Error deleting issue');
  }
});

// Render the edit issue page
router.get('/issue/edit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await Issue.findByPk(id, {
      include: [
        { model: Asset, attributes: ['model', 'uniqueId'] },
        { model: Employee, attributes: ['employeeId', 'name'] }
      ]
    });
    if (issue) {
      const assets = await Asset.findAll({ attributes: ['id', 'model', 'uniqueId'] });
      const employees = await Employee.findAll({ attributes: ['id', 'employeeId', 'name'] });
      res.render('editIssue', { issue, assets, employees });
    } else {
      res.status(404).send('Issue not found');
    }
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).send('Error loading edit page');
  }
});

router.post('/issue/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { assetId, employeeId, issueDate } = req.body;
  try {
    const issue = await Issue.findByPk(id);
    if (issue) {
      await issue.update({ assetId, employeeId, issueDate });
      res.redirect('/assets/issue');
    } else {
      res.status(404).send('Issue not found');
    }
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).send('Error updating issue');
  }
});

// GET request to render the Return Asset page
router.get('/returndata', async (req, res) => {
  try {
    // Fetch all issued records
    const issuedRecords = await Issue.findAll({
      attributes: ['assetId', 'employeeId'],
      include: [
        { model: Asset, attributes: ['id', 'model', 'uniqueId'] },
        { model: Employee, attributes: ['id', 'employeeId', 'name'] }
      ]
    });

    // Extract unique assets and employees from issued records
    const issuedAssets = issuedRecords.map(record => record.Asset);
    const issuedEmployees = issuedRecords.map(record => record.Employee);

    // Fetch returned records for displaying in the table
    const returns = await ReturnAsset.findAll({
      attributes: ['assetId', 'employeeId', 'returnDate', 'returnReason'],
      include: [
        { model: Asset, attributes: ['model', 'uniqueId'] },
        { model: Employee, attributes: ['employeeId', 'name'] }
      ]
    });

    res.render('returna', { assets: issuedAssets, employees: issuedEmployees, returns });
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).send('Error loading data');
  }
});


// POST request to add a new return
router.post('/returndata/add', async (req, res) => {
  const { assetId, employeeId, returnDate, returnReason } = req.body;
  try {
    // Create a new return record
    await ReturnAsset.create({ assetId, employeeId, returnDate, returnReason });
    
    // Update the status of the asset to 'Available'
    await Asset.update({ status: 'Available' }, { where: { id: assetId } });
    
    res.redirect('/assets/returndata');
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).send('Error processing return');
  }
});


// DELETE request to remove a return record
router.delete('/returndata/:id/delete', async (req, res) => {
  try {
    const returnId = req.params.id;
    
    // Delete the return record
    await ReturnAsset.destroy({ where: { id: returnId } });
    
    // Redirect back to the return asset page
    res.redirect('/assets/returndata');
  } catch (error) {
    console.error('Error deleting return record:', error);
    res.status(500).send('Error deleting return record');
  }
});


// GET request to render the edit form for a return record
router.get('/returndata/:id/edit', async (req, res) => {
  try {
    const returnId = req.params.id;

    // Fetch the return record by ID
    const returnRecord = await ReturnAsset.findByPk(returnId, {
      include: [
        { model: Asset, attributes: ['id', 'model', 'uniqueId'] },
        { model: Employee, attributes: ['id', 'employeeId', 'name'] }
      ]
    });

    if (!returnRecord) {
      return res.status(404).send('Return record not found');
    }

    // Fetch all assets and employees for the form dropdowns
    const assets = await Asset.findAll();
    const employees = await Employee.findAll();

    res.render('editReturn', { returnRecord, assets, employees });
  } catch (error) {
    console.error('Error loading return record for editing:', error);
    res.status(500).send('Error loading return record for editing');
  }
});

// POST request to update a return record
router.post('/returndata/:id/edit', async (req, res) => {
  const returnId = req.params.id;
  const { assetId, employeeId, returnDate, returnReason } = req.body;
  
  try {
    // Update the return record
    await ReturnAsset.update({ assetId, employeeId, returnDate, returnReason }, {
      where: { id: returnId }
    });
    
    res.redirect('/assets/returndata');
  } catch (error) {
    console.error('Error updating return record:', error);
    res.status(500).send('Error updating return record');
  }
});


module.exports = router;
