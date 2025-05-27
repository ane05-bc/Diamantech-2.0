const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./environment');

 const pool = mysql.createPool({
   host: DB_HOST,
   user: DB_USER,
   password: DB_PASSWORD,
   database: DB_NAME,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos MySQL establecida exitosamente.');
    connection.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos MySQL:', err.message);
    if (err.code === 'ER_BAD_DB_ERROR') {
        console.error(`La base de datos '${DB_NAME}' no existe. Por favor, créala.`);
    } else if (err.code === 'ECONNREFUSED') {
        console.error('Error de conexión: Verifica que el servidor MySQL esté corriendo y accesible.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Error de acceso: Verifica las credenciales de usuario de la base de datos.');
    }
  }
})();

module.exports = pool;