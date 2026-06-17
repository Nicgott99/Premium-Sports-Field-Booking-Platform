export const optimizeQuery = (query, fields = null) => {
  if (fields) {
    query = query.select(fields);
  }
  return query.lean();
};

export const paginateQuery = async (query, page = 1, limit = 10, fields = null) => {
  const skip = (page - 1) * limit;
  let optimized = query.skip(skip).limit(limit);

  if (fields) {
    optimized = optimized.select(fields);
  }

  optimized = optimized.lean();

  const data = await optimized.exec();
  const total = await query.model.countDocuments(query.getFilter());

  return {
    data,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

export const excludeFields = (fields) => {
  return fields.map(f => `-${f}`).join(' ');
};

export const selectFields = (fields) => {
  return fields.join(' ');
};
