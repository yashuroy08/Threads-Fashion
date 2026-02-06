import { Schema, model, Document } from 'mongoose';

export interface AuditLogDocument extends Document {
    userId: string;
    actionType: string;
    actionDescription: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        actionType: {
            type: String, // e.g., 'LOGIN', 'ORDER_PLACED', 'RETURN_REQUESTED'
            required: true,
            index: true,
        },
        actionDescription: {
            type: String,
            required: true,
        },
        ipAddress: {
            type: String,
            default: 'unknown'
        },
        userAgent: {
            type: String,
            default: 'unknown'
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: false, // We use custom timestamp field
        versionKey: false,
    }
);

export const AuditLogModel = model<AuditLogDocument>(
    'AuditLog',
    AuditLogSchema
);
