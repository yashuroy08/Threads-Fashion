import { Request, Response, NextFunction } from 'express';

export const cacheResponse =
    (seconds: number) =>
        (_req: Request, res: Response, next: NextFunction) => {
            res.setHeader(
                'Cache-Control',
                `public, max-age=${seconds}, stale-while-revalidate=${seconds}`
            );
            next();
        };
