import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';

export const requireRole =
    (role: 'admin' | 'user') =>
        (req: Request, _res: Response, next: NextFunction) => {
            if (!req.user || req.user.role !== role) {
                throw new AppError('Forbidden', 403);
            }
            next();
        };
