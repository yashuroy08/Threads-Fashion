package com.threads.catalog.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Document(collection = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    private String id;

    @Indexed(unique = true)
    @NotBlank
    private String orderId;

    @Indexed
    @NotBlank
    private String userId;

    @NotNull
    private List<OrderItem> items;

    @Min(0)
    private long subtotal; // in paise

    @Min(0)
    private long tax; // in paise

    @Min(0)
    private long shippingCharges; // in paise

    @Min(0)
    private long total; // in paise

    @Builder.Default
    private String status = "PLACED";

    @NotNull
    private ShippingAddress shippingAddress;

    @Builder.Default
    private String paymentMethod = "card";

    private Object paymentDetails;

    private PaymentInfo paymentInfo;

    @Builder.Default
    private boolean inventoryProcessed = false;

    private String cancellationReason;
    private String returnReason;
    private String exchangeReason;

    // Delivery estimation
    private Date estimatedDeliveryDate;
    private Double distanceKm;
    private String sellerZipCode;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        @NotBlank
        private String productId;
        @NotBlank
        private String title;
        @Min(1)
        private int quantity;
        @Min(0)
        private long price; // in paise
        private String size;
        private String color;
        private String image;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddress {
        private String street;
        private String city;
        private String state;
        private String zipCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInfo {
        private String method;
        private String transactionId;
        private String razorpayOrderId;
        private String paymentStatus;
        private Date paidAt;
    }
}
