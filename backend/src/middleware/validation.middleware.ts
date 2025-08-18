// filepath: src/middleware/validation.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidateOptions {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
}

export function validate(schemas: ValidateOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
        let parsedParams = { ...req.params };

      if (schemas.params) {
        const parsed = schemas.params.parse(parsedParams);
        (req as any).validatedParams = parsed;
        // req.params = parsed as any;
      }
      let parsedQuery = { ...req.query };
      if (schemas.query) {
        const parsed = schemas.query.parse(parsedQuery);
        (req as any).validatedQuery = parsed;
        // req.query = parsed as any;
      }
      let parsedBody = { ...req.body };
      if (schemas.body) {
        const parsed = schemas.body.parse(parsedBody);
        (req as any).validatedBody = parsed;
        // req.body = parsed;
      }
      
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: err.flatten() });
      }
      return next(err);
    }
  };
}
