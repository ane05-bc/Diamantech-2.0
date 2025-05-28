const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderDetails
} = require('../controllers/orderController');
// El middleware 'protect' ya se aplica en server.js para '/api/orders'

const router = express.Router();

router.post('/create', createOrder); // Crear un nuevo pedido
router.get('/', getUserOrders); // Obtener todos los pedidos del usuario logueado
router.get('/:orderId', getOrderDetails); // Obtener detalles de un pedido específico

module.exports = router;