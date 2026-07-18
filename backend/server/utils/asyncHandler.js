// utils/asyncHandler.js
/**
 * Wraps an async route handler to catch errors and pass them to Express error handler.
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;