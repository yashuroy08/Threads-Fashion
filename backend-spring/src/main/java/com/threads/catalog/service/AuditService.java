package com.threads.catalog.service;

import com.threads.catalog.model.AuditLog;
import com.threads.catalog.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String actionType, String userId, String description) {
        AuditLog entry = AuditLog.builder()
                .actionType(actionType)
                .userId(userId)
                .actionDescription(description)
                .timestamp(Instant.now())
                .build();
        auditLogRepository.save(entry);
        log.info("AUDIT action={} by={}", actionType, userId);
    }

    public void log(String actionType, String userId, String description, String ipAddress, String userAgent) {
        AuditLog entry = AuditLog.builder()
                .actionType(actionType)
                .userId(userId)
                .actionDescription(description)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .timestamp(Instant.now())
                .build();
        auditLogRepository.save(entry);
        log.info("AUDIT action={} by={} ip={}", actionType, userId, ipAddress);
    }

    public Page<AuditLog> getAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
