import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { log } from '../utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // CRITICAL: Log to console for debugging
    console.error('\n========== ERROR ==========');
    console.error('[ERROR MESSAGE]:', err.message);
    console.error('[ERROR STACK]:', err.stack);
    console.error('===========================\n');

    log('error', err.message, {
        requestId: req.requestId,
        path: req.originalUrl,
        stack: err.stack,
    });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message,
            requestId: req.requestId,
        });
    }

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        const errors = (err as any).errors;
        const message = errors
            ? Object.values(errors).map((val: any) => val.message).join(', ')
            : err.message;

        return res.status(400).json({
            message: message || err.message,
            requestId: req.requestId,
        });
    }

    // Handle Mongoose Duplicate Key Errors
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        return res.status(409).json({
            message: `Duplicate ${field} entered. Please use a different ${field}.`,
            requestId: req.requestId,
        });
    }

    res.status(500).json({
        message: 'Internal server error',
        requestId: req.requestId,
    });
};
