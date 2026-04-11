package com.threads.catalog.repository;

import com.threads.catalog.model.AdminSettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AdminSettingsRepository extends MongoRepository<AdminSettings, String> {
}
