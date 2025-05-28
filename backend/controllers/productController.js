const dbPool = require('../config/db');

// Obtener todas las categorías activas
const getAllCategories = async (req, res, next) => {
  try {
    const [categories] = await dbPool.query('SELECT id_categoria, nombre_categoria, slug_categoria, descripcion_categoria, imagen_url_categoria FROM Categorias WHERE activo = TRUE ORDER BY nombre_categoria');
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
         p.precio_base, p.imagen_principal_url,
         (SELECT MIN(vp.precio_adicional) FROM VariantesProducto vp WHERE vp.id_producto = p.id_producto) as min_precio_adicional_variante
       FROM Productos p
       JOIN Categorias c ON p.id_categoria = c.id_categoria
       WHERE c.slug_categoria = ? AND p.activo = TRUE AND c.activo = TRUE
       ORDER BY p.nombre_producto`,
      [categorySlug]
    );

    // Simplificación: Devolvemos el precio base + el mínimo adicional de variante si existe.
    // Una lógica más compleja podría involucrar obtener todas las variantes.
    const productsWithFinalPrice = products.map(p => ({
        ...p,
        precio_final_desde: parseFloat(p.precio_base) + (parseFloat(p.min_precio_adicional_variante) || 0)
    }));

    res.status(200).json(productsWithFinalPrice);
  } catch (error) {
    next(error);
  }
};

// Obtener un producto por su slug (incluyendo variantes)
const getProductBySlug = async (req, res, next) => {
  const { productSlug } = req.params;
  try {
    const [productRows] = await dbPool.query(
      `SELECT 
        p.id_producto, p.nombre_producto, p.slug_producto, p.descripcion_corta, p.descripcion_larga,
        p.precio_base, p.sku_base, p.imagen_principal_url, p.galeria_imagenes_urls, 
        p.materiales, p.peso_gramos, p.dimensiones,
        c.nombre_categoria, c.slug_categoria
      FROM Productos p
      JOIN Categorias c ON p.id_categoria = c.id_categoria
      WHERE p.slug_producto = ? AND p.activo = TRUE AND c.activo = TRUE`,
      [productSlug]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado o no activo.' });
    }
    const product = productRows[0];

    const [variantRows] = await dbPool.query(
      `SELECT 
        id_variante, sku_variante, atributos_variante, precio_adicional, stock, imagen_variante_url 
      FROM VariantesProducto 
      WHERE id_producto = ? AND stock > 0`, // Solo variantes con stock
      [product.id_producto]
    );

    // Parsear JSON strings
    product.galeria_imagenes_urls = product.galeria_imagenes_urls ? JSON.parse(product.galeria_imagenes_urls) : [];
    const variants = variantRows.map(v => ({
      ...v,
      atributos_variante: v.atributos_variante ? JSON.parse(v.atributos_variante) : {}
    }));
    
    // Calcular precio final para cada variante
    const variantsWithFinalPrice = variants.map(variant => ({
        ...variant,
        precio_final_variante: parseFloat(product.precio_base) + parseFloat(variant.precio_adicional)
    }));


    res.status(200).json({ ...product, variantes: variantsWithFinalPrice });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllCategories,
  getProductsByCategorySlug,
  getProductBySlug,
};
