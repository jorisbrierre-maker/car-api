const multer = require('multer');
const path = require('path');

// 1. Définir où et comment stocker les fichiers
const storage = multer.diskStorage({
  // La destination est le dossier 'uploads' qu'on a créé
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  // On renomme le fichier pour éviter les doublons
  // Nouveau nom = Timestamp + Extension d'origine
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// 2. Créer un filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  // Définir les types de fichiers autorisés
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedFileTypes.test(file.mimetype);
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Erreur: Seuls les fichiers image (jpeg, jpg, png, gif) sont autorisés!'));
};

// 3. Exporter la configuration de multer
// 'storage' = la configuration de stockage
// 'fileFilter' = le filtre de fichiers
// 'limits' = taille max (ici 5MB)
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;