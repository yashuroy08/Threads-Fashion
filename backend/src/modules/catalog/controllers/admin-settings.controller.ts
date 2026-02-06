import { Request, Response } from 'express';
import { asyncHandler } from '../../../common/utils/async-handler';
import * as SettingsService from '../services/admin-settings.service';
import { getIO } from '../../../common/utils/socket'; // Assuming you have a socket context accessor

export const getSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
    const settings = await SettingsService.getSettings();
    res.json(settings);
});

export const updateSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
    const updated = await SettingsService.updateSettings(req.body);

    // Real-time broadcast
    try {
        const io = getIO();
        io.emit('SETTINGS_UPDATED', updated);
    } catch (e) {
        console.warn('Socket IO not initialized or failed to emit', e);
    }

    res.json(updated);
});

export const getPublicSettingsHandler = asyncHandler(async (req: Request, res: Response) => {
    const settings = await SettingsService.getPublicSettings();
    res.json(settings);
});
