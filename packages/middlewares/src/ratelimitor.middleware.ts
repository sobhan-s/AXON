import rateLimit from 'express-rate-limit';

export function rateLimiter(maxRequests: number, windowMinutes: number) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      success: false,
      message: `Too many requests. Try again after ${windowMinutes} minutes`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
