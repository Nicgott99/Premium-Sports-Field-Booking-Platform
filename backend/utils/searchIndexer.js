import logger from './logger.js';

/**
 * Search indexing and full-text search utilities
 */

class SearchIndexer {
  constructor() {
    this.indexes = new Map();
    this.documents = new Map();
  }

  /**
   * Create index
   * @param {string} name - Index name
   * @param {array} fields - Fields to index
   */
  createIndex(name, fields = []) {
    this.indexes.set(name, {
      name,
      fields,
      terms: new Map(),
      createdAt: new Date(),
    });
    logger.info(`Search index created: ${name}`);
  }

  /**
   * Index document
   * @param {string} indexName - Index name
   * @param {string} docId - Document ID
   * @param {object} doc - Document
   */
  indexDocument(indexName, docId, doc) {
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }

    this.documents.set(`${indexName}:${docId}`, doc);

    // Index fields
    index.fields.forEach(field => {
      const value = this.getNestedValue(doc, field);
      if (value) {
        this.indexValue(index, field, value, docId);
      }
    });
  }

  /**
   * Index a value
   * @param {object} index - Index object
   * @param {string} field - Field name
   * @param {*} value - Value to index
   * @param {string} docId - Document ID
   */
  indexValue(index, field, value, docId) {
    const text = String(value).toLowerCase();
    const terms = this.tokenize(text);

    terms.forEach(term => {
      if (!index.terms.has(term)) {
        index.terms.set(term, new Set());
      }
      index.terms.get(term).add(docId);
    });
  }

  /**
   * Search index
   * @param {string} indexName - Index name
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {array} Search results
   */
  search(indexName, query, options = {}) {
    const index = this.indexes.get(indexName);
    if (!index) {
      return [];
    }

    const { limit = 10, offset = 0, fuzzy = false } = options;
    const terms = this.tokenize(query);
    const results = new Map();

    terms.forEach(term => {
      let matches = [];

      if (index.terms.has(term)) {
        matches = Array.from(index.terms.get(term));
      } else if (fuzzy) {
        // Fuzzy matching
        const fuzzyMatches = this.fuzzySearch(Array.from(index.terms.keys()), term);
        fuzzyMatches.forEach(fuzzyTerm => {
          matches.push(...Array.from(index.terms.get(fuzzyTerm)));
        });
      }

      matches.forEach(docId => {
        results.set(docId, (results.get(docId) || 0) + 1);
      });
    });

    // Sort by relevance
    const sorted = Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(offset, offset + limit)
      .map(([docId]) => this.documents.get(`${indexName}:${docId}`));

    return sorted;
  }

  /**
   * Tokenize text
   * @param {string} text - Text to tokenize
   * @returns {array} Tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Fuzzy search
   * @param {array} terms - Terms to search
   * @param {string} query - Search query
   * @returns {array} Matching terms
   */
  fuzzySearch(terms, query) {
    return terms.filter(term => {
      const distance = this.levenshteinDistance(term, query);
      return distance <= Math.ceil(query.length * 0.3); // 30% tolerance
    });
  }

  /**
   * Levenshtein distance
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Distance
   */
  levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Remove document from index
   * @param {string} indexName - Index name
   * @param {string} docId - Document ID
   */
  removeDocument(indexName, docId) {
    const index = this.indexes.get(indexName);
    if (!index) return;

    this.documents.delete(`${indexName}:${docId}`);

    for (const termDocs of index.terms.values()) {
      termDocs.delete(docId);
    }
  }

  /**
   * Clear index
   * @param {string} indexName - Index name
   */
  clearIndex(indexName) {
    const index = this.indexes.get(indexName);
    if (!index) return;

    index.terms.clear();

    // Remove all documents
    for (const key of this.documents.keys()) {
      if (key.startsWith(`${indexName}:`)) {
        this.documents.delete(key);
      }
    }
  }

  /**
   * Get index statistics
   * @param {string} indexName - Index name
   * @returns {object} Statistics
   */
  getStats(indexName) {
    const index = this.indexes.get(indexName);
    if (!index) return null;

    return {
      name: indexName,
      fields: index.fields,
      documentCount: Array.from(this.documents.keys())
        .filter(k => k.startsWith(`${indexName}:`)).length,
      termCount: index.terms.size,
      createdAt: index.createdAt,
    };
  }

  /**
   * Get nested value from object
   * @param {object} obj - Object
   * @param {string} path - Dot notation path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}

export const searchIndexer = new SearchIndexer();

export default searchIndexer;
