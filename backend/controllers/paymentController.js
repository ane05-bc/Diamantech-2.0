const dbPool = require('../config/db');

const simulatePaymentConfirmation = async (req, res, next) => {
  const { orderId } = req.body;
  const id_usuario = req.user.id_usuario; 

  if (!orderId) {
    return res.status(400).json({ message: 'ID del pedido es requerido.' });
  }

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verificar el pedido
    const [orderRows] = await connection.query(
      'SELECT id_pedido, estado_pedido, id_usuario FROM Pedidos WHERE id_pedido = ?',
      [orderId]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }
    const order = orderRows[0];

    if (order.id_usuario !== id_usuario) {
        await connection.rollback();
        return res.status(403).json({ message: 'No autorizado para modificar este pedido.' });
    }

    if (order.estado_pedido !== 'pendiente_pago') {
      await connection.rollback();
      return res.status(400).json({ message: `El pedido ya no está pendiente de pago. Estado actual: ${order.estado_pedido}` });
    }

    // 2. Actualizar estado del pedido a 'pagado' y luego a 'en_proceso'
    await connection.query(
      "UPDATE Pedidos SET estado_pedido = 'pagado' WHERE id_pedido = ?",
      [orderId]
    );
    // Simulación inmediata de cambio a 'en_proceso'
    await connection.query(
      "UPDATE Pedidos SET estado_pedido = 'en_proceso' WHERE id_pedido = ?",
      [orderId]
    );

    await connection.commit();

    res.status(200).json({
      message: 'Pago confirmado exitosamente. Tu pedido está en proceso.',
      orderId: orderId,
      newStatus: 'en_proceso'
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  simulatePaymentConfirmation,
};
