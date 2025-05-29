const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderDetails,
  submitOrderComplaint,
  getUserComplaintForOrder
} = require('../controllers/orderController');

const router = express.Router();

router.post('/create', createOrder);
router.get('/', getUserOrders);
router.get('/:orderId', getOrderDetails);

// Rutas para Quejas de un Pedido
router.post('/:orderId/complaint', submitOrderComplaint);
router.get('/:orderId/complaint', getUserComplaintForOrder);


module.exports = router;
