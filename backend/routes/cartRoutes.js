const express = require('express');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', getCart); // Obtener carrito
router.post('/items', addItemToCart); // Añadir item
router.put('/items/:itemId', updateCartItem); // Actualizar cantidad de item
router.delete('/items/:itemId', removeCartItem); // Eliminar item

module.exports = router;