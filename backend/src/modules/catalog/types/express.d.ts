import 'express';
import 'http';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: 'admin' | 'user';
                email: string;
            };
            requestId?: string;
        }
    }
}

declare module 'http' {
    interface IncomingMessage {
        requestId?: string;
    }
}
