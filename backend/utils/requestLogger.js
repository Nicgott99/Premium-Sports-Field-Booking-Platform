export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
    };
    
    if (res.statusCode >= 400) {
      console.error('Request error:', log);
    } else {
      console.log('Request success:', log);
    }
  });
  
  next();
};

export const requestStats = {
  total: 0,
  success: 0,
  error: 0,
  totalTime: 0,

  record(statusCode, duration) {
    this.total++;
    this.totalTime += duration;
    if (statusCode >= 400) {
      this.error++;
    } else {
      this.success++;
    }
  },

  getStats() {
    return {
      total: this.total,
      success: this.success,
      error: this.error,
      avgTime: this.total > 0 ? Math.round(this.totalTime / this.total) : 0,
    };
  },

  reset() {
    this.total = 0;
    this.success = 0;
    this.error = 0;
    this.totalTime = 0;
  },
};
