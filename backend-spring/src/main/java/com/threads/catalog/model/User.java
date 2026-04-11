package com.threads.catalog.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Builder.Default
    private String firstName = "";

    @Builder.Default
    private String lastName = "";

    @Indexed(unique = true)
    @Email
    @NotBlank
    private String email;

    private String password; // Optional for OAuth users

    @Indexed(unique = true, sparse = true)
    private String phoneNumber;

    @Builder.Default
    private String country = "";

    @Builder.Default
    private String gender = ""; // male, female, other

    @Indexed(unique = true, sparse = true)
    private String googleId;

    @Builder.Default
    private boolean isPhoneVerified = false;

    @Builder.Default
    private boolean isEmailVerified = false;

    @Builder.Default
    private String role = "user"; // admin, user

    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @Builder.Default
    private List<PaymentMethod> paymentMethods = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Address {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private String addressType; // default, primary, secondary
        @Builder.Default
        private boolean isDefault = false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentMethod {
        private String type; // card, upi
        private String cardBrand;
        private String last4;
        private String upiId;
        @Builder.Default
        private boolean isDefault = false;
    }
}
