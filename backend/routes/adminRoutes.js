    const express = require('express');
    const {
      createCategory, updateCategory, getAllCategoriesAdmin, // getAllCategoriesAdmin es nueva
      createProduct, updateProduct,
      getAllProductsAdmin, getProductDetailsAdmin, 
      getAllOrdersAdmin, updateOrderStatusAdmin, 
      getAllComplaintsAdmin, getComplaintDetailsAdmin, respondToComplaintAdmin
    } = require('../controllers/adminController');
    const { getOrderDetails } = require('../controllers/orderController'); 
    const { protect } = require('../middleware/authMiddleware');
    const { authorizeRoles } = require('../middleware/roleMiddleware');

    const router = express.Router();

    router.use(protect);
    router.use(authorizeRoles('administrador'));

    // Categorías
    router.post('/categories', createCategory);
    router.put('/categories/:categoryId', updateCategory);
    router.get('/categories-all', getAllCategoriesAdmin); 

    // Productos
    router.post('/products', createProduct);
    router.put('/products/:productId', updateProduct);
    router.get('/products-all', getAllProductsAdmin); 
    router.get('/products/:productId', getProductDetailsAdmin); 

    // Pedidos
    router.get('/orders', getAllOrdersAdmin);
    router.get('/orders/:orderId', getOrderDetails); 
    router.put('/orders/:orderId/status', updateOrderStatusAdmin);

    // Quejas
    router.get('/complaints', getAllComplaintsAdmin);
    router.get('/complaints/:complaintId', getComplaintDetailsAdmin);
    router.put('/complaints/:complaintId/respond', respondToComplaintAdmin);

    module.exports = router;
    