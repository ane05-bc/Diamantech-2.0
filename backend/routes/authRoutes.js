const express = require('express');
const { registerUser, loginUser, getDeliveryZones,getDefaultAddress } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/delivery-zones', getDeliveryZones); 
router.get('/default-address', protect, getDefaultAddress);

module.exports = router;

