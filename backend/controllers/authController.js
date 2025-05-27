const bcrypt = require('bcryptjs');
const dbPool = require('../config/db');
const { generateToken } = require('../utils/jwtHelper');

const registerUser = async (req, res, next) => {
  const { nombre_completo, email, password, telefono } = req.body;

  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ message: 'Por favor, ingrese nombre, email y contraseña.' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await dbPool.query('SELECT email FROM Usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar nuevo usuario (rol por defecto es 'cliente' según la BD)
    const [result] = await dbPool.query(
      'INSERT INTO Usuarios (nombre_completo, email, password_hash, telefono) VALUES (?, ?, ?, ?)',
      [nombre_completo, email, password_hash, telefono || null]
    );

    const id_usuario = result.insertId;

    if (id_usuario) {
      // Generar token JWT
      const token = generateToken({ id_usuario: id_usuario, email: email, rol: 'cliente' }); // rol por defecto
      res.status(201).json({
        message: 'Usuario registrado exitosamente.',
        token,
        usuario: {
          id_usuario,
          nombre_completo,
          email,
          rol: 'cliente' // rol por defecto
        }
      });
    } else {
      res.status(500).json({ message: 'Error al registrar el usuario.' });
    }
  } catch (error) {
    next(error); // Pasa el error al manejador de errores centralizado
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, ingrese email y contraseña.' });
  }

  try {
    const [users] = await dbPool.query('SELECT id_usuario, email, password_hash, rol, nombre_completo FROM Usuarios WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas (email no encontrado).' });
    }

    const user = users[0];

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
    }

    // Generar token JWT
    const token = generateToken({ id_usuario: user.id_usuario, email: user.email, rol: user.rol });

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

// invalide el token en el cliente
// o si usas refresh tokens, invalidar el refresh token en la BD.
// const logoutUser = (req, res) => {
//   // Lógica de logout (principalmente del lado del cliente al eliminar el token)
//   res.status(200).json({ message: 'Logout exitoso (token debe ser eliminado por el cliente).' });
// };

module.exports = {
  registerUser,
  loginUser,
  // logoutUser,
};