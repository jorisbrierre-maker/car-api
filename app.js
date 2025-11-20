require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// --- Contrôleurs ---
const carsController = require('./controllers/usersControllers');
const authController = require('./controllers/authController');
const { carValidationRules, validate } = require('./controllers/usersControllers'); 

// --- Middlewares ---
const authenticateToken = require('./middleware/authenticateToken');
const upload = require('./middleware/upload');

const app = express();

// --- Middlewares Globaux ---
app.use(cors());
app.use(bodyParser.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES PUBLIQUES (Authentification) ---
app.post('/auth/register', authController.register);
app.post('/auth/login', authController.login);

// --- ROUTES PROTÉGÉES (API Principale) ---

// Route de bienvenue (protégée)
app.get('/', authenticateToken, (req, res) => {
  res.json({ 
    message: `Bienvenue sur l'API, ${req.user.username}!`,
    version: '1.0.0',
    endpoints: { /* ... */ }
  });
});

// Routes CRUD (protégées par JWT)
app.get('/api/cars', authenticateToken, carsController.getAllCars);
app.get('/api/cars/search', authenticateToken, carsController.searchCars);
app.get('/api/cars/favorites', authenticateToken, carsController.getFavoriteCars);
app.get('/api/cars/:id', authenticateToken, carsController.getCarById);

// Routes avec validation (protégées par JWT)
app.post('/api/cars', authenticateToken, carValidationRules, validate, carsController.createCar);
app.put('/api/cars/:id', authenticateToken, carValidationRules, validate, carsController.updateCar);

// Route d'upload (protégée par JWT)
app.post(
  '/api/cars/:id/upload', 
  authenticateToken, 
  upload.single('carImage'), 
  carsController.uploadCarImage
);

app.delete('/api/cars/:id', authenticateToken, carsController.deleteCar);

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas` 
  });
});

// Exporter l'application pour les tests et pour le serveur
module.exports = app;