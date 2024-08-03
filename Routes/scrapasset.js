const express = require('express');
const router = express.Router();
const { Asset, ScrapAsset,Issue } = require('../models');

// GET request to render the Scrap Asset page
// GET request to render the Scrap Asset page
router.get('/', async (req, res) => {
  try {
    // Fetch all assets
    const assets = await Asset.findAll();

    // Fetch all issued assets
    const issuedAssets = await Issue.findAll({
      attributes: ['assetId'],
      raw: true
    });

    // Fetch all scrapped assets
    const scrappedAssets = await ScrapAsset.findAll({
      attributes: ['assetId'],
      raw: true
    });

    // Get asset IDs that are issued or scrapped
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);
    const scrappedAssetIds = scrappedAssets.map(scrap => scrap.assetId);

    // Filter out issued and scrapped assets
    const availableAssets = assets.filter(asset => 
      !issuedAssetIds.includes(asset.id) && !scrappedAssetIds.includes(asset.id)
    );

    // Fetch all scraps to display in the table, including associated Asset data
    const scraps = await ScrapAsset.findAll({
      attributes: ['id', 'assetId', 'scrapDate', 'scrapReason'],
      include: [{ model: Asset, attributes: ['model', 'uniqueId'] }]
    });

    // Log data for debugging
    console.log('Available Assets:', availableAssets);
    console.log('Scraps Data:', scraps);

    res.render('scrap', { assets: availableAssets, scraps });
  } catch (error) {
    console.error('Error loading data:', error);
    res.status(500).send('Error loading data');
  }
});



// POST request to add a new scrap
router.post('/add', async (req, res) => {
  const { assetId, scrapDate, scrapReason } = req.body;
  try {
    // Create a new scrap record
    await ScrapAsset.create({ assetId, scrapDate, scrapReason });

    // Update the status of the asset to 'Scrapped'
    await Asset.update({ status: 'Scrapped' }, { where: { id: assetId } });

    res.redirect('/assets/scrap');
  } catch (error) {
    console.error('Error processing scrap:', error);
    res.status(500).send('Error processing scrap');
  }
});

// POST request to update a scrap
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { assetId, scrapDate, scrapReason } = req.body;
  try {
    // Update the scrap record
    await ScrapAsset.update({ assetId, scrapDate, scrapReason }, { where: { id } });

    res.redirect('/assets/scrap');
  } catch (error) {
    console.error('Error updating scrap:', error);
    res.status(500).send('Error updating scrap');
  }
});

// POST request to delete a scrap
router.post('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Delete the scrap record
    const scrap = await ScrapAsset.findByPk(id);
    if (scrap) {
      await scrap.destroy();

      // Update the status of the asset to 'Available'
      await Asset.update({ status: 'Available' }, { where: { id: scrap.assetId } });
    }

    res.redirect('/assets/scrap');
  } catch (error) {
    console.error('Error deleting scrap:', error);
    res.status(500).send('Error deleting scrap');
  }
});

module.exports = router;
