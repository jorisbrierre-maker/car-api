const request = require('supertest');
const app = require('../app'); // On importe notre app (depuis le dossier parent)
const db = require('../database');

// On ferme la connexion à la BDD après tous les tests
// pour éviter que Jest ne reste "bloqué"
afterAll((done) => {
  db.close(done);
});

describe('Auth Endpoints', () => {
  // On utilise un nom d'utilisateur aléatoire pour éviter les conflits
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'password123'
  };

  // Test 1: Inscription
  it('devrait inscrire un nouvel utilisateur (201)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Utilisateur créé avec succès!');
  });

  // Test 2: Échec de l'inscription (utilisateur déjà pris)
  it('devrait refuser une inscription si l\'utilisateur existe (409)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser); // On envoie le MÊME utilisateur

    expect(res.statusCode).toEqual(409);
    expect(res.body.error).toBe('Ce nom d\'utilisateur est déjà pris.');
  });

  // Test 3: Connexion
  it('devrait connecter un utilisateur existant (200)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(testUser);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token'); // On vérifie qu'un token est bien renvoyé
  });

  // Test 4: Échec de connexion (mauvais mot de passe)
  it('devrait refuser la connexion avec un mauvais mdp (401)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        username: testUser.username,
        password: 'mauvaismotdepasse'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBe('Mot de passe incorrect.');
  });
});