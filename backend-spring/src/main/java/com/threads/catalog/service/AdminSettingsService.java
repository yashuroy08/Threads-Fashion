package com.threads.catalog.service;

import com.threads.catalog.model.AdminSettings;
import com.threads.catalog.repository.AdminSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminSettingsService {

    private final AdminSettingsRepository adminSettingsRepository;

    public AdminSettings getSettings() {
        return adminSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> adminSettingsRepository.save(AdminSettings.builder().build()));
    }

    public AdminSettings updateSettings(AdminSettings update) {
        AdminSettings current = getSettings();
        if (update.getStoreName() != null) current.setStoreName(update.getStoreName());
        if (update.getSupportEmail() != null) current.setSupportEmail(update.getSupportEmail());
        if (update.getSupportPhone() != null) current.setSupportPhone(update.getSupportPhone());
        if (update.getOrderCancelWindowHours() > 0) current.setOrderCancelWindowHours(update.getOrderCancelWindowHours());
        if (update.getReturnWindowDays() > 0) current.setReturnWindowDays(update.getReturnWindowDays());
        if (update.getExchangeWindowDays() > 0) current.setExchangeWindowDays(update.getExchangeWindowDays());
        current.setMaintenanceMode(update.isMaintenanceMode());
        if (update.getWarehouseZipCode() != null) current.setWarehouseZipCode(update.getWarehouseZipCode());

        AdminSettings saved = adminSettingsRepository.save(current);
        log.info("Admin settings updated");
        return saved;
    }
}
