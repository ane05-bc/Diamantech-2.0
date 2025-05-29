const dbPool = require('../config/db');

const getCart = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  try {
    let [cartRows] = await dbPool.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    if (cartRows.length === 0) {
      return res.status(200).json({ items: [], subtotal: 0, id_carrito: null });
    }
    const cartId = cartRows[0].id_carrito;

    const [items] = await dbPool.query(
      `SELECT 
        ic.id_item_carrito, ic.cantidad, ic.precio_unitario_al_agregar,
        p.id_producto, p.nombre_producto, p.slug_producto, p.precio AS precio_actual_producto, p.imagen_principal_url, p.sku
       FROM ItemsCarrito ic
       JOIN Productos p ON ic.id_producto = p.id_producto
       WHERE ic.id_carrito = ? AND p.activo = TRUE`, // Solo items de productos activos
      [cartId]
    );

    const subtotal = items.reduce((sum, item) => sum + (item.precio_unitario_al_agregar * item.cantidad), 0);
    res.status(200).json({ items, subtotal, id_carrito: cartId });
  } catch (error) {
    next(error);
  }
};

const addItemToCart = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { id_producto, cantidad } = req.body;

  if (!id_producto || !cantidad || cantidad < 1) {
    return res.status(400).json({ message: 'ID de producto y cantidad (mínimo 1) son requeridos.' });
  }

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query(
        'SELECT precio, stock FROM Productos WHERE id_producto = ? AND activo = TRUE', 
        [id_producto]
    );
    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Producto no encontrado o inactivo.' });
    }
    const producto = productRows[0];
    const precio_unitario_al_agregar = parseFloat(producto.precio);

    let [cartRows] = await connection.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    let cartId;

    if (cartRows.length === 0) {
      const [newCartResult] = await connection.query('INSERT INTO Carrito (id_usuario) VALUES (?)', [id_usuario]);
      cartId = newCartResult.insertId;
    } else {
      cartId = cartRows[0].id_carrito;
    }

    const [existingItemRows] = await connection.query(
      'SELECT id_item_carrito, cantidad FROM ItemsCarrito WHERE id_carrito = ? AND id_producto = ?',
      [cartId, id_producto]
    );

    if (existingItemRows.length > 0) {
      const currentItem = existingItemRows[0];
      const nuevaCantidad = currentItem.cantidad + cantidad;
      if (producto.stock < nuevaCantidad) {
        await connection.rollback();
        return res.status(400).json({ message: `Stock insuficiente. Disponible: ${producto.stock}, en carrito ya: ${currentItem.cantidad}` });
      }
      await connection.query(
        'UPDATE ItemsCarrito SET cantidad = ?, precio_unitario_al_agregar = ? WHERE id_item_carrito = ?',
        [nuevaCantidad, precio_unitario_al_agregar, currentItem.id_item_carrito]
      );
    } else {
      if (producto.stock < cantidad) {
        await connection.rollback();
        return res.status(400).json({ message: `Stock insuficiente. Disponible: ${producto.stock}` });
      }
      await connection.query(
        'INSERT INTO ItemsCarrito (id_carrito, id_producto, cantidad, precio_unitario_al_agregar) VALUES (?, ?, ?, ?)',
        [cartId, id_producto, cantidad, precio_unitario_al_agregar]
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

    const [itemRows] = await connection.query(
        `SELECT ic.id_producto, c.id_carrito 
         FROM ItemsCarrito ic 
         JOIN Carrito c ON ic.id_carrito = c.id_carrito 
         WHERE ic.id_item_carrito = ? AND c.id_usuario = ?`,
        [itemId, id_usuario]
    );
    if (itemRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Item no encontrado en el carrito del usuario.' });
    }
    const id_producto = itemRows[0].id_producto;

    const [productRows] = await connection.query('SELECT stock FROM Productos WHERE id_producto = ? AND activo = TRUE', [id_producto]);
    if (productRows.length === 0 || productRows[0].stock < cantidad) {
        await connection.rollback();
        const stockDisponible = productRows.length > 0 ? productRows[0].stock : 0;
        return res.status(400).json({ message: `Stock insuficiente o producto inactivo. Disponible: ${stockDisponible}` });
    }

    const [result] = await connection.query(
      'UPDATE ItemsCarrito SET cantidad = ? WHERE id_item_carrito = ?',
      [cantidad, itemId]
    );

    if (result.affectedRows === 0) {
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

const removeCartItem = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { itemId } = req.params; // id_item_carrito

  try {
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
