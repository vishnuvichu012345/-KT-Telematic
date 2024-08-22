const express = require('express');
const router = express.Router();
const { Asset, AssetCategory, Issue, Employee,Returndata,ScrapAsset  } = require('../models');

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
    console.log("Fetching all assets...");
    const assets = await Asset.findAll();
    console.log("Fetched assets:", assets);

    const issuedAssets = await Issue.findAll({
      attributes: ['assetId'],
      raw: true
    });

    const scrappedAssets = await ScrapAsset.findAll({
      attributes: ['assetId'],
      raw: true
    });

    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);
    const scrappedAssetIds = scrappedAssets.map(scrap => scrap.assetId);

    const stock = assets.filter(asset => 
      !issuedAssetIds.includes(asset.id) && !scrappedAssetIds.includes(asset.id)
    );

    const stockByBranch = stock.reduce((acc, asset) => {
      const branch = asset.location; 
      if (!acc[branch]) {
        acc[branch] = { totalAssets: 0, totalValue: 0 };
      }
      acc[branch].totalAssets += 1;
      acc[branch].totalValue += asset.cost || 0;
      return acc;
    }, {});

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
    const assetsInBranch = await Asset.findAll({
      where: { location: branch }
    });

    const issuedAssets = await Issue.findAll({
      include: [{ model: Asset, attributes: ['id', 'location'] }],
      where: { '$Asset.location$': branch }
    });

    const scrappedAssets = await ScrapAsset.findAll({
      attributes: ['assetId'],
      raw: true
    });

    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);
    const scrappedAssetIds = scrappedAssets.map(scrap => scrap.assetId);

    const availableAssets = assetsInBranch.filter(asset => 
      !issuedAssetIds.includes(asset.id) && !scrappedAssetIds.includes(asset.id)
    );

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
    // Fetch all assets
    const assets = await Asset.findAll();
    console.log('All Assets:', assets.map(asset => asset.toJSON())); // Log all assets in a readable format

    // Fetch all employees
    const employees = await Employee.findAll({
      attributes: ['id', 'employeeId', 'name']
    });
    console.log('Employees:', employees.map(employee => employee.toJSON())); // Log employees

    // Fetch all issues with associated assets and employees
    const issues = await Issue.findAll({
      include: [
        { model: Asset },
        { model: Employee }
      ]
    });
    
    console.log('Issues:', issues.map(issue => issue.toJSON())); // Log issues

    res.render('issue', { assets, employees, issues });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});




router.post('/issue/add', async (req, res) => {
  let { assetId, employeeId, issueDate } = req.body;
  
  // Ensure issueDate is a single date string
  if (Array.isArray(issueDate)) {
    issueDate = issueDate[0]; // Assuming you want the first date in the array
  }
  
  // Sanitize and validate assetId and employeeId
  assetId = parseInt(assetId, 10);
  employeeId = parseInt(employeeId, 10);
  
  if (isNaN(assetId) || isNaN(employeeId)) {
    return res.status(400).send('Invalid assetId or employeeId');
  }
  
  try {
    const sanitizedIssueDate = new Date(issueDate).toISOString(); // Ensure proper date format
    
    // Create issue record
    await Issue.create({ assetId, employeeId, issueDate: sanitizedIssueDate });
    // Update asset status
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
      await issue.destroy({ where: { id: issue.assetId } });
      res.sendStatus(200);
    } else {
      res.status(404).send('Issue not found');
    }
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).send('Error deleting issue');
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





router.get('/return', async (req, res) => {
  try {
    // Fetch all assets
    const assets = await Asset.findAll();
    console.log('All Assets:', assets.map(asset => asset.toJSON())); // Log all assets in a readable format

    // Fetch all employees
    const employees = await Employee.findAll();
    console.log('Employees:', employees.map(employee => employee.toJSON())); // Log employees

    // Fetch all issues with associated assets and employees
    const issues = await Issue.findAll({
      include: [
        { model: Asset },
        { model: Employee }
      ]
    });
    console.log('Issues:', issues.map(issue => issue.toJSON())); // Log issues

    // Extract asset IDs from issues
    const issuedAssetIds = issues.map(issue => issue.assetId);

    // Filter assets to include only those that are issued
    const issuedAssets = assets.filter(asset => issuedAssetIds.includes(asset.id));
    console.log('Issued Assets:', issuedAssets.map(asset => asset.toJSON())); // Log issued assets

    // Fetch all returns
    const returns = await Returndata.findAll({
      include: [
        { model: Asset },
        { model: Employee }
      ]
    });

    res.render('returna', { assets: issuedAssets, employees, returns });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});




// Add a new return
router.post('/return/add', async (req, res) => {
  const { assetId, employeeId, returnDate, returnReason } = req.body;
  try {
    await Returndata.create({ assetId, employeeId, returnDate, returnReason });
    await Asset.update({ status: 'Available' }, { where: { id: assetId } });
    res.redirect('/assets/return');
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).send('Error returning asset');
  }
});

// Delete a return
router.delete('/return/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const returnRecord = await Returndata.findByPk(id);
    if (returnRecord) {
      await returnRecord.destroy();
      await Asset.update({ status: 'Issued' }, { where: { id: returnRecord.assetId } });
      res.sendStatus(200);
    } else {
      res.status(404).send('Returndata not found');
    }
  } catch (error) {
    console.error('Error deleting return:', error);
    res.status(500).send('Error deleting return');
  }
});


// Update a return
router.post('/return/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { assetId, employeeId, returnDate, returnReason } = req.body;
  try {
    const returnRecord = await Returndata.findByPk(id);
    if (returnRecord) {
      await returnRecord.update({ assetId, employeeId, returnDate, returnReason });
      res.redirect('/assets/return');
    } else {
      res.status(404).send('Return not found');
    }
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(500).send('Error updating return');
  }
});


router.get('/history', async (req, res) => {
  try {
    const assets = await Asset.findAll({
      include: [
        { model: Issue, include: [Employee] },
        { model: Returndata },
        { model: ScrapAsset },
      ],
    });

    // Log the assets with detailed structure
    console.log("===========================================================");
    assets.forEach(asset => {
      console.log("Asset ID:", asset.id);
      console.log("Issues:", JSON.stringify(asset.Issues, null, 2));
      console.log("Returndata:", JSON.stringify(asset.Returndata, null, 2));
      console.log("ScrapAssets:", JSON.stringify(asset.ScrapAssets, null, 2));
    });

    res.render('assetHistory', { assets });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to get history for a specific asset
router.get('/history/:id', async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Issue,
          include: [Employee] // Ensure issues include the Employee data
        },
        Returndata,
        ScrapAsset,
      ],
    });
    res.json({ asset });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


module.exports = router;
