// routes/scrapasset.js
const express = require('express');
const router = express.Router();
const { Asset, ScrapAsset } = require('../models');

// GET request to render the Scrap Asset page
router.get('/', async (req, res) => {
  try {
    const assets = await Asset.findAll({attributes: ['id', 'model', 'uniqueId'] });
    const scraps = await ScrapAsset.findAll({
      attributes: ['id', 'assetId', 'scrapDate', 'scrapReason'],
      include: [{ model: Asset, attributes: ['model', 'uniqueId'] }]
    });

    res.render('scrap', { assets, scraps });
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
