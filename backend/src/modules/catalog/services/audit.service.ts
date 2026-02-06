import { AuditLogModel } from '../models/audit-log.model';

type AuditInput = {
    actorId: string;
    actorRole: 'admin';
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, any>;
};

export const logAuditEvent = async (input: AuditInput) => {
    try {
        await AuditLogModel.create(input);
    } catch (err) {
        // IMPORTANT: audit logging must NEVER break main flow
        console.error('Audit log failed', err);
    }
};
