const errorHandler = (err, req, res, next) => {
  // Translate Prisma error codes to meaningful HTTP status codes
  if (err.code) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      err.statusCode = 409;
      err.message = err.message?.includes('student_id')
        ? 'A record for this student already exists. Please update instead of creating a new one.'
        : 'A record with that value already exists.';
    } else if (err.code === 'P2025') {
      // Record not found
      err.statusCode = 404;
      err.message = 'The requested record was not found.';
    } else if (err.code === 'P2003') {
      // Foreign key constraint
      err.statusCode = 400;
      err.message = 'Related record not found.';
    }
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (statusCode >= 500) {
    console.error('[EXPRESS-SERVER-ERROR]', err);
  } else if (process.env.NODE_ENV !== 'test') {
    console.warn(`[EXPRESS-CLIENT-ERROR] HTTP ${statusCode}: ${err.message || 'Client Error'}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
