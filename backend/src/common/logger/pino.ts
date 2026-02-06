import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino(
    isDev
        ? {
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            },
        }
        : {
            redact: {
                paths: ['req.headers.authorization', 'req.body.password', 'req.body.token', 'req.body.creditCard'],
                remove: true
            }
        }
);
