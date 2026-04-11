package com.threads.catalog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Map;

@Document(collection = "auditlogs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    private String id;

    @Indexed
    @NotBlank
    private String userId;

    @Indexed
    @NotBlank
    private String actionType;

    @NotBlank
    private String actionDescription;

    @Builder.Default
    private String ipAddress = "unknown";

    @Builder.Default
    private String userAgent = "unknown";

    private Map<String, Object> metadata;

    @Indexed
    @Builder.Default
    private Instant timestamp = Instant.now();
}
