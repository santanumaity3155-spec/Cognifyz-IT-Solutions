import { randomUUID } from 'crypto';

/**
 * Middleware to generate or forward a unique Request ID for every incoming HTTP request.
 * Sets req.id and the response header X-Request-Id.
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim().length > 0)
    ? incomingId.trim()
    : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestIdMiddleware;

