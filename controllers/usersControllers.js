// --- Imports ---
const db = require('../database');
const { body, validationResult } = require('express-validator');

// --- Règles de validation pour une voiture ---
exports.carValidationRules = [
  body('brand').notEmpty().withMessage('La marque (brand) est obligatoire.'),
  body('model').notEmpty().withMessage('Le modèle (model) est obligatoire.'),
  body('year').isInt({ min: 1886, max: 2030 }).withMessage("L'année (year) doit être un nombre valide (ex: 1995)."),
  body('price').optional().isNumeric().withMessage('Le prix (price) doit être un nombre.'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Le kilométrage (mileage) doit être un nombre positif.'),
  body('color').optional().isString().withMessage('La couleur (color) doit être une chaîne de caractères.'),
  body('description').optional().isString().withMessage('La description (description) doit être une chaîne de caractères.'),
  body('favorite').optional().isBoolean().withMessage('Le champ "favorite" doit être un booléen (0 ou 1).'),
  body('category').optional().isString().withMessage('La catégorie doit être une chaîne de caractères.'),
  body('image_url').optional().isURL().withMessage("L'URL de l'image n'est pas valide.")
  
];

// --- Middleware qui vérifie les résultats de la validation ---
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Pas d'erreurs, on continue
  }
  
  // Il y a des erreurs, on renvoie une 400
  return res.status(400).json({
    error: 'Données invalides',
    errors: errors.array() // On renvoie la liste des erreurs
  });
};

// --- GET - Récupérer toutes les voitures (avec pagination ET tri) ---
exports.getAllCars = (req, res) => {
  // 1. Pagination
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 10);
  const offset = (page - 1) * limit;

  // 2. Tri
  const sortBy = req.query.sortBy || 'year';
  const order = (req.query.order || 'DESC').toUpperCase(); 

  // 3. Sécurisation du tri (Whitelist)
  const allowedSortBy = ['id', 'brand', 'model', 'year', 'price', 'mileage'];
  const allowedOrder = ['ASC', 'DESC'];
  const sortColumn = allowedSortBy.includes(sortBy) ? sortBy : 'year';
  const sortOrder = allowedOrder.includes(order) ? order : 'DESC';

  // 4. Requête SQL
  const query = `SELECT * FROM cars ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
  const params = [limit, offset];

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: 'Erreur lors de la récupération des voitures',
        details: err.message
      });
    }
    
    res.json({
      success: true,
      message: 'Liste des voitures récupérée',
      page: page,
      limit: limit,
      sortBy: sortColumn,
      order: sortOrder,
      count: rows.length,
      data: rows
    });
  });
};

// GET - Rechercher des voitures
exports.searchCars = (req, res) => {
    // 1. Récupérer les paramètres de recherche de l'URL (req.query)
    const { brand, model, minYear, maxYear, minPrice, maxPrice, category } = req.query;
  
    // 2. Construire la requête SQL dynamiquement
    let query = 'SELECT * FROM cars WHERE 1 = 1'; // "1=1" est une astuce pour pouvoir ajouter "AND"
    const params = []; // On stocke les valeurs ici pour éviter les injections SQL
  
    if (brand) {
      query += ' AND brand LIKE ?';
      params.push(`%${brand}%`); // On utilise LIKE avec '%' pour une recherche partielle
    }
    if (model) {
      query += ' AND model LIKE ?';
      params.push(`%${model}%`);
    }
    if (minYear) {
      query += ' AND year >= ?';
      params.push(minYear);
    }
    if (maxYear) {
      query += ' AND year <= ?';
      params.push(maxYear);
    }
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
  
    query += ' ORDER BY year DESC';
  
    // 3. Exécuter la requête
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: 'Erreur lors de la recherche',
          details: err.message
        });
      }
      res.json({
        success: true,
        message: 'Recherche effectuée',
        count: rows.length,
        data: rows
      });
    });
  };
// --- GET - Récupérer les voitures favorites ---
exports.getFavoriteCars = (req, res) => {
  const query = 'SELECT * FROM cars WHERE favorite = 1 ORDER BY brand ASC';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: 'Erreur lors de la récupération des favoris',
        details: err.message
      });
    }
    res.json({
      success: true,
      message: 'Liste des voitures favorites',
      count: rows.length,
      data: rows
    });
  });
};

// --- GET - Récupérer une voiture par ID ---
exports.getCarById = (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM cars WHERE id = ?';
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        error: 'Erreur serveur',
        details: err.message
      });
    }
    if (!row) {
      return res.status(404).json({
        error: 'Voiture non trouvée',
        message: `Aucune voiture avec l'ID ${id}`
      });
    }
    res.json({
      success: true,
      message: 'Voiture trouvée',
      data: row
    });
  });
};

