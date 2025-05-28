const dbPool = require('../config/db');
const { generateQrDataForPayment } = require('../utils/qrGenerator'); // Asumiendo que qrGenerator está en utils

// Función para generar un código de pedido único
const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `DIA-${timestamp}-${randomPart}`;
};

const createOrder = async (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { nombre_cliente_envio, direccion_envio_completa, email_contacto_envio, costo_envio = 10.00 } = req.body; // costo_envio podría ser configurable

  if (!nombre_cliente_envio || !direccion_envio_completa || !email_contacto_envio) {
    return res.status(400).json({ message: 'Información de envío incompleta.' });
  }

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener carrito del usuario
    const [cartHeaderRows] = await connection.query('SELECT id_carrito FROM Carrito WHERE id_usuario = ?', [id_usuario]);
    if (cartHeaderRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'No se encontró carrito para este usuario.' });
    }
    const id_carrito = cartHeaderRows[0].id_carrito;

    const [cartItems] = await connection.query(
      `SELECT 
        ic.id_item_carrito, ic.cantidad, ic.precio_unitario_al_agregar,
        pv.id_variante, pv.sku_variante, pv.atributos_variante, pv.stock,
        p.id_producto, p.nombre_producto, (p.precio_base + pv.precio_adicional) AS precio_actual_variante
       FROM ItemsCarrito ic
       JOIN VariantesProducto pv ON ic.id_variante = pv.id_variante
       JOIN Productos p ON pv.id_producto = p.id_producto
       WHERE ic.id_carrito = ?`,
      [id_carrito]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    // 2. Verificar stock y calcular subtotal
    let subtotal_pedido = 0;
    for (const item of cartItems) {
      if (item.stock < item.cantidad) {
        await connection.rollback();
        return res.status(400).json({ message: `Stock insuficiente para ${item.nombre_producto} (Variante: ${item.sku_variante}). Disponible: ${item.stock}` });
      }
      subtotal_pedido += item.precio_unitario_al_agregar * item.cantidad;
    }

    const total_pedido = parseFloat(subtotal_pedido) + parseFloat(costo_envio);
    const codigo_pedido = generateOrderCode(); // Generar código único para el pedido

    // 3. Crear Pedido en la tabla Pedidos
    const [pedidoResult] = await connection.query(
      `INSERT INTO Pedidos (id_usuario, codigo_pedido, fecha_pedido, estado_pedido, nombre_cliente_envio, direccion_envio_completa, email_contacto_envio, subtotal_pedido, costo_envio, total_pedido, metodo_pago_info)
       VALUES (?, ?, NOW(), 'pendiente_pago', ?, ?, ?, ?, ?, ?, ?)`,
      [id_usuario, codigo_pedido, nombre_cliente_envio, direccion_envio_completa, email_contacto_envio, subtotal_pedido, costo_envio, total_pedido, 'QR Transferencia']
    );
    const id_pedido = pedidoResult.insertId;

    // 4. Mover items del carrito a DetallesPedido y decrementar stock
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO DetallesPedido (id_pedido, id_variante, cantidad, precio_unitario_compra, nombre_producto_compra, sku_variante_compra, atributos_variante_compra)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_pedido, item.id_variante, item.cantidad, item.precio_unitario_al_agregar, item.nombre_producto, item.sku_variante, JSON.stringify(item.atributos_variante || {})]
      );
      await connection.query('UPDATE VariantesProducto SET stock = stock - ? WHERE id_variante = ?', [item.cantidad, item.id_variante]);
    }

    // 5. Limpiar carrito del usuario (eliminar items)
    await connection.query('DELETE FROM ItemsCarrito WHERE id_carrito = ?', [id_carrito]);
    // Opcional: podrías eliminar el registro de Carrito si ya no tiene items, o marcarlo como inactivo/completado.

    await connection.commit();

    // 6. Generar datos para el QR
    const qrPaymentData = await generateQrDataForPayment({
        codigo_pedido: codigo_pedido, // Usar el código de pedido como referencia
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
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const getUserOrders = async (req, res, next) => {
    const id_usuario = req.user.id_usuario;
    try {
        const [orders] = await dbPool.query(
            `SELECT id_pedido, codigo_pedido, fecha_pedido, estado_pedido, total_pedido 
             FROM Pedidos 
             WHERE id_usuario = ? 
             ORDER BY fecha_pedido DESC`,
            [id_usuario]
        );
        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

const getOrderDetails = async (req, res, next) => {
    const id_usuario = req.user.id_usuario;
    const { orderId } = req.params; // Este es id_pedido
    try {
        const [orderHeaderRows] = await dbPool.query(
            `SELECT id_pedido, codigo_pedido, fecha_pedido, estado_pedido, nombre_cliente_envio, 
                    direccion_envio_completa, email_contacto_envio, subtotal_pedido, costo_envio, total_pedido, metodo_pago_info 
             FROM Pedidos 
             WHERE id_pedido = ? AND id_usuario = ?`,
            [orderId, id_usuario]
        );

        if (orderHeaderRows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado o no pertenece al usuario.' });
        }
        const orderHeader = orderHeaderRows[0];

        const [orderDetailsRows] = await dbPool.query(
            `SELECT id_detalle_pedido, id_variante, cantidad, precio_unitario_compra, 
                    nombre_producto_compra, sku_variante_compra, atributos_variante_compra 
             FROM DetallesPedido 
             WHERE id_pedido = ?`,
            [orderId]
        );
        
        const orderDetails = orderDetailsRows.map(d => ({
            ...d,
            atributos_variante_compra: d.atributos_variante_compra ? JSON.parse(d.atributos_variante_compra) : {}
        }));

        res.status(200).json({ ...orderHeader, detalles: orderDetails });
    } catch (error) {
        next(error);
    }
};


module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
};
