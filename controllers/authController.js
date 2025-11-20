require('dotenv').config();
const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// --- 1. Inscription (Register) ---
exports.register = (req, res) => {
  const { username, password } = req.body;

  // Validation simple
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont obligatoires.' });
  }

  // Hachage du mot de passe
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors du hachage du mot de passe.' });
    }

    // Enregistrement dans la BDD
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(query, [username, hash], function(err) {
      if (err) {
        // "UNIQUE constraint failed" signifie que l'utilisateur existe déjà
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
        }
        return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur.', details: err.message });
      }
      res.status(201).json({ 
        success: true, 
        message: 'Utilisateur créé avec succès!', 
        userId: this.lastID 
      });
    });
  });
};

// --- 2. Connexion (Login) ---
exports.login = (req, res) => {
  const { username, password } = req.body;

  // 1. Trouver l'utilisateur
  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // 2. Vérifier le mot de passe
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la vérification.' });
      }
      if (!isMatch) {
        return res.status(401).json({ error: 'Mot de passe incorrect.' });
      }

      // 3. Créer le Token JWT
      const payload = { 
        id: user.id, 
        username: user.username 
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expire dans 1 heure

      res.json({
        success: true,
        message: 'Connexion réussie!',
        token: token
      });
    });
  });
};