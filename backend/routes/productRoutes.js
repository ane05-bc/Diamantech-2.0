const express = require('express');
const {
  getAllCategories,
  getProductsByCategorySlug,
  getProductBySlug,
} = require('../controllers/productController');

const router = express.Router();

// Rutas para categorías (públicas)
router.get('/categories', getAllCategories);

// Rutas para productos (públicas)
router.get('/category/:categorySlug', getProductsByCategorySlug); 
router.get('/:productSlug', getProductBySlug); 

module.exports = router;