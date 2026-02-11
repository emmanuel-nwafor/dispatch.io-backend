import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    // Log for the developer (you) to see in the terminal
    console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);

    // 1. Mongoose Validation Error (Like your "seker" typo)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
        return res.status(400).json({
            success: false,
            error: 'Validation Failed',
            details: message
        });
    }

    // 2. Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            error: 'Resource not found'
        });
    }

    // 3. JWT Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    // 4. Default: Internal Server Error
    return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error',
        // Only show stack trace in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};