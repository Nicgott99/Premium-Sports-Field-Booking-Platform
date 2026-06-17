import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const path = req.path;
  const userId = req.user?.id || 'anonymous';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusMsg = statusCode >= 400 ? '❌' : '✅';

    logger.info(`${statusMsg} ${method} ${path} - ${statusCode} - ${duration}ms - User: ${userId}`);

    if (statusCode >= 500) {
      logger.error(`Server error on ${method} ${path} - Status: ${statusCode}`);
    }
  });

  next();
};

export const errorLogger = (err, req, res, next) => {
  const method = req.method;
  const path = req.path;
  const userId = req.user?.id || 'anonymous';

  logger.error(`Error on ${method} ${path}: ${err.message}`, {
    userId,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  next(err);
};
