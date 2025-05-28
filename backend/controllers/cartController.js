const dbPool = require('../config/db');

// Obtener el carrito del usuario logueado
const getCart = async (req, res, next) => {
  const id_usuario = req.user.id_usuario; // Asumimos que 'protect' middleware añade req.user
  try {
    // 1. Buscar si el usuario tiene un carrito activo
    let [cartRows] = await dbPool.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    let cartId;

    if (cartRows.length === 0) {
      // Si no tiene carrito, se podría crear uno vacío o simplemente devolver carrito vacío
      return res.status(200).json({ items: [], subtotal: 0 });
    }
    cartId = cartRows[0].id_carrito;

    // 2. Obtener items del carrito
    const [items] = await dbPool.query(
      `SELECT 
        ic.id_item_carrito, ic.cantidad, ic.precio_unitario_al_agregar,
        pv.id_variante, pv.sku_variante, pv.atributos_variante, pv.imagen_variante_url,
        p.id_producto, p.nombre_producto, p.slug_producto,
        (p.precio_base + pv.precio_adicional) AS precio_actual_variante 
       FROM ItemsCarrito ic
       JOIN VariantesProducto pv ON ic.id_variante = pv.id_variante
       JOIN Productos p ON pv.id_producto = p.id_producto
       WHERE ic.id_carrito = ?`,
      [cartId]
    );

    const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario_al_agregar * item.cantidad), 0);

    res.status(200).json({ items, subtotal, id_carrito: cartId });
  } catch (error) {
    next(error);
  }
};

// Añadir un item al carrito
const addItemToCart = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { id_variante, cantidad } = req.body;

  if (!id_variante || !cantidad || cantidad < 1) {
    return res.status(400).json({ message: 'ID de variante y cantidad (mínimo 1) son requeridos.' });
  }

  const connection = await dbPool.getConnection(); // Para transacciones
  try {
    await connection.beginTransaction();

    // 1. Verificar que la variante exista y tenga stock
    const [variantRows] = await connection.query(
        'SELECT p.precio_base, pv.precio_adicional, pv.stock FROM VariantesProducto pv JOIN Productos p ON pv.id_producto = p.id_producto WHERE pv.id_variante = ? AND p.activo = TRUE', 
        [id_variante]
    );
    if (variantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Variante de producto no encontrada o producto inactivo.' });
    }
    const variante = variantRows[0];
    if (variante.stock < cantidad) {
      await connection.rollback();
      return res.status(400).json({ message: `Stock insuficiente. Disponible: ${variante.stock}` });
    }
    const precio_unitario_al_agregar = parseFloat(variante.precio_base) + parseFloat(variante.precio_adicional);


    // 2. Obtener o crear el carrito del usuario
    let [cartRows] = await connection.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    let cartId;

    if (cartRows.length === 0) {
      const [newCartResult] = await connection.query('INSERT INTO Carrito (id_usuario) VALUES (?)', [id_usuario]);
      cartId = newCartResult.insertId;
    } else {
      cartId = cartRows[0].id_carrito;
    }

    // 3. Verificar si el item ya está en el carrito para actualizar cantidad, o insertarlo
    const [existingItemRows] = await connection.query(
      'SELECT id_item_carrito, cantidad FROM ItemsCarrito WHERE id_carrito = ? AND id_variante = ?',
      [cartId, id_variante]
    );

    if (existingItemRows.length > 0) {
      // Actualizar cantidad
      const currentItem = existingItemRows[0];
      const nuevaCantidad = currentItem.cantidad + cantidad;
      if (variante.stock < nuevaCantidad) {
        await connection.rollback();
        return res.status(400).json({ message: `Stock insuficiente para la cantidad total. Disponible: ${variante.stock}, en carrito ya: ${currentItem.cantidad}` });
      }
      await connection.query(
        'UPDATE ItemsCarrito SET cantidad = ?, precio_unitario_al_agregar = ? WHERE id_item_carrito = ?',
        [nuevaCantidad, precio_unitario_al_agregar, currentItem.id_item_carrito]
      );
    } else {
      // Insertar nuevo item
      await connection.query(
        'INSERT INTO ItemsCarrito (id_carrito, id_variante, cantidad, precio_unitario_al_agregar) VALUES (?, ?, ?, ?)',
        [cartId, id_variante, cantidad, precio_unitario_al_agregar]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Item añadido/actualizado en el carrito.' });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Actualizar cantidad de un item en el carrito
const updateCartItem = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { itemId } = req.params; // id_item_carrito
  const { cantidad } = req.body;

  if (!cantidad || cantidad < 1) {
    return res.status(400).json({ message: 'Cantidad (mínimo 1) es requerida.' });
  }
  
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verificar que el item pertenezca al carrito del usuario
    const [itemRows] = await connection.query(
        `SELECT ic.id_variante, c.id_carrito 
         FROM ItemsCarrito ic 
         JOIN Carrito c ON ic.id_carrito = c.id_carrito 
         WHERE ic.id_item_carrito = ? AND c.id_usuario = ?`,
        [itemId, id_usuario]
    );
    if (itemRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Item no encontrado en el carrito del usuario.' });
    }
    const id_variante = itemRows[0].id_variante;

    // 2. Verificar stock de la variante
    const [variantRows] = await connection.query('SELECT stock FROM VariantesProducto WHERE id_variante = ?', [id_variante]);
    if (variantRows.length === 0 || variantRows[0].stock < cantidad) {
        await connection.rollback();
        const stockDisponible = variantRows.length > 0 ? variantRows[0].stock : 0;
        return res.status(400).json({ message: `Stock insuficiente. Disponible: ${stockDisponible}` });
    }

    // 3. Actualizar cantidad
    const [result] = await connection.query(
      'UPDATE ItemsCarrito SET cantidad = ? WHERE id_item_carrito = ?',
      [cantidad, itemId]
    );

    if (result.affectedRows === 0) { // Doble check, aunque el query anterior debería haberlo encontrado
        await connection.rollback();
        return res.status(404).json({ message: 'Item no encontrado para actualizar.' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Cantidad del item actualizada.' });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// Eliminar un item del carrito
const removeCartItem = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { itemId } = req.params; // id_item_carrito

  try {
    // Verificar que el item pertenezca al carrito del usuario antes de borrar
    const [result] = await dbPool.query(
      'DELETE ic FROM ItemsCarrito ic JOIN Carrito c ON ic.id_carrito = c.id_carrito WHERE ic.id_item_carrito = ? AND c.id_usuario = ?',
      [itemId, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item no encontrado en el carrito del usuario o ya eliminado.' });
    }
    res.status(200).json({ message: 'Item eliminado del carrito.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
};
