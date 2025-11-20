const request = require('supertest');
const app = require('../app'); // Notre application
const db = require('../database');

// Variables globales pour les tests
let token; // Stockera notre token JWT
let testCarId; // Stockera l'ID de la voiture que nous allons créer

// On définit l'utilisateur de test UNE SEULE FOIS
const testUser = {
  username: `car_test_user_${Date.now()}`,
  password: 'password123'
};

// Ferme la connexion à la BDD après tous les tests
afterAll((done) => {
  db.close(done);
});

// --- D'ABORD: S'AUTHENTIFIER ---
describe('Auth for Cars Tests', () => {
  it('devrait s\'inscrire et se connecter pour obtenir un token', async () => {
    // 1. S'inscrire (avec l'utilisateur défini)
    await request(app)
      .post('/auth/register')
      .send(testUser); // On utilise le testUser

    // 2. Se connecter (avec le MÊME utilisateur)
    const res = await request(app)
      .post('/auth/login')
      .send(testUser); // On utilise le testUser

    // 3. Stocker le token pour les tests suivants
    token = res.body.token; 
    expect(token).toBeDefined(); // Ce test devrait maintenant passer
  });
});

// --- ENSUITE: TESTER LES ROUTES 'CARS' ---
describe('Cars Endpoints', () => {

  // Test 1: Échec sans token
  it('devrait refuser l\'accès à GET /api/cars sans token (401)', async () => {
    const res = await request(app)
      .get('/api/cars');
      
    expect(res.statusCode).toEqual(401);
  });

  // Test 2: Succès avec token (CE TEST PASSERA MAINTENANT)
  it('devrait autoriser l\'accès à GET /api/cars avec un token (200)', async () => {
    const res = await request(app)
      .get('/api/cars')
      .set('Authorization', `Bearer ${token}`); 
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Test 3: Échec de création (données invalides)
  it('devrait refuser la création POST /api/cars avec données invalides (400)', async () => {
    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${token}`)
      .send({
        brand: 'Test',
        model: 'TestModel'
        // 'year' est manquant
      });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Données invalides');
  });

  // Test 4: Succès de création
  it('devrait créer une nouvelle voiture POST /api/cars (201)', async () => {
    const newCar = {
      brand: 'TestCar',
      model: 'Jest',
      year: 2025,
      price: 10000,
      category: 'Test'
    };
    
    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${token}`)
      .send(newCar);
      
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.brand).toBe('TestCar');
    
    testCarId = res.body.data.id; 
  });

  // Test 5: Récupérer la voiture créée
  it('devrait récupérer la voiture spécifique GET /api/cars/:id (200)', async () => {
    const res = await request(app)
      .get(`/api/cars/${testCarId}`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.id).toBe(testCarId);
  });

  // Test 6: Supprimer la voiture créée
  it('devrait supprimer la voiture DELETE /api/cars/:id (200)', async () => {
    const res = await request(app)
      .delete(`/api/cars/${testCarId}`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  // Test 7: Vérifier que la voiture est bien supprimée
  it('devrait renvoyer 404 pour une voiture supprimée (404)', async () => {
    const res = await request(app)
      .get(`/api/cars/${testCarId}`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(404);
  });

});