import pinoHttp from 'pino-http';
import { logger } from '../logger/pino';

export const httpLogger = pinoHttp({
    logger,
});

declare global {
    namespace Express {
        // Extend the Request interface to include our custom property
        export interface Request {
            // The property can be optional (?) or required, and specify its type
            requestId?: string;
        }
    }
}
