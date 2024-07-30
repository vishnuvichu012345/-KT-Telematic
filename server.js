const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;


app.set('view engine', 'pug');
app.set('views', './views');
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const home = require('./Routes/homes');
const employeeRoutes = require('./Routes/EmployeeRoutes');
const assetRoutes = require('./Routes/AssetRoutes');
const assetCategoryRoutes = require('./Routes/assetCategories');





app.use('/employees', employeeRoutes);
app.use('/assets', assetRoutes);
app.use('/assetCategories', assetCategoryRoutes);
app.use('/', home);
// app.use('/stock', stockRouter);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
