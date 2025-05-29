const dbPool = require('../config/db');
const { generateQrDataForPayment } = require('../utils/qrGenerator');

const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DIA-${timestamp}-${randomPart}`;
};

const createOrder = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  // La dirección se obtiene de la predeterminada del usuario.
  // El costo de envío se obtendrá de la zona de la dirección predeterminada.

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener dirección predeterminada del usuario y costo de envío de la zona
    const [addressRows] = await connection.query(
        `SELECT d.id_direccion, ze.costo_envio_zona 
         FROM Direcciones d
         JOIN ZonasEntrega ze ON d.id_zona = ze.id_zona
         WHERE d.id_usuario = ? AND d.es_predeterminada = TRUE 
         LIMIT 1`,
        [id_usuario]
    );
    if (addressRows.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'No se encontró dirección de envío predeterminada. Por favor, actualiza tu perfil.' });
    }
    const id_direccion_envio = addressRows[0].id_direccion;
    const costo_envio = parseFloat(addressRows[0].costo_envio_zona);


    // 2. Obtener carrito del usuario
    const [cartHeaderRows] = await connection.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    if (cartHeaderRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No se encontró carrito para este usuario.' });
    }
    const id_carrito = cartHeaderRows[0].id_carrito;

    const [cartItems] = await connection.query(
      `SELECT 
        ic.id_item_carrito, ic.cantidad, ic.precio_unitario_al_agregar,
        p.id_producto, p.nombre_producto, p.sku, p.stock
       FROM ItemsCarrito ic
       JOIN Productos p ON ic.id_producto = p.id_producto
       WHERE ic.id_carrito = ? AND p.activo = TRUE`,
      [id_carrito]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    // 3. Verificar stock y calcular subtotal
    let subtotal_productos = 0;
    for (const item of cartItems) {
      if (item.stock < item.cantidad) {
        await connection.rollback();
        return res.status(400).json({ message: `Stock insuficiente para ${item.nombre_producto} (SKU: ${item.sku}). Disponible: ${item.stock}` });
      }
      subtotal_productos += item.precio_unitario_al_agregar * item.cantidad;
    }

    const total_pedido = parseFloat(subtotal_productos) + costo_envio;
    const codigo_pedido = generateOrderCode();

    // 4. Crear Pedido
    const [pedidoResult] = await connection.query(
      `INSERT INTO Pedidos (id_usuario, id_direccion_envio, codigo_pedido, estado_pedido, subtotal_productos, costo_envio, total_pedido, metodo_pago_info, referencia_pago_qr)
       VALUES (?, ?, ?, 'pendiente_pago', ?, ?, ?, ?, ?)`,
      [id_usuario, id_direccion_envio, codigo_pedido, subtotal_productos, costo_envio, total_pedido, 'QR Transferencia', codigo_pedido]
    );
    const id_pedido = pedidoResult.insertId;

    // 5. Mover items del carrito a DetallesPedido y decrementar stock
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO DetallesPedido (id_pedido, id_producto, nombre_producto_historico, sku_historico, cantidad_comprada, precio_unitario_compra, subtotal_item)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_pedido, item.id_producto, item.nombre_producto, item.sku, item.cantidad, item.precio_unitario_al_agregar, (item.precio_unitario_al_agregar * item.cantidad)]
      );
      await connection.query('UPDATE Productos SET stock = stock - ? WHERE id_producto = ?', [item.cantidad, item.id_producto]);
    }

    // 6. Limpiar carrito del usuario
    await connection.query('DELETE FROM ItemsCarrito WHERE id_carrito = ?', [id_carrito]);
    
    await connection.commit();

    const qrPaymentData = await generateQrDataForPayment({
        codigo_pedido: codigo_pedido,
        total_pedido: total_pedido.toFixed(2)
    });

    res.status(201).json({
      message: 'Pedido creado exitosamente. Pendiente de pago.',
      id_pedido: id_pedido,
      codigo_pedido: codigo_pedido,
      total_pedido: total_pedido.toFixed(2),
      estado_pedido: 'pendiente_pago',
      paymentInfo: qrPaymentData
    });

  } catch (error) {
    if(connection) await connection.rollback();
    next(error);
  } finally {
    if(connection) connection.release();
  }
};

const getUserOrders = async (req, res, next) => {
    const id_usuario = req.user.id_usuario;
    try {
        const [orders] = await dbPool.query(
            `SELECT p.id_pedido, p.codigo_pedido, p.fecha_pedido, p.estado_pedido, p.total_pedido,
                    (SELECT COUNT(*) FROM QuejasPedido qp WHERE qp.id_pedido = p.id_pedido) > 0 AS tiene_queja
             FROM Pedidos p
             WHERE p.id_usuario = ? 
             ORDER BY p.fecha_pedido DESC`,
            [id_usuario]
        );
        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

const getOrderDetails = async (req, res, next) => {
    const id_usuario = req.user.id_usuario; // O admin
    const { orderId } = req.params;
    try {
        const queryParams = [orderId];
        let orderQuery = `SELECT p.id_pedido, p.codigo_pedido, p.fecha_pedido, p.estado_pedido, 
                                 p.subtotal_productos, p.costo_envio, p.total_pedido, p.metodo_pago_info, p.referencia_pago_qr,
                                 d.calle_avenida, d.numero_vivienda, d.referencia_adicional, ze.nombre_zona,
                                 u.nombre_completo AS nombre_cliente, u.email AS email_cliente, u.telefono AS telefono_cliente
                          FROM Pedidos p
                          JOIN Direcciones d ON p.id_direccion_envio = d.id_direccion
                          JOIN ZonasEntrega ze ON d.id_zona = ze.id_zona
                          JOIN Usuarios u ON p.id_usuario = u.id_usuario
                          WHERE p.id_pedido = ?`;

        if (req.user.rol !== 'administrador') {
            orderQuery += ' AND p.id_usuario = ?';
            queryParams.push(id_usuario);
        }

        const [orderHeaderRows] = await dbPool.query(orderQuery, queryParams);

        if (orderHeaderRows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado o no autorizado.' });
        }
        const orderHeader = orderHeaderRows[0];

        const [orderDetailsRows] = await dbPool.query(
            `SELECT id_detalle_pedido, id_producto, nombre_producto_historico, sku_historico, 
                    cantidad_comprada, precio_unitario_compra, subtotal_item 
             FROM DetallesPedido 
             WHERE id_pedido = ?`,
            [orderId]
        );
        
        // Verificar si hay queja asociada
        const [complaintRows] = await dbPool.query(
            'SELECT id_queja, descripcion_queja, fecha_queja, estado_queja, respuesta_admin, fecha_respuesta_admin FROM QuejasPedido WHERE id_pedido = ?',
            [orderId]
        );

        res.status(200).json({ ...orderHeader, detalles: orderDetailsRows, queja: complaintRows.length > 0 ? complaintRows[0] : null });
    } catch (error) {
        next(error);
    }
};

// --- Quejas ---
const submitOrderComplaint = async (req, res, next) => {
    const id_usuario = req.user.id_usuario;
    const { orderId } = req.params; // id_pedido
    const { descripcion_queja } = req.body;

    if (!descripcion_queja || descripcion_queja.trim() === '') {
        return res.status(400).json({ message: 'La descripción de la queja es requerida.' });
    }

    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verificar que el pedido exista, pertenezca al usuario y esté en estado 'entregado'
        const [orderRows] = await connection.query(
            "SELECT id_pedido FROM Pedidos WHERE id_pedido = ? AND id_usuario = ? AND estado_pedido = 'entregado'",
            [orderId, id_usuario]
        );
        if (orderRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'No se puede registrar queja: Pedido no encontrado, no pertenece al usuario o no ha sido entregado.' });
        }
        // 2. Verificar que no exista ya una queja para este pedido
        const [existingComplaint] = await connection.query(
            'SELECT id_queja FROM QuejasPedido WHERE id_pedido = ?',
            [orderId]
        );
        if (existingComplaint.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Ya existe una queja registrada para este pedido.' });
        }
        // 3. Insertar la queja
        const [result] = await connection.query(
            'INSERT INTO QuejasPedido (id_pedido, id_usuario, descripcion_queja, estado_queja) VALUES (?, ?, ?, ?)',
            [orderId, id_usuario, descripcion_queja, 'pendiente_revision_admin']
        );

        await connection.commit();
        res.status(201).json({ message: 'Queja registrada exitosamente.', id_queja: result.insertId });

    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

const getUserComplaintForOrder = async (req, res, next) => {
    const id_usuario = req.user.id_usuario;
    const { orderId } = req.params;
    try {
        const [complaintRows] = await dbPool.query(
            `SELECT qp.id_queja, qp.id_pedido, qp.descripcion_queja, qp.fecha_queja, qp.estado_queja, 
                    qp.respuesta_admin, qp.fecha_respuesta_admin, p.codigo_pedido
             FROM QuejasPedido qp
             JOIN Pedidos p ON qp.id_pedido = p.id_pedido
             WHERE qp.id_pedido = ? AND qp.id_usuario = ?`,
            [orderId, id_usuario]
        );
        if (complaintRows.length === 0) {
            return res.status(200).json(null); // No hay queja o no pertenece al usuario
        }
        res.status(200).json(complaintRows[0]);
    } catch (error) {
        next(error);
    }
};


module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  submitOrderComplaint,
  getUserComplaintForOrder,
};
