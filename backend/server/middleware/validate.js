// middleware/validate.js
const { ZodError } = require('zod');

/**
 * Middleware factory that validates request data using a Zod schema.
 * The schema should accept an object with keys: body, query, params.
 *
 * Example:
 *   const loginSchema = z.object({
 *     body: z.object({
 *       email: z.string().email(),
 *       password: z.string().min(8)
 *     })
 *   });
 *   router.post('/login', validate(loginSchema), handler);
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Attempt to parse the relevant parts of the request.
    // We intentionally only validate body, query, and params.
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // If parsing succeeds, continue to the next middleware/handler.
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Format errors for client consumption.
      const errors = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        type: e.code,
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    // Unexpected error – pass to default error handler.
    return next(err);
  }
};

module.exports = { validate };