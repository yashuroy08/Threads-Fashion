import { AppError } from './app-error';

export const NotFoundError = (message = 'Resource not found') =>
    new AppError(message, 404);

export const BadRequestError = (message = 'Bad request') =>
    new AppError(message, 400);

export const UnauthorizedError = (message = 'Unauthorized') =>
    new AppError(message, 401);

export const ForbiddenError = (message = 'Forbidden') =>
    new AppError(message, 403);
