import { Request } from 'express';
import { AuditLogModel } from '../../modules/catalog/models/audit-log.model';

interface LogActivityParams {
    userId: string;
    actionType: string;
    description: string;
    req?: Request;
    metadata?: Record<string, any>;
}

export const logUserActivity = async ({
    userId,
    actionType,
    description,
    req,
    metadata
}: LogActivityParams) => {
    try {
        const ipAddress = req?.ip || 'unknown';
        const userAgent = req?.headers['user-agent'] || 'unknown';

        await AuditLogModel.create({
            userId,
            actionType,
            actionDescription: description,
            ipAddress,
            userAgent,
            metadata,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('[AuditLog] Failed to log activity:', error);
        // We do not throw error here to avoid blocking the main flow
    }
};
