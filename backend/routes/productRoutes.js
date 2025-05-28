const express = require('express');
const {
  getAllCategories,
  getProductsByCategorySlug,
  getProductBySlug,
} = require('../controllers/productController');

const router = express.Router();

// Rutas para categorías (públicas)
router.get('/categories', getAllCategories);
// router.get('/categories/:categorySlug', getCategoryBySlug); // Podrías añadir una para detalles de UNA categoría si es necesario

// Rutas para productos (públicas)
router.get('/category/:categorySlug', getProductsByCategorySlug); // Productos por slug de categoría
router.get('/:productSlug', getProductBySlug); // Detalle de un producto por su slug

module.exports = router;