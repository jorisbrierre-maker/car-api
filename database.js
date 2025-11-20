require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cars.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connecté à la base de données SQLite');
  }
});

// --- Création des tables ---
// db.serialize() force l'exécution des commandes dans l'ordre,
// ce qui évite les "race conditions" (ex: "no such table")
db.serialize(() => {
  // 1. Table des voitures
  const createCarsTableQuery = `
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      color TEXT,
      price REAL,
      mileage INTEGER,
      description TEXT,
      favorite INTEGER DEFAULT 0,
      category TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createCarsTableQuery, (err) => {
    if (err) {
      console.error('Erreur lors de la création de la table "cars":', err.message);
    } else {
      console.log('✓ Table "cars" créée ou déjà existante');
    }
  });

  // 2. Table des utilisateurs (pour JWT)
  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `;

  db.run(createUsersTableQuery, (err) => {
    if (err) {
      console.error('Erreur lors de la création de la table "users":', err.message);
    } else {
      console.log('✓ Table "users" créée ou déjà existante');
    }
  });
});

module.exports = db;