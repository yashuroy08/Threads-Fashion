package com.threads.catalog.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "adminsettings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSettings {

    @Id
    private String id;

    @Builder.Default
    private String storeName = "Threads Fashion";

    @Builder.Default
    private String supportEmail = "support@threadsfashion.com";

    @Builder.Default
    private String supportPhone = "+1-800-123-4567";

    @Builder.Default
    private int orderCancelWindowHours = 24;

    @Builder.Default
    private int returnWindowDays = 7;

    @Builder.Default
    private int exchangeWindowDays = 7;

    @Builder.Default
    private boolean maintenanceMode = false;

    @Builder.Default
    private String warehouseZipCode = "110001";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
