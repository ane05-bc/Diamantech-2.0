// roles es un array de roles permitidos, ej: ['administrador'] o ['administrador', 'editor']
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) { // Asegúrate que protect haya adjuntado req.user con el rol
        return res.status(403).json({ message: 'Acceso denegado. Rol de usuario no disponible.' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: `Acceso denegado. Rol '${req.user.rol}' no tiene permiso para acceder a este recurso.` });
    }
    next();
  };
};

module.exports = { authorizeRoles };