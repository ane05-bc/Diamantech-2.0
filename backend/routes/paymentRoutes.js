const express = require('express');
const { simulatePaymentConfirmation } = require('../controllers/paymentController');


const router = express.Router();

// Ruta para que el usuario "confirme" su pago QR (simulación)
router.post('/confirm-qr', simulatePaymentConfirmation);

module.exports = router;