export const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};

export const paginate = (items, page = 1, limit = 10) => {
  const { skip } = getPagination(page, limit);
  const data = items.slice(skip, skip + limit);
  const total = items.length;
  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

export const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};
