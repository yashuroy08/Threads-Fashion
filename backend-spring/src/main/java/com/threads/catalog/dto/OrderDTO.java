package com.threads.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private String id;
    private String orderId;
    private String userId;
    private List<OrderItemDTO> items;
    private long subtotal;
    private long tax;
    private long shippingCharges;
    private long total;
    private String status;
    private ShippingAddressDTO shippingAddress;
    private String paymentMethod;
    private boolean inventoryProcessed;
    private String cancellationReason;
    private String returnReason;
    private String exchangeReason;
    private Double distanceKm;
    private String sellerZipCode;
    private Date estimatedDeliveryDate;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDTO {
        private String productId;
        private String title;
        private int quantity;
        private long price;
        private String size;
        private String color;
        private String image;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingAddressDTO {
        private String street;
        private String city;
        private String state;
        private String zipCode;
    }
}
