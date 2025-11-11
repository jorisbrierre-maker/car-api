require('dotenv').config(); // Doit être tout en haut
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// On importe tout depuis le contrôleur
const carsController = require('./controllers/usersControllers');
const { carValidationRules, validate } = require('./controllers/usersControllers'); 
const checkApiKey = require('./middleware/checkApiKey');

const app = express();
// Utilise le PORT du fichier .env, ou 3000 par défaut
const PORT = process.env.PORT || 3000; 

// Middlewares
app.use(cors());
app.use(bodyParser.json()); 

// Route de bienvenue
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API de gestion de voitures classiques',
    version: '1.0.0',
    endpoints: {
      getAllCars: 'GET /api/cars',
      searchCars: 'GET /api/cars/search',
      getFavoriteCars: 'GET /api/cars/favorites', // Route des favoris
      getCarById: 'GET /api/cars/:id',
      createCar: 'POST /api/cars',
      updateCar: 'PUT /api/cars/:id',
      deleteCar: 'DELETE /api/cars/:id'
    }
  });
});

// Routes CRUD (protégées par le middleware)
app.get('/api/cars', checkApiKey, carsController.getAllCars);
app.get('/api/cars/search', checkApiKey, carsController.searchCars);
app.get('/api/cars/favorites', checkApiKey, carsController.getFavoriteCars); // Route des favoris
app.get('/api/cars/:id', checkApiKey, carsController.getCarById);

// Routes avec validation
app.post('/api/cars', checkApiKey, carValidationRules, validate, carsController.createCar);
app.put('/api/cars/:id', checkApiKey, carValidationRules, validate, carsController.updateCar);

app.delete('/api/cars/:id', checkApiKey, carsController.deleteCar);

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas` 
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});