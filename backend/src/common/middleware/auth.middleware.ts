import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../errors/app-error';

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyToken(token) as any;
        req.user = decoded;
        next();
    } catch {
        throw new AppError('Invalid or expired token', 401);
    }
};
