// backend/controllers/adminController.js
const dbPool = require('../config/db');

// --- Gestión de Categorías ---
const getAllCategoriesAdmin = async (req, res, next) => {
  try {
    const [categories] = await dbPool.query(
        'SELECT id_categoria, nombre_categoria, slug_categoria, descripcion_categoria, imagen_url_categoria, activo FROM Categorias ORDER BY nombre_categoria'
    );
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  const { nombre_categoria, descripcion_categoria, imagen_url_categoria, slug_categoria, activo } = req.body;
  if (!nombre_categoria || !slug_categoria) {
    return res.status(400).json({ message: 'Nombre y slug de categoría son requeridos.' });
  }
  try {
    const [result] = await dbPool.query(
      'INSERT INTO Categorias (nombre_categoria, descripcion_categoria, imagen_url_categoria, slug_categoria, activo) VALUES (?, ?, ?, ?, ?)',
      [nombre_categoria, descripcion_categoria || null, imagen_url_categoria || null, slug_categoria, activo !== undefined ? activo : true]
    );
    res.status(201).json({ id_categoria: result.insertId, nombre_categoria, slug_categoria });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El nombre o slug de la categoría ya existe.' });
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { nombre_categoria, descripcion_categoria, imagen_url_categoria, slug_categoria, activo } = req.body;
  if (!nombre_categoria || !slug_categoria) {
    return res.status(400).json({ message: 'Nombre y slug de categoría son requeridos.' });
  }
  try {
    const [result] = await dbPool.query(
      'UPDATE Categorias SET nombre_categoria = ?, descripcion_categoria = ?, imagen_url_categoria = ?, slug_categoria = ?, activo = ? WHERE id_categoria = ?',
      [nombre_categoria, descripcion_categoria || null, imagen_url_categoria || null, slug_categoria, activo !== undefined ? activo : true, categoryId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }
    res.status(200).json({ message: 'Categoría actualizada exitosamente.' });
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El nuevo nombre o slug de la categoría ya existe.' });
    }
    next(error);
  }
};

// --- Gestión de Productos ---
const createProduct = async (req, res, next) => {
  const { id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio, stock, sku, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo } = req.body;
  if (!id_categoria || !nombre_producto || !slug_producto || precio === undefined || stock === undefined || !sku) {
    return res.status(400).json({ message: 'Campos requeridos: id_categoria, nombre_producto, slug_producto, precio, stock, sku.' });
  }
  try {
    const [result] = await dbPool.query(
      'INSERT INTO Productos (id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio, stock, sku, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_categoria, nombre_producto, slug_producto, descripcion_corta || null, descripcion_larga || null, precio, stock, sku, imagen_principal_url || null, galeria_imagenes_urls ? JSON.stringify(galeria_imagenes_urls) : null, materiales || null, peso_gramos || null, dimensiones || null, activo !== undefined ? activo : true]
    );
     if (stock <= 5 && stock > 0) { 
        console.warn(`ALERTA DE STOCK BAJO (Admin): Producto SKU ${sku} (ID: ${result.insertId}) CREADO con stock ${stock}.`);
    }
    res.status(201).json({ id_producto: result.insertId, nombre_producto, sku });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' && (error.sqlMessage.includes('slug_producto_unique') || error.sqlMessage.includes('sku_unique'))) {
        return res.status(400).json({ message: 'El SKU o slug del producto ya existe.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_categoria')) {
        return res.status(400).json({ message: 'La categoría especificada no existe.' });
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
    const { productId } = req.params;
    const { id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio, stock, sku, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo } = req.body;

    if (!id_categoria || !nombre_producto || !slug_producto || precio === undefined || stock === undefined || !sku) {
        return res.status(400).json({ message: 'Campos requeridos: id_categoria, nombre_producto, slug_producto, precio, stock, sku.' });
    }
    try {
        const [result] = await dbPool.query(
            `UPDATE Productos SET 
                id_categoria = ?, nombre_producto = ?, slug_producto = ?, descripcion_corta = ?, 
                descripcion_larga = ?, precio = ?, stock = ?, sku = ?, imagen_principal_url = ?, 
                galeria_imagenes_urls = ?, materiales = ?, peso_gramos = ?, dimensiones = ?, activo = ?
            WHERE id_producto = ?`,
            [
                id_categoria, nombre_producto, slug_producto, descripcion_corta || null, 
                descripcion_larga || null, precio, stock, sku, imagen_principal_url || null,
                galeria_imagenes_urls ? JSON.stringify(galeria_imagenes_urls) : null, 
                materiales || null, peso_gramos || null, dimensiones || null, activo,
                productId
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        if (stock <= 5 && stock > 0) { 
            console.warn(`ALERTA DE STOCK BAJO (Admin): Producto SKU ${sku} (ID: ${productId}) ACTUALIZADO a stock ${stock}.`);
        } else if (stock === 0) {
             console.info(`INFO STOCK (Admin): Producto SKU ${sku} (ID: ${productId}) ahora tiene stock 0.`);
        }
        res.status(200).json({ message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' && (error.sqlMessage.includes('slug_producto_unique') || error.sqlMessage.includes('sku_unique'))) {
            return res.status(400).json({ message: 'El nuevo SKU o slug del producto ya existe.' });
        }
         if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_categoria')) {
            return res.status(400).json({ message: 'La categoría especificada no existe.' });
        }
        next(error);
    }
};

const getAllProductsAdmin = async (req, res, next) => {
    try {
        const [products] = await dbPool.query(
            `SELECT p.id_producto, p.nombre_producto, p.slug_producto, p.id_categoria,
                    p.precio, p.stock, p.sku, p.activo, 
                    p.descripcion_corta, p.descripcion_larga, 
                    p.imagen_principal_url, p.galeria_imagenes_urls,
                    p.materiales, p.peso_gramos, p.dimensiones,
                    c.nombre_categoria 
             FROM Productos p 
             JOIN Categorias c ON p.id_categoria = c.id_categoria 
             ORDER BY p.nombre_producto`
        );
        const productsParsed = products.map(p => ({
            ...p,
            galeria_imagenes_urls: p.galeria_imagenes_urls ? JSON.parse(p.galeria_imagenes_urls) : []
        }));
        res.status(200).json(productsParsed);
    } catch (error) {
        next(error);
    }
};

const getProductDetailsAdmin = async (req, res, next) => {
    const { productId } = req.params;
    try {
        const [productRows] = await dbPool.query(
            `SELECT p.*, c.nombre_categoria 
             FROM Productos p
             LEFT JOIN Categorias c ON p.id_categoria = c.id_categoria
             WHERE p.id_producto = ?`, 
            [productId]
        );
        if (productRows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        const product = productRows[0];
        try {
            product.galeria_imagenes_urls = product.galeria_imagenes_urls ? JSON.parse(product.galeria_imagenes_urls) : [];
        } catch (e) {
            product.galeria_imagenes_urls = []; 
        }
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const getLowStockProducts = async (req, res, next) => {
    const stockLimit = 5; 
    try {
        console.log("ADMIN DEBUG: Entrando a getLowStockProducts en el controlador."); 
        const [products] = await dbPool.query(
            `SELECT id_producto, nombre_producto, sku, stock, imagen_principal_url 
             FROM Productos
             WHERE stock <= ? AND stock > 0 AND activo = TRUE
             ORDER BY stock ASC, nombre_producto ASC`,
            [stockLimit]
        );
        console.log("ADMIN DEBUG: Productos con stock bajo encontrados:", products.length); // Log de cuántos productos encontró
        res.status(200).json(products);
    } catch (error) {
        console.error("ADMIN ERROR en getLowStockProducts (controller):", error); 
        next(error);
    }
};

// --- Gestión de Pedidos (Admin) ---
const getAllOrdersAdmin = async (req, res, next) => {
    const { estado, fecha_inicio, fecha_fin, cliente_email } = req.query;
    let query = `
        SELECT p.id_pedido, p.codigo_pedido, p.fecha_pedido, p.estado_pedido, p.total_pedido, 
               u.nombre_completo AS cliente_nombre, u.email AS cliente_email
        FROM Pedidos p
        JOIN Usuarios u ON p.id_usuario = u.id_usuario
    `;
    const conditions = [];
    const params = [];

    if (estado) { conditions.push("p.estado_pedido = ?"); params.push(estado); }
    if (fecha_inicio) { conditions.push("DATE(p.fecha_pedido) >= ?"); params.push(fecha_inicio); }
    if (fecha_fin) { conditions.push("DATE(p.fecha_pedido) <= ?"); params.push(fecha_fin); }
    if (cliente_email) { conditions.push("u.email LIKE ?"); params.push(`%${cliente_email}%`); }

    if (conditions.length > 0) { query += " WHERE " + conditions.join(" AND "); }
    query += " ORDER BY p.fecha_pedido DESC";

    try {
        const [orders] = await dbPool.query(query, params);
        res.status(200).json(orders);
    } catch (error) { next(error); }
};

const updateOrderStatusAdmin = async (req, res, next) => {
    const { orderId } = req.params;
    const { nuevo_estado } = req.body;
    const validStates = ['pendiente_pago','pagado','en_proceso','enviado','entregado','cancelado','fallido'];
    if (!nuevo_estado || !validStates.includes(nuevo_estado)) {
        return res.status(400).json({ message: 'Estado de pedido no válido.' });
    }
    try {
        const [result] = await dbPool.query( "UPDATE Pedidos SET estado_pedido = ? WHERE id_pedido = ?", [nuevo_estado, orderId] );
        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Pedido no encontrado.' }); }
        res.status(200).json({ message: `Estado del pedido ${orderId} actualizado a ${nuevo_estado}.`});
    } catch (error) { next(error); }
};

// --- Gestión de Quejas (Admin) ---
const getAllComplaintsAdmin = async (req, res, next) => {
    const { estado } = req.query;
    let query = `
        SELECT q.id_queja, q.id_pedido, q.fecha_queja, q.estado_queja, 
               p.codigo_pedido, u.nombre_completo AS cliente_nombre, u.email AS cliente_email,
               SUBSTRING(q.descripcion_queja, 1, 100) AS descripcion_corta 
        FROM QuejasPedido q
        JOIN Pedidos p ON q.id_pedido = p.id_pedido
        JOIN Usuarios u ON q.id_usuario = u.id_usuario
    `;
    const params = [];
    if (estado) { query += " WHERE q.estado_queja = ?"; params.push(estado); }
    query += " ORDER BY q.fecha_queja DESC";
    try {
        const [complaints] = await dbPool.query(query, params);
        res.status(200).json(complaints);
    } catch (error) { next(error); }
};

const getComplaintDetailsAdmin = async (req, res, next) => {
    const { complaintId } = req.params;
    try {
        const [complaintRows] = await dbPool.query(
             `SELECT q.*, p.codigo_pedido, u.nombre_completo AS cliente_nombre, u.email AS cliente_email, u.telefono AS cliente_telefono
              FROM QuejasPedido q
              JOIN Pedidos p ON q.id_pedido = p.id_pedido
              JOIN Usuarios u ON q.id_usuario = u.id_usuario
              WHERE q.id_queja = ?`,
            [complaintId]
        );
        if (complaintRows.length === 0) { return res.status(404).json({ message: 'Queja no encontrada.' }); }
        res.status(200).json(complaintRows[0]);
    } catch (error) { next(error); }
};

const respondToComplaintAdmin = async (req, res, next) => {
    const { complaintId } = req.params;
    const { respuesta_admin, nuevo_estado_queja } = req.body;

    if (!respuesta_admin || !nuevo_estado_queja) {
        return res.status(400).json({ message: 'Respuesta y nuevo estado son requeridos.' });
    }
    const validStates = ['en_proceso_admin', 'resuelta_favorable_cliente', 'resuelta_desfavorable_cliente', 'cerrada_admin'];
    if (!validStates.includes(nuevo_estado_queja)) {
        return res.status(400).json({ message: 'Estado de queja no válido.' });
    }

    try {
        const [result] = await dbPool.query(
            'UPDATE QuejasPedido SET respuesta_admin = ?, estado_queja = ?, fecha_respuesta_admin = NOW() WHERE id_queja = ?',
            [respuesta_admin, nuevo_estado_queja, complaintId]
        );
        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Queja no encontrada.' }); }
        res.status(200).json({ message: 'Respuesta a la queja enviada y estado actualizado.' });
    } catch (error) { next(error); }
};

module.exports = {
  createCategory, updateCategory, getAllCategoriesAdmin,
  createProduct, updateProduct,
  getAllProductsAdmin, getProductDetailsAdmin,
  getLowStockProducts, 
  getAllOrdersAdmin, updateOrderStatusAdmin,
  getAllComplaintsAdmin, getComplaintDetailsAdmin, respondToComplaintAdmin,
};
