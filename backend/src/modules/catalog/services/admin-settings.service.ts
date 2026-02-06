import { AdminSettingsModel } from '../models/admin-settings.model';


export const getSettings = async () => {
    let settings = await AdminSettingsModel.findOne();
    if (!settings) {
        // Create default if not exists
        settings = await AdminSettingsModel.create({});
    }
    return settings;
};

export const updateSettings = async (data: any) => {
    let settings = await AdminSettingsModel.findOne();
    if (!settings) {
        settings = await AdminSettingsModel.create(data);
    } else {
        Object.assign(settings, data);
        await settings.save();
    }
    return settings;
};
export const getPublicSettings = async () => {
    let settings = await AdminSettingsModel.findOne();
    if (!settings) {
        settings = await AdminSettingsModel.create({});
    }
    // Return only safe fields
    return {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        maintenanceMode: settings.maintenanceMode,
        returnWindowDays: settings.returnWindowDays,
        exchangeWindowDays: settings.exchangeWindowDays,
        warehouseZipCode: settings.warehouseZipCode
    };
};
