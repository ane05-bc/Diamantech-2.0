const bcrypt = require('bcryptjs');
const dbPool = require('../config/db');
const { generateToken } = require('../utils/jwtHelper');

const registerUser = async (req, res, next) => {
  const { 
    nombre_completo, 
    email, 
    password, 
    telefono,
    id_zona, 
    calle_avenida,
    numero_vivienda, 
    referencia_adicional 
  } = req.body;

  if (!nombre_completo || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
  }
  // Validación básica de dirección (campos principales)
  if (!id_zona || !calle_avenida || !numero_vivienda) {
    return res.status(400).json({ message: 'La zona, calle/avenida y número de vivienda son requeridos para la dirección.' });
  }

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query('SELECT email FROM Usuarios WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [userResult] = await connection.query(
      'INSERT INTO Usuarios (nombre_completo, email, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre_completo, email, password_hash, telefono || null, 'cliente']
    );
    const id_usuario = userResult.insertId;

    if (!id_usuario) {
      await connection.rollback();
      return res.status(500).json({ message: 'Error al registrar el usuario.' });
    }

    // Insertar dirección predeterminada
    const [addressResult] = await connection.query(
        `INSERT INTO Direcciones (id_usuario, id_zona, calle_avenida, numero_vivienda, referencia_adicional, nombre_destinatario, es_predeterminada) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, id_zona, calle_avenida, numero_vivienda, referencia_adicional || null, nombre_completo, 1] // es_predeterminada = true
    );
    
    if (!addressResult.insertId) {
        await connection.rollback();
        return res.status(500).json({ message: 'Error al registrar la dirección del usuario.' });
    }

    await connection.commit();

    const token = generateToken({ id_usuario: id_usuario, email: email, rol: 'cliente' });
    res.status(201).json({
      message: 'Usuario y dirección registrados exitosamente.',
      token,
      usuario: {
        id_usuario,
        nombre_completo,
        email,
        telefono,
        rol: 'cliente'
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_zona')) {
        return res.status(400).json({ message: 'La zona de entrega seleccionada no es válida.' });
    }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Por favor, ingrese email y contraseña.' });
  }
  try {
    const [users] = await dbPool.query('SELECT id_usuario, email, password_hash, rol, nombre_completo, telefono FROM Usuarios WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }
    const token = generateToken({ id_usuario: user.id_usuario, email: user.email, rol: user.rol });
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

// Nuevo: Obtener zonas de entrega
const getDeliveryZones = async (req, res, next) => {
    try {
        const [zones] = await dbPool.query('SELECT id_zona, nombre_zona, costo_envio_zona FROM ZonasEntrega ORDER BY nombre_zona');
        res.status(200).json(zones);
    } catch (error) {
        next(error);
    }
};
const getDefaultAddress = async (req, res, next) => {
    const id_usuario = req.user.id_usuario; // Asumimos que el middleware 'protect' añade req.user
    try {
        const [addressRows] = await dbPool.query(
            `SELECT 
                d.id_direccion, d.id_zona, d.calle_avenida, d.numero_vivienda, 
                d.referencia_adicional, d.nombre_destinatario, d.es_predeterminada,
                ze.nombre_zona, ze.costo_envio_zona
             FROM Direcciones d
             JOIN ZonasEntrega ze ON d.id_zona = ze.id_zona
             WHERE d.id_usuario = ? AND d.es_predeterminada = TRUE 
             LIMIT 1`,
            [id_usuario]
        );
        if (addressRows.length === 0) {
            // Es importante devolver un 404 si no hay dirección predeterminada,
            // para que el frontend sepa que no existe.
            return res.status(404).json({ message: 'No se encontró dirección predeterminada para este usuario.' });
        }
        res.status(200).json(addressRows[0]);
    } catch (error) {
        console.error("Error al obtener dirección predeterminada:", error);
        next(error);
    }
};

module.exports = {
  registerUser,
  loginUser,
  getDeliveryZones,
  getDefaultAddress, 
};