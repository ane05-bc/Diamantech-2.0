const dbPool = require('../config/db');

// Obtener todas las categorías activas
const getAllCategories = async (req, res, next) => {
  try {
    const [categories] = await dbPool.query('SELECT id_categoria, nombre_categoria, slug_categoria, descripcion_categoria, imagen_url_categoria,activo FROM Categorias WHERE activo = TRUE ORDER BY nombre_categoria');
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// Obtener productos por slug de categoría
const getProductsByCategorySlug = async (req, res, next) => {
  const { categorySlug } = req.params;
  try {
    const [products] = await dbPool.query(
      `SELECT 
         p.id_producto, p.nombre_producto, p.slug_producto, p.descripcion_corta, 
         p.precio, p.stock, p.sku, p.imagen_principal_url
       FROM Productos p
       JOIN Categorias c ON p.id_categoria = c.id_categoria
       WHERE c.slug_categoria = ? AND p.activo = TRUE AND c.activo = TRUE AND p.stock > 0
       ORDER BY p.nombre_producto`,
      [categorySlug]
    );
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// Obtener un producto por su slug
const getProductBySlug = async (req, res, next) => {
  const { productSlug } = req.params;
  try {
    const [productRows] = await dbPool.query(
      `SELECT 
        p.id_producto, p.nombre_producto, p.slug_producto, p.descripcion_corta, p.descripcion_larga,
        p.precio, p.stock, p.sku, p.imagen_principal_url, p.galeria_imagenes_urls, 
        p.materiales, p.peso_gramos, p.dimensiones,
        c.nombre_categoria, c.slug_categoria
      FROM Productos p
      JOIN Categorias c ON p.id_categoria = c.id_categoria
      WHERE p.slug_producto = ? AND p.activo = TRUE AND c.activo = TRUE`,
      [productSlug]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado, no activo o sin stock.' });
    }
    const product = productRows[0];
    product.galeria_imagenes_urls = product.galeria_imagenes_urls ? JSON.parse(product.galeria_imagenes_urls) : [];
    
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getProductsByCategorySlug,
  getProductBySlug,
};
