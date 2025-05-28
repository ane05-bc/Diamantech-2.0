const express = require('express');
const {
  createCategory, updateCategory,
  createProduct, updateProduct,
  createProductVariant, updateProductVariant
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Todas las rutas de admin requieren autenticación y rol de 'administrador'
router.use(protect);
router.use(authorizeRoles('administrador'));

// Rutas para Categorías
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
// router.delete('/categories/:categoryId', deleteCategory);

// Rutas para Productos
router.post('/products', createProduct);
router.put('/products/:productId', updateProduct);
// router.delete('/products/:productId', deleteProduct);

// Rutas para Variantes de Producto
router.post('/variants', createProductVariant);
router.put('/variants/:variantId', updateProductVariant); // Esto actualiza el stock
// router.delete('/variants/:variantId', deleteProductVariant);

module.exports = router;