const express = require('express');
const cors = require('cors');
const { PORT } = require('./config/environment'); // Variables de entorno
const dbPool = require('./config/db'); // Pool de conexiones a la BD

// Importar Rutas (ejemplos)
const authRoutes = require('./routes/authRoutes');
// const productRoutes = require('./routes/productRoutes'); // Descomentar cuando estén listos
// const cartRoutes = require('./routes/cartRoutes');
// const orderRoutes = require('./routes/orderRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const adminRoutes = require('./routes/adminRoutes');

// Importar Middlewares
const errorHandler = require('./middleware/errorHandler');
// const { protect } = require('./middleware/authMiddleware');
// const { authorizeRoles } = require('./middleware/roleMiddleware'); 
const app = express();
// Middlewares
app.use(cors()); // Habilitar CORS para permitir peticiones desde el frontend
app.use(express.json()); // Para parsear body de peticiones como JSON
app.use(express.urlencoded({ extended: true })); // Para parsear body de formularios

// Rutas de la API (ejemplos)
app.get('/api', (req, res) => {
   res.json({ message: 'Bienvenido a la API de DIAMANTECH Joyería Online' });
});

app.use('/api/auth', authRoutes);
console.log('authRoutes es:', authRoutes);
// app.use('/api/products', productRoutes); // Rutas públicas para productos
// app.use('/api/cart', protect, cartRoutes); // Rutas de carrito protegidas
// app.use('/api/orders', protect, orderRoutes); // Rutas de pedidos protegidas
// app.use('/api/payment', protect, paymentRoutes); // Rutas de pago protegidas

// Rutas de Administración (ejemplo, podrían requerir middleware de autenticación y rol)
//app.use('/api/admin', adminRoutes);

// Middleware de manejo de errores (debe ser el último middleware)
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
   console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

// Manejo de cierre elegante (opcional pero recomendado)
process.on('SIGINT', async () => {
  console.log('Recibida señal SIGINT. Cerrando servidor...');
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    try {
      await dbPool.end();
      console.log('Conexiones a la base de datos cerradas.');
      process.exit(0);
    } catch (err) {
      console.error('Error al cerrar las conexiones de la base de datos:', err);
      process.exit(1);
    }
  });
});

process.on('SIGTERM', async () => {
    console.log('Recibida señal SIGTERM. Cerrando servidor...');
    server.close(async () => {
        console.log('Servidor HTTP cerrado.');
        try {
            await dbPool.end();
            console.log('Conexiones a la base de datos cerradas.');
            process.exit(0);
        } catch (err) {
            console.error('Error al cerrar las conexiones de la base de datos:', err);
            process.exit(1);
        }
    });
});