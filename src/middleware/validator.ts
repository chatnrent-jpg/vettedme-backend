import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware to validate request using express-validator
 * Collects validation errors and throws AppError if any exist
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => `${error.msg}`)
      .join(', ');

    throw new AppError(`Validation failed: ${errorMessages}`, 400);
  }

  next();
};
