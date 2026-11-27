"use strict";

/**
 * Rate limiter sederhana tanpa dependency tambahan.
 * Cocok untuk mencegah brute-force login pada satu proses server.
 */
function createRateLimiter(options) {
  const settings = Object.assign({ windowMs: 10 * 60 * 1000, max: 10 }, options || {});
  const hits = new Map();

  function keyFor(req) {
    const username = req.body && req.body.username ? String(req.body.username).toLowerCase() : "";
    return (req.ip || (req.socket && req.socket.remoteAddress) || "unknown") + ":" + username;
  }

  function middleware(req, res, next) {
    const now = Date.now();
    const key = keyFor(req);
    const record = hits.get(key) || { count: 0, resetAt: now + settings.windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + settings.windowMs;
    }

    if (record.count >= settings.max) {
      const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        ok: false,
        error: {
          code: "TOO_MANY_ATTEMPTS",
          message: "Terlalu banyak percobaan. Coba lagi dalam " + retryAfter + " detik."
        }
      });
    }

    record.count += 1;
    hits.set(key, record);
    return next();
  }

  middleware.reset = function (req) {
    hits.delete(keyFor(req));
  };

  return middleware;
}

module.exports = { createRateLimiter };
