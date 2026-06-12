import zlib from 'zlib';
import logger from './logger.js';

/**
 * Compression and decompression utilities
 */

class CompressionManager {
  /**
   * Compress string with gzip
   * @param {string} data - Data to compress
   * @returns {Promise} Compressed data
   */
  static async gzipCompress(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Decompress gzip data
   * @param {Buffer} data - Compressed data
   * @returns {Promise} Decompressed string
   */
  static async gzipDecompress(data) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString('utf-8'));
      });
    });
  }

  /**
   * Compress with deflate
   * @param {string} data - Data to compress
   * @returns {Promise} Compressed data
   */
  static async deflateCompress(data) {
    return new Promise((resolve, reject) => {
      zlib.deflate(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  /**
   * Decompress deflate data
   * @param {Buffer} data - Compressed data
   * @returns {Promise} Decompressed string
   */
  static async deflateDecompress(data) {
    return new Promise((resolve, reject) => {
      zlib.inflate(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString('utf-8'));
      });
    });
  }

  /**
   * Calculate compression ratio
   * @param {string} original - Original data
   * @param {Buffer} compressed - Compressed data
   * @returns {number} Compression ratio
   */
  static calculateRatio(original, compressed) {
    const originalSize = Buffer.byteLength(original);
    const compressedSize = compressed.length;
    return ((1 - compressedSize / originalSize) * 100).toFixed(2);
  }

  /**
   * Compress JSON data
   * @param {object} data - JSON data
   * @returns {Promise} Compressed buffer
   */
  static async compressJson(data) {
    const json = JSON.stringify(data);
    return this.gzipCompress(json);
  }

  /**
   * Decompress JSON data
   * @param {Buffer} data - Compressed data
   * @returns {Promise} Decompressed object
   */
  static async decompressJson(data) {
    const json = await this.gzipDecompress(data);
    return JSON.parse(json);
  }

  /**
   * Create compression stream
   * @param {string} algorithm - Algorithm (gzip, deflate, brotli)
   * @returns {Stream} Compression stream
   */
  static createCompressStream(algorithm = 'gzip') {
    switch (algorithm) {
      case 'gzip':
        return zlib.createGzip();
      case 'deflate':
        return zlib.createDeflate();
      case 'brotli':
        return zlib.createBrotliCompress();
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }

  /**
   * Create decompression stream
   * @param {string} algorithm - Algorithm
   * @returns {Stream} Decompression stream
   */
  static createDecompressStream(algorithm = 'gzip') {
    switch (algorithm) {
      case 'gzip':
        return zlib.createGunzip();
      case 'deflate':
        return zlib.createInflate();
      case 'brotli':
        return zlib.createBrotliDecompress();
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }
}

/**
 * Compression middleware for Express
 * @param {object} options - Options
 * @returns {function} Middleware
 */
export const compressionMiddleware = (options = {}) => {
  const {
    algorithm = 'gzip',
    threshold = 1024, // Only compress if > 1KB
  } = options;

  return (req, res, next) => {
    const originalJson = res.json;

    res.json = async function(data) {
      const jsonString = JSON.stringify(data);

      if (Buffer.byteLength(jsonString) > threshold) {
        try {
          const compressed = await CompressionManager.compressJson(data);
          res.setHeader('Content-Encoding', algorithm);
          res.setHeader('X-Compression-Ratio', CompressionManager.calculateRatio(jsonString, compressed));
          logger.debug(`Response compressed: ${algorithm}`);
          return res.send(compressed);
        } catch (error) {
          logger.error('Compression failed:', error);
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

export { CompressionManager };

export default CompressionManager;
