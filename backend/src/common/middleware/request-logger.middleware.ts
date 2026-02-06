import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    res.on('finish', () => {
        const durationMs = Date.now() - start;

        log('info', 'HTTP Request', {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            contentLength: res.get('content-length'),
            userAgent: req.get('user-agent'),
            ip: req.ip,
            userId: req.user?.id,
            durationMs,
        });
    });

    next();
};
