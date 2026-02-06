import { Request, Response, NextFunction } from 'express';

export const noCache = (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
    );
    res.removeHeader('ETag');
    next();
};
