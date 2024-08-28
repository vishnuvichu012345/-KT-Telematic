const express = require('express');
const router = express.Router();
const { Asset, AssetCategory, Issue, Employee,Returndata,ScrapAsset  } = require('../models');
const amqp = require('amqplib/callback_api');
// const client = require('../config/redisClient'); 
const { Op } = require('sequelize');


// Add/Edit/View Assets
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.findAll({ 
      include: { model: AssetCategory, as: 'category' } 
    });
    const categories = await AssetCategory.findAll();
    const message = req.query.message || null;
    const type = req.query.type || null;
    res.render('asset', { assets, categories, message, type });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




router.post('/add', async (req, res) => {
  try {
    await Asset.create(req.body);
    res.redirect('/assets?message=Asset added successfully&type=success');
  } catch (error) {
    console.error(error);
    res.redirect('/assets?message=Error adding asset&type=error');
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
      return res.redirect('/assets?message=Invalid date format&type=error');
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

    res.redirect('/assets?message=Asset updated successfully&type=success');
  } catch (error) {
    console.error('Error updating asset:', error);
    res.redirect('/assets?message=Error updating asset&type=error');
  }
});

// Delete asset
router.get('/delete/:id', async (req, res) => {
  try {
    await Asset.destroy({
      where: { id: req.params.id }
    });
    res.redirect('/assets?message=Asset deleted successfully&type=success');
  } catch (error) {
    console.error(error);
    res.redirect('/assets?message=Error deleting asset&type=error');
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
    const allAssets = await Asset.findAll({
      where: {
        status: { [Op.ne]: 'Scrapped' } // Assuming 'status' field indicates if an asset is scrapped
      }
    });

    // Fetch all issued assets
    const issuedAssets = await Issue.findAll({
      attributes: ['assetId'], // Assuming assetId is the foreign key in Issue model
    });

    // Create a set of issued asset IDs
    const issuedAssetIds = new Set(issuedAssets.map(issue => issue.assetId));

    // Filter out issued assets from all assets
    const availableAssets = allAssets.filter(asset => !issuedAssetIds.has(asset.id));

    // Fetch all employees
    const employees = await Employee.findAll({
      attributes: ['id', 'employeeId', 'name']
    });
    console.log('Employees:', employees.map(employee => employee.toJSON()));

    // Fetch all issues with associated assets and employees
    const issues = await Issue.findAll({
      include: [
        { model: Asset },
        { model: Employee }
      ]
    });
    console.log('Issues:', issues.map(issue => issue.toJSON()));

    const message = req.query.message || '';
    const type = req.query.type || '';
    res.render('issue', { assets: availableAssets, employees, issues, message, type });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.redirect('/assets/issues?message=Error fetching data&type=error');
  }
});





router.post('/issue/add', async (req, res) => {
  let { assetId, employeeId, issueDate } = req.body;

  console.log('Received data for add:', { assetId, employeeId, issueDate });

  if (Array.isArray(issueDate)) {
    issueDate = issueDate[0];
  }

  assetId = parseInt(assetId, 10);
  employeeId = parseInt(employeeId, 10);

  if (isNaN(assetId) || isNaN(employeeId)) {
    console.log('Invalid assetId or employeeId');
    return res.status(400).send('Invalid assetId or employeeId');
  }

  try {
    const sanitizedIssueDate = new Date(issueDate).toISOString();

    // Create the issue
    await Issue.create({ assetId, employeeId, issueDate: sanitizedIssueDate });
    await Asset.update({ status: 'Issued' }, { where: { id: assetId } });

    // Fetch employee details
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Publish a message to RabbitMQ
    amqp.connect('amqp://localhost', (error0, connection) => {
      if (error0) {
        throw error0;
      }
      connection.createChannel((error1, channel) => {
        if (error1) {
          throw error1;
        }

        const queue = 'asset_notifications';
        const message = JSON.stringify({
          email: employee.email,
          name: employee.name,
          assetId: assetId,
          issueDate: sanitizedIssueDate
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

    res.redirect('/assets/issue?message=Issue added successfully&type=success');
  } catch (error) {
    console.error('Error issuing asset:', error);
    res.redirect('/assets/issue?message=Error issuing asset&type=error');
  }
});





// Delete an issue
router.get('/issue/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const issue = await Issue.findByPk(id);
    if (issue) {
      await issue.destroy();
      res.redirect('/assets/issue?message=Issue deleted successfully&type=success');
    } else {
      res.status(404).redirect('/issues?message=Issue not found&type=error');
    }
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.redirect('/assets/issue?message=Error deleting issue&type=error');
  }
});

// Edit an issue
router.post('/issue/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { assetId, employeeId, issueDate } = req.body;
  try {
    const issue = await Issue.findByPk(id);
    if (issue) {
      await issue.update({ assetId, employeeId, issueDate });
      res.redirect('/assets/issue?message=Issue updated successfully&type=success');
    } else {
      res.status(404).redirect('/issues?message=Issue not found&type=error');
    }
  } catch (error) {
    console.error('Error updating issue:', error);
    res.redirect('/assets/issue?message=Error updating issue&type=error');
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




router.post('/return/add', async (req, res) => {
  const { assetId, employeeId, returnDate, returnReason } = req.body;
  try {
    // Add return data to Returndata table
    await Returndata.create({ assetId, employeeId, returnDate, returnReason });
    
    // Update the asset status to 'Available'
    await Asset.update({ status: 'Available' }, { where: { id: assetId } });
    
    // Remove the issue record from the Issue table
    await Issue.destroy({ where: { assetId: assetId, employeeId: employeeId } });
    
    res.redirect('/assets/issue?message=Asset returned successfully&type=success');
  } catch (error) {
    console.error('Error returning asset:', error);
    res.redirect('/assets/issue?message=Error returning asset&type=error');
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
