require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  // 1. Récupérer le token du header 'Authorization'
  const authHeader = req.headers['authorization'];
  // Le format est "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Si pas de token, erreur 401
  if (token == null) {
    return res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
  }

  // 3. Vérifier le token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Si le token est expiré ou invalide
      return res.status(403).json({ error: 'Accès refusé. Token invalide ou expiré.' });
    }

    // Si tout est bon, on stocke l'utilisateur dans 'req' et on continue
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;