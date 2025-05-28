const errorHandler = (err, req, res, next) => {
  console.error('------------------------------------');
  console.error('Error no controlado detectado:');
  console.error('Ruta:', req.path);
  console.error('Método:', req.method);
  console.error('Mensaje de Error:', err.message);
  console.error('Stack de Error:', err.stack); 
  console.error('------------------------------------');

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    message: err.message || 'Ocurrió un error interno en el servidor.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;