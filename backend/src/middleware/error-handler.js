function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrió un error inesperado.'
  });
}

module.exports = { errorHandler };
