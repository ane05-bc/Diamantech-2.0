const dbPool = require('../config/db');

// --- Gestión de Categorías ---
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
      [nombre_categoria, descripcion_categoria || null, imagen_url_categoria || null, slug_categoria, activo, categoryId]
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
  const { id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio_base, sku_base, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo } = req.body;
  if (!id_categoria || !nombre_producto || !slug_producto || !precio_base || !sku_base) {
    return res.status(400).json({ message: 'Campos requeridos: id_categoria, nombre_producto, slug_producto, precio_base, sku_base.' });
  }
  try {
    const [result] = await dbPool.query(
      'INSERT INTO Productos (id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio_base, sku_base, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id_categoria, nombre_producto, slug_producto, descripcion_corta || null, descripcion_larga || null, precio_base, sku_base, imagen_principal_url || null, galeria_imagenes_urls ? JSON.stringify(galeria_imagenes_urls) : null, materiales || null, peso_gramos || null, dimensiones || null, activo !== undefined ? activo : true]
    );
    res.status(201).json({ id_producto: result.insertId, nombre_producto, sku_base });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El SKU base o slug del producto ya existe.' });
    }
     if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_categoria')) {
        return res.status(400).json({ message: 'La categoría especificada no existe.' });
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
    const { productId } = req.params;
    const { id_categoria, nombre_producto, slug_producto, descripcion_corta, descripcion_larga, precio_base, sku_base, imagen_principal_url, galeria_imagenes_urls, materiales, peso_gramos, dimensiones, activo } = req.body;

    if (!id_categoria || !nombre_producto || !slug_producto || !precio_base || !sku_base) {
        return res.status(400).json({ message: 'Campos requeridos: id_categoria, nombre_producto, slug_producto, precio_base, sku_base.' });
    }
    try {
        const [result] = await dbPool.query(
            `UPDATE Productos SET 
                id_categoria = ?, nombre_producto = ?, slug_producto = ?, descripcion_corta = ?, 
                descripcion_larga = ?, precio_base = ?, sku_base = ?, imagen_principal_url = ?, 
                galeria_imagenes_urls = ?, materiales = ?, peso_gramos = ?, dimensiones = ?, activo = ?
            WHERE id_producto = ?`,
            [
                id_categoria, nombre_producto, slug_producto, descripcion_corta || null, 
                descripcion_larga || null, precio_base, sku_base, imagen_principal_url || null,
                galeria_imagenes_urls ? JSON.stringify(galeria_imagenes_urls) : null, 
                materiales || null, peso_gramos || null, dimensiones || null, activo,
                productId
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json({ message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El nuevo SKU base o slug del producto ya existe.' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_categoria')) {
            return res.status(400).json({ message: 'La categoría especificada no existe.' });
        }
        next(error);
    }
};


// --- Gestión de Variantes de Producto (incluye stock) ---
const createProductVariant = async (req, res, next) => {
  const { id_producto, sku_variante, atributos_variante, precio_adicional, stock, imagen_variante_url } = req.body;
  if (!id_producto || !sku_variante || !atributos_variante) {
    return res.status(400).json({ message: 'Campos requeridos: id_producto, sku_variante, atributos_variante.' });
  }
  const stockValue = stock !== undefined ? stock : 0;
  try {
    const [result] = await dbPool.query(
      'INSERT INTO VariantesProducto (id_producto, sku_variante, atributos_variante, precio_adicional, stock, imagen_variante_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id_producto, sku_variante, JSON.stringify(atributos_variante), precio_adicional || 0, stockValue, imagen_variante_url || null]
    );
     if (stockValue <= 5 && stockValue > 0) {
        console.warn(`ALERTA DE STOCK BAJO: Variante SKU ${sku_variante} (ID: ${result.insertId}) creada con stock ${stockValue}.`);
        // Aquí se podría añadir lógica para notificar al admin
    }
    res.status(201).json({ id_variante: result.insertId, sku_variante });
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El SKU de la variante ya existe.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.sqlMessage.includes('id_producto')) {
        return res.status(400).json({ message: 'El producto base especificado no existe.' });
    }
    next(error);
  }
};

const updateProductVariant = async (req, res, next) => {
  const { variantId } = req.params;
  const { sku_variante, atributos_variante, precio_adicional, stock, imagen_variante_url } = req.body;
   if (!sku_variante || atributos_variante === undefined) { // Stock y precio pueden ser 0, atributos_variante puede ser {}
    return res.status(400).json({ message: 'Campos requeridos: sku_variante, atributos_variante.' });
  }
  const stockValue = stock !== undefined ? stock : 0; // Asegurar que stock tenga un valor
  try {
    // Obtener stock actual para comparar si es necesario (no implementado aquí para simplificar)
    const [result] = await dbPool.query(
      'UPDATE VariantesProducto SET sku_variante = ?, atributos_variante = ?, precio_adicional = ?, stock = ?, imagen_variante_url = ? WHERE id_variante = ?',
      [sku_variante, JSON.stringify(atributos_variante), precio_adicional !== undefined ? precio_adicional : 0, stockValue, imagen_variante_url || null, variantId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Variante no encontrada.' });
    }

    // Alerta de Stock Mínimo
    if (stockValue <= 5 && stockValue > 0) {
        console.warn(`ALERTA DE STOCK BAJO: Variante SKU ${sku_variante} (ID: ${variantId}) actualizada a stock ${stockValue}.`);
        // Aquí se podría añadir lógica para notificar al admin (e.g., guardar en tabla NotificacionesAdmin)
    } else if (stockValue === 0) {
         console.info(`INFO STOCK: Variante SKU ${sku_variante} (ID: ${variantId}) ahora tiene stock 0.`);
    }


    res.status(200).json({ message: 'Variante actualizada exitosamente (stock incluido).' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El nuevo SKU de la variante ya existe.' });
    }
    next(error);
  }
};

// TODO: Implementar deleteCategory, deleteProduct, deleteProductVariant con cuidado
// TODO: Implementar funciones para que el admin vea pedidos, actualice estados de pedido, vea alertas de stock.

module.exports = {
  createCategory,
  updateCategory,
  createProduct,
  updateProduct,
  createProductVariant,
  updateProductVariant,
};