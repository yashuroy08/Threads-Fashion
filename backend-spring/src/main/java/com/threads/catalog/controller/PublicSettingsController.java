package com.threads.catalog.controller;

import com.threads.catalog.model.AdminSettings;
import com.threads.catalog.service.AdminSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class PublicSettingsController {

    private final AdminSettingsService adminSettingsService;

    @GetMapping("/public")
    public ResponseEntity<AdminSettings> getPublicSettings() {
        return ResponseEntity.ok(adminSettingsService.getSettings());
    }
}
