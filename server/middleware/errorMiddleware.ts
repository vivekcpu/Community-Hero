import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    success: false,
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};

// Custom async handler to replace express-async-handler
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
