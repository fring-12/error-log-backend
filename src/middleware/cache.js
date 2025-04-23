import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

export const cacheMiddleware = (req, res, next) => {
  req.cache = cache;
  next();
};
