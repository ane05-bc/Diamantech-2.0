const { verifyToken } = require('../utils/jwtHelper');
const dbPool = require('../config/db'); 

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: 'No autorizado, token falló o expiró.' });
      }

      // Opcional: Adjuntar el usuario al objeto req si se necesita en controladores posteriores
      // Esto podría implicar una consulta a la BD para obtener datos frescos del usuario
      // const [rows] = await dbPool.query('SELECT id_usuario, email, rol FROM Usuarios WHERE id_usuario = ?', [decoded.id_usuario]);
      // if (rows.length === 0) {
      //   return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
      // }
      // req.user = rows[0];
      
      req.user = decoded; 

      next();
    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return res.status(401).json({ message: 'No autorizado, token inválido.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no se proporcionó token.' });
  }
};

module.exports = { protect };