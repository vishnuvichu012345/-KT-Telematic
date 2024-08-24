const express = require('express');
const router = express.Router();
const { Asset, ScrapAsset, Issue } = require('../models');

// GET request to render the Scrap Asset page
router.get('/', async (req, res) => {
  try {
    // Fetch all assets
    const assets = await Asset.findAll();

    // Fetch all issued and scrapped assets
    const issuedAssets = await Issue.findAll({ attributes: ['assetId'], raw: true });
    const scrappedAssets = await ScrapAsset.findAll({ attributes: ['assetId'], raw: true });

    // Extract IDs of issued and scrapped assets
    const issuedAssetIds = issuedAssets.map(issue => issue.assetId);
    const scrappedAssetIds = scrappedAssets.map(scrap => scrap.assetId);

    // Filter out assets that are either issued or scrapped
    const availableAssets = assets.filter(asset => 
      !issuedAssetIds.includes(asset.id) && !scrappedAssetIds.includes(asset.id)
    );

    // Fetch all scraps to display in the table, including associated Asset data
    const scraps = await ScrapAsset.findAll({
      attributes: ['id', 'assetId', 'scrapDate', 'scrapReason'],
      include: [{ model: Asset, attributes: ['model', 'uniqueId'] }]
    });

    // Extract message and type from query parameters
    const message = req.query.message || '';
    const type = req.query.type || '';

    res.render('scrap', { assets: availableAssets, scraps, message, type });
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

    res.redirect('/assets/scrap?message=Asset scrapped successfully&type=success');
  } catch (error) {
    console.error('Error processing scrap:', error);
    res.redirect('/assets/scrap?message=Error scrapping asset&type=error');
  }
});

// POST request to update a scrap
router.post('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { assetId, scrapDate, scrapReason } = req.body;
  try {
    // Update the scrap record
    await ScrapAsset.update({ assetId, scrapDate, scrapReason }, { where: { id } });

    res.redirect('/assets/scrap?message=Scrap updated successfully&type=success');
  } catch (error) {
    console.error('Error updating scrap:', error);
    res.redirect('/assets/scrap?message=Error updating scrap&type=error');
  }
});

// POST request to delete a scrap
router.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Find the scrap record
    const scrap = await ScrapAsset.findByPk(id);
    if (scrap) {
      // Delete the scrap record
      await scrap.destroy();

      // Update the status of the asset to 'Available'
      await Asset.update({ status: 'Available' }, { where: { id: scrap.assetId } });

      res.redirect('/assets/scrap?message=Scrap deleted successfully&type=success');
    } else {
      res.redirect('/assets/scrap?message=Scrap not found&type=error');
    }
  } catch (error) {
    console.error('Error deleting scrap:', error);
    res.redirect('/assets/scrap?message=Error deleting scrap&type=error');
  }
});

module.exports = router;
