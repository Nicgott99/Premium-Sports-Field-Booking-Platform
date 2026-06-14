const WEIGHTS = { nameMatch: 40, sportMatch: 30, areaMatch: 15, ratingBonus: 10, availabilityBonus: 5 };

const tokenize = (str) => (str ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);

const scoreField = (field, query, filters) => {
  let score = 0;
  const qTokens = tokenize(query);

  if (qTokens.length) {
    const nameTokens = tokenize(field.name);
    const hits = qTokens.filter(t => nameTokens.some(n => n.includes(t) || t.includes(n)));
    score += (hits.length / qTokens.length) * WEIGHTS.nameMatch;
    if (tokenize(field.sport).some(t => qTokens.includes(t))) score += WEIGHTS.sportMatch;
    if (tokenize(field.area ?? field.location).some(t => qTokens.some(q => t.includes(q)))) score += WEIGHTS.areaMatch;
  }

  if (filters.sport && field.sport?.toLowerCase() === filters.sport.toLowerCase()) score += WEIGHTS.sportMatch;
  if (filters.area  && (field.area ?? field.location ?? '').toLowerCase().includes(filters.area.toLowerCase())) score += WEIGHTS.areaMatch;
  if (field.rating >= 4.5) score += WEIGHTS.ratingBonus;
  if (field.available !== false) score += WEIGHTS.availabilityBonus;

  if (filters.minPrice && field.pricePerHour < filters.minPrice) return -1;
  if (filters.maxPrice && field.pricePerHour > filters.maxPrice) return -1;
  if (filters.minRating && field.rating < filters.minRating) return -1;

  return score;
};

const search = (fields, query = '', filters = {}, options = {}) => {
  const { page = 1, limit = 20, sortBy = 'relevance' } = options;

  const scored = fields
    .map(f => ({ field: f, score: scoreField(f, query, filters) }))
    .filter(r => r.score >= 0);

  const sorted = scored.sort((a, b) => {
    if (sortBy === 'price_asc')  return (a.field.pricePerHour ?? 0) - (b.field.pricePerHour ?? 0);
    if (sortBy === 'price_desc') return (b.field.pricePerHour ?? 0) - (a.field.pricePerHour ?? 0);
    if (sortBy === 'rating')     return (b.field.rating ?? 0) - (a.field.rating ?? 0);
    if (sortBy === 'name')       return (a.field.name ?? '').localeCompare(b.field.name ?? '');
    return b.score - a.score;
  });

  const total  = sorted.length;
  const offset = (page - 1) * limit;
  const results = sorted.slice(offset, offset + limit).map(r => ({ ...r.field, _score: r.score }));

  return { results, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const buildSuggestions = (fields, partial) => {
  if (!partial || partial.length < 2) return [];
  const q = partial.toLowerCase();
  const seen = new Set();
  const suggestions = [];
  for (const f of fields) {
    for (const candidate of [f.name, f.sport, f.area, f.location]) {
      if (!candidate) continue;
      const lower = candidate.toLowerCase();
      if (lower.includes(q) && !seen.has(lower)) {
        seen.add(lower);
        suggestions.push({ text: candidate, type: candidate === f.name ? 'field' : candidate === f.sport ? 'sport' : 'area' });
      }
    }
    if (suggestions.length >= 8) break;
  }
  return suggestions;
};

module.exports = { search, buildSuggestions, scoreField, tokenize };
