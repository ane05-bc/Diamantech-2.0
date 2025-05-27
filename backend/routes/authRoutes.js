const express = require('express');
const { registerUser, loginUser /*, logoutUser*/ } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.post('/logout', logoutUser); // Si implementas un endpoint de logout

module.exports = router;
