-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 02-06-2025 a las 23:33:13
-- Versión del servidor: 10.4.24-MariaDB
-- Versión de PHP: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `diamantech_bd`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito`
--

CREATE TABLE `carrito` (
  `id_carrito` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` bigint(20) UNSIGNED NOT NULL,
  `nombre_categoria` varchar(100) NOT NULL,
  `slug_categoria` varchar(100) NOT NULL,
  `descripcion_categoria` text DEFAULT NULL,
  `imagen_url_categoria` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre_categoria`, `slug_categoria`, `descripcion_categoria`, `imagen_url_categoria`, `activo`) VALUES
(1, 'Anillos', 'anillos', 'Elegancia que adorna tus manos.', 'img/categorias/anillos.jpg', 1),
(2, 'Pendientes', 'pendientes', 'Diseños que iluminan tu rostro.', 'img/categorias/pendientes.jpg', 1),
(3, 'Collares', 'collares', 'El toque final perfecto para tu escote.', 'img/categorias/collares.jpg', 1),
(4, 'Pulseras', 'pulseras', 'Detalles que hablan de tu estilo.', 'img/categorias/pulseras.jpeg', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detallespedido`
--

CREATE TABLE `detallespedido` (
  `id_detalle_pedido` bigint(20) UNSIGNED NOT NULL,
  `id_pedido` bigint(20) UNSIGNED NOT NULL,
  `id_producto` bigint(20) UNSIGNED NOT NULL,
  `nombre_producto_historico` varchar(255) NOT NULL,
  `sku_historico` varchar(100) NOT NULL,
  `cantidad_comprada` int(11) NOT NULL,
  `precio_unitario_compra` decimal(10,2) NOT NULL,
  `subtotal_item` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `id_direccion` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `id_zona` int(10) UNSIGNED NOT NULL,
  `calle_avenida` varchar(255) NOT NULL,
  `numero_vivienda` varchar(50) NOT NULL,
  `referencia_adicional` text DEFAULT NULL,
  `nombre_destinatario` varchar(255) DEFAULT NULL,
  `es_predeterminada` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `itemscarrito`
--

CREATE TABLE `itemscarrito` (
  `id_item_carrito` bigint(20) UNSIGNED NOT NULL,
  `id_carrito` bigint(20) UNSIGNED NOT NULL,
  `id_producto` bigint(20) UNSIGNED NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario_al_agregar` decimal(10,2) NOT NULL,
  `fecha_agregado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `id_direccion_envio` bigint(20) UNSIGNED NOT NULL,
  `codigo_pedido` varchar(50) NOT NULL,
  `fecha_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado_pedido` enum('pendiente_pago','pagado','en_proceso','enviado','entregado','cancelado','fallido') NOT NULL DEFAULT 'pendiente_pago',
  `subtotal_productos` decimal(10,2) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_pedido` decimal(10,2) NOT NULL,
  `metodo_pago_info` varchar(100) DEFAULT 'QR Transferencia',
  `referencia_pago_qr` varchar(255) DEFAULT NULL,
  `notas_cliente` text DEFAULT NULL,
  `fecha_ultima_actualizacion_estado` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` bigint(20) UNSIGNED NOT NULL,
  `id_categoria` bigint(20) UNSIGNED NOT NULL,
  `nombre_producto` varchar(255) NOT NULL,
  `slug_producto` varchar(255) NOT NULL,
  `descripcion_corta` varchar(255) DEFAULT NULL,
  `descripcion_larga` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(100) NOT NULL,
  `imagen_principal_url` varchar(255) DEFAULT NULL,
  `galeria_imagenes_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`galeria_imagenes_urls`)),
  `materiales` varchar(255) DEFAULT NULL,
  `peso_gramos` decimal(8,2) DEFAULT NULL,
  `dimensiones` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `id_categoria`, `nombre_producto`, `slug_producto`, `descripcion_corta`, `descripcion_larga`, `precio`, `stock`, `sku`, `imagen_principal_url`, `galeria_imagenes_urls`, `materiales`, `peso_gramos`, `dimensiones`, `activo`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(1, 1, 'Anillo Diamante Solitario', 'anillosdiamante', 'Clásico anillo de compromiso con diamante brillante.', 'Fabricado en oro blanco de 18k, este anillo presenta un diamante central de 0.5 quilates, corte brillante, color G, claridad VS1. Diseño atemporal que simboliza el amor eterno. ', '1250.00', 10, 'DIA-AN-SOL01', 'img/catalogo/anillos/anillo2.jpg', '[\"img1.jpg\", \"img2.jpg\"]', 'Oro Blanco 18k, Diamante', '3.50', 'Talla 5-9', 1, '2025-05-29 23:15:38', '2025-05-29 23:15:38');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `quejaspedido`
--

CREATE TABLE `quejaspedido` (
  `id_queja` bigint(20) UNSIGNED NOT NULL,
  `id_pedido` bigint(20) UNSIGNED NOT NULL,
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `descripcion_queja` text NOT NULL,
  `fecha_queja` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado_queja` enum('pendiente_revision_admin','en_proceso_admin','resuelta_favorable_cliente','resuelta_desfavorable_cliente','cerrada_admin') NOT NULL DEFAULT 'pendiente_revision_admin',
  `respuesta_admin` text DEFAULT NULL,
  `fecha_respuesta_admin` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` bigint(20) UNSIGNED NOT NULL,
  `nombre_completo` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(25) DEFAULT NULL,
  `rol` enum('cliente','administrador') NOT NULL DEFAULT 'cliente',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_conexion` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `zonasentrega`
--

CREATE TABLE `zonasentrega` (
  `id_zona` int(10) UNSIGNED NOT NULL,
  `nombre_zona` varchar(100) NOT NULL,
  `costo_envio_zona` decimal(10,2) NOT NULL DEFAULT 10.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `zonasentrega`
--

INSERT INTO `zonasentrega` (`id_zona`, `nombre_zona`, `costo_envio_zona`) VALUES
(1, 'Zona Central', '10.00'),
(2, 'Sopocachi', '12.00'),
(3, 'Miraflores', '12.00'),
(4, 'Obrajes (Zona Sur)', '15.00'),
(5, 'Calacoto (Zona Sur)', '15.00'),
(6, 'Irpavi (Zona Sur)', '18.00'),
(7, 'Achumani (Zona Sur)', '18.00'),
(8, 'El Alto - Ciudad Satélite', '20.00');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carrito`
--
ALTER TABLE `carrito`
  ADD PRIMARY KEY (`id_carrito`),
  ADD UNIQUE KEY `id_usuario_carrito_unique` (`id_usuario`);

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `nombre_categoria_unique` (`nombre_categoria`),
  ADD UNIQUE KEY `slug_categoria_unique` (`slug_categoria`);

--
-- Indices de la tabla `detallespedido`
--
ALTER TABLE `detallespedido`
  ADD PRIMARY KEY (`id_detalle_pedido`),
  ADD KEY `fk_itemspedido_pedido` (`id_pedido`),
  ADD KEY `fk_itemspedido_producto` (`id_producto`);

--
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id_direccion`),
  ADD KEY `fk_direcciones_usuario` (`id_usuario`),
  ADD KEY `fk_direcciones_zona` (`id_zona`);

--
-- Indices de la tabla `itemscarrito`
--
ALTER TABLE `itemscarrito`
  ADD PRIMARY KEY (`id_item_carrito`),
  ADD UNIQUE KEY `carrito_producto_unique` (`id_carrito`,`id_producto`),
  ADD KEY `fk_itemscarrito_carrito` (`id_carrito`),
  ADD KEY `fk_itemscarrito_producto` (`id_producto`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD UNIQUE KEY `codigo_pedido_unique` (`codigo_pedido`),
  ADD KEY `fk_pedidos_usuario` (`id_usuario`),
  ADD KEY `fk_pedidos_direccion` (`id_direccion_envio`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD UNIQUE KEY `sku_unique` (`sku`),
  ADD UNIQUE KEY `slug_producto_unique` (`slug_producto`),
  ADD KEY `fk_productos_categoria` (`id_categoria`);

--
-- Indices de la tabla `quejaspedido`
--
ALTER TABLE `quejaspedido`
  ADD PRIMARY KEY (`id_queja`),
  ADD UNIQUE KEY `id_pedido_queja_unique` (`id_pedido`),
  ADD KEY `fk_quejas_pedido` (`id_pedido`),
  ADD KEY `fk_quejas_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email_unique` (`email`);

--
-- Indices de la tabla `zonasentrega`
--
ALTER TABLE `zonasentrega`
  ADD PRIMARY KEY (`id_zona`),
  ADD UNIQUE KEY `nombre_zona_unique` (`nombre_zona`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `carrito`
--
ALTER TABLE `carrito`
  MODIFY `id_carrito` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `detallespedido`
--
ALTER TABLE `detallespedido`
  MODIFY `id_detalle_pedido` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  MODIFY `id_direccion` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `itemscarrito`
--
ALTER TABLE `itemscarrito`
  MODIFY `id_item_carrito` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `quejaspedido`
--
ALTER TABLE `quejaspedido`
  MODIFY `id_queja` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `zonasentrega`
--
ALTER TABLE `zonasentrega`
  MODIFY `id_zona` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carrito`
--
ALTER TABLE `carrito`
  ADD CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detallespedido`
--
ALTER TABLE `detallespedido`
  ADD CONSTRAINT `fk_detallespedido_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detallespedido_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD CONSTRAINT `fk_direcciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_direcciones_zona` FOREIGN KEY (`id_zona`) REFERENCES `zonasentrega` (`id_zona`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `itemscarrito`
--
ALTER TABLE `itemscarrito`
  ADD CONSTRAINT `fk_itemscarrito_carrito` FOREIGN KEY (`id_carrito`) REFERENCES `carrito` (`id_carrito`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_itemscarrito_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_direccion` FOREIGN KEY (`id_direccion_envio`) REFERENCES `direcciones` (`id_direccion`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `quejaspedido`
--
ALTER TABLE `quejaspedido`
  ADD CONSTRAINT `fk_quejas_pedido_ref` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_quejas_usuario_ref` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
