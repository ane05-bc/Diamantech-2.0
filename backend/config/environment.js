const dotenv = require('dotenv');
dotenv.config(); // Carga variables desde el archivo .env

module.exports = {
    PORT: process.env.PORT || 3000, 
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root', // Cambiar por tu usuario de BD
    DB_PASSWORD: process.env.DB_PASSWORD || '', // Cambiar por tu contraseña de BD
    DB_NAME: process.env.DB_NAME || 'diamantech_db',
    JWT_SECRET: process.env.JWT_SECRET || 'CLAVE',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};