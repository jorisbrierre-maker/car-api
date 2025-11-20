const app = require('./app'); // On importe l'application depuis app.js
const PORT = process.env.PORT || 3000; 

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});