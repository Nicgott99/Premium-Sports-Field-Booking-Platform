export const apiVersion = {
  v1: 1,
  v2: 2,
  current: 1,
};

export const versionMiddleware = (req, res, next) => {
  const version = parseInt(req.get('X-API-Version')) || apiVersion.current;
  req.apiVersion = version;
  res.setHeader('X-API-Version', version);
  next();
};

export const deprecate = (version) => {
  return (req, res, next) => {
    if (req.apiVersion <= version) {
      res.setHeader('X-Deprecation', 'true');
      res.setHeader('X-Deprecation-Message', `API v${req.apiVersion} is deprecated. Use v${version + 1}.`);
    }
    next();
  };
};

export const supportVersion = (minVersion, maxVersion) => {
  return (req, res, next) => {
    if (req.apiVersion < minVersion || req.apiVersion > maxVersion) {
      return res.status(400).json({
        success: false,
        error: `API version ${req.apiVersion} not supported. Use v${minVersion}-v${maxVersion}.`,
      });
    }
    next();
  };
};
