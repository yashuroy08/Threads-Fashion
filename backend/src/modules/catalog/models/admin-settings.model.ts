import { Schema, model, Document } from 'mongoose';

export interface AdminSettingsDocument extends Document {
    storeName: string;
    supportEmail: string;
    supportPhone: string;
    orderCancelWindowHours: number; // e.g., 24
    returnWindowDays: number; // e.g., 7
    exchangeWindowDays: number; // e.g., 7
    maintenanceMode: boolean;
    warehouseZipCode: string;
    updatedAt: Date;
}

const AdminSettingsSchema = new Schema<AdminSettingsDocument>(
    {
        storeName: { type: String, default: 'Threads Fashion' },
        supportEmail: { type: String, default: 'support@threadsfashion.com' },
        supportPhone: { type: String, default: '+1-800-123-4567' },
        orderCancelWindowHours: { type: Number, default: 24 },
        returnWindowDays: { type: Number, default: 7 },
        exchangeWindowDays: { type: Number, default: 7 },
        maintenanceMode: { type: Boolean, default: false },
        warehouseZipCode: { type: String, default: '110001' }, // Default to New Delhi if not set
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const AdminSettingsModel = model<AdminSettingsDocument>('AdminSettings', AdminSettingsSchema);
