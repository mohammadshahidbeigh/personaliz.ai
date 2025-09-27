import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message } = err;

  // Log error for debugging
  console.error('Error:', {
    statusCode,
    message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
