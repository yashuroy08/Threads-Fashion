package com.threads.catalog.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Date;

@Document(collection = "otps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Otp {

    @Id
    private String id;

    @NotBlank
    private String userId;

    @NotBlank
    private String otpHash;

    @Builder.Default
    private int attempts = 0;

    @NotBlank
    private String type; // registration, password_reset, login_verification, phone_verification

    @Indexed(expireAfterSeconds = 0) // TTL index — expires at the date stored in this field
    @NotNull
    private Date expiresAt;

    @CreatedDate
    private Instant createdAt;
}