// --- POST - Créer une nouvelle voiture ---
exports.createCar = (req, res) => {
  // 1. On ajoute 'image_url' dans l'extraction des données
  const { brand, model, year, color, price, mileage, description, favorite, category, image_url } = req.body; 

  // 2. On ajoute la colonne et le point d'interrogation dans la requête
  const query = `
    INSERT INTO cars (brand, model, year, color, price, mileage, description, favorite, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `; 
  
  // 3. On ajoute la valeur dans le tableau des paramètres
  const params = [brand, model, year, color, price, mileage, description, favorite || 0, category, image_url]; 

  db.run(query, params, function (err) { 
    if (err) {
      return res.status(500).json({ error: 'Erreur insertion', details: err.message });
    }
    res.status(201).json({
      success: true,
      message: 'Voiture créée avec succès',
      data: {
        id: this.lastID,
        brand, model, year, color, price, mileage, description, 
        favorite: favorite || 0,
        category,
        image_url // On renvoie maintenant l'image_url pour le Frontend
      }
    });
  });
};

// --- PUT - Modifier une voiture existante ---

exports.updateCar = (req, res) => {
  const id = req.params.id;
  const { brand, model, year, color, price, mileage, description, favorite, category, image_url } = req.body; 

  const query = `
    UPDATE cars
    SET brand = ?, model = ?, year = ?, color = ?, price = ?, mileage = ?, description = ?, favorite = ?, category = ?, image_url = ?
    WHERE id = ?
  `; 
  const params = [brand, model, year, color, price, mileage, description, favorite, category, image_url, id]; 

  db.run(query, params, function (err) {
    if (err) { /* ... */ }
    res.json({
      success: true,
      message: 'Voiture mise à jour avec succès',
      data: { id: Number(id), brand, model, year, color, price, mileage, description, favorite, category, image_url }
    });
  });
};

// --- DELETE - Supprimer une voiture ---
exports.deleteCar = (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM cars WHERE id = ?';

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({
        error: 'Erreur lors de la suppression',
        details: err.message
      });
    }
    if (this.changes === 0) {
      return res.status(404).json({
        error: 'Voiture non trouvée'
      });
    }
    res.json({
      success: true,
      message: 'Voiture supprimée avec succès',
      data: { id: Number(id) }
    });
  });
};

// ... (après exports.deleteCar et getFavoriteCars) ...

// POST - Uploader une image pour une voiture
exports.uploadCarImage = (req, res) => {
    const id = req.params.id;
  
    // 1. Vérifier si un fichier a bien été uploadé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier sélectionné.' });
    }
  
    // 2. Récupérer le chemin du fichier (géré par multer)
    // On remplace les '\' (Windows) par des '/' (standard URL)
    const imageUrl = req.file.path.replace(/\\/g, "/"); 
  
    // 3. Mettre à jour la base de données
    const query = `UPDATE cars SET image_url = ? WHERE id = ?`;
    const params = [imageUrl, id];
  
    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la BDD', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Voiture non trouvée.' });
      }
  
      // 4. Renvoyer la réponse
      res.json({
        success: true,
        message: 'Image uploadée avec succès!',
        data: {
          id: Number(id),
          image_url: imageUrl
        }
      });
    });
  };