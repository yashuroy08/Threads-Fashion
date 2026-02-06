type LogLevel = 'info' | 'warn' | 'error';

export const log = (
    level: LogLevel,
    message: string,
    context?: Record<string, any>
) => {
    const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context,
    };

    console[level === 'error' ? 'error' : 'log'](
        JSON.stringify(logEntry)
    );
};
