const express = require('express');
const { registerUser, loginUser, getDeliveryZones } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/delivery-zones', getDeliveryZones); 

module.exports = router;

