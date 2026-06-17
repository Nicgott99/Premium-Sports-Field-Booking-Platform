export const success = (data, message = 'Success', statusCode = 200) => ({
  success: true,
  statusCode,
  message,
  data,
  timestamp: new Date().toISOString(),
});

export const error = (message = 'Error', statusCode = 400, errors = null) => ({
  success: false,
  statusCode,
  message,
  errors,
  timestamp: new Date().toISOString(),
});

export const paginated = (data, page, limit, total) => ({
  success: true,
  statusCode: 200,
  data,
  meta: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
  timestamp: new Date().toISOString(),
});

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json(success(data, message, statusCode));
};

export const sendError = (res, message = 'Error', statusCode = 400, errors = null) => {
  res.status(statusCode).json(error(message, statusCode, errors));
};

export const sendPaginated = (res, data, page, limit, total) => {
  res.status(200).json(paginated(data, page, limit, total));
};
