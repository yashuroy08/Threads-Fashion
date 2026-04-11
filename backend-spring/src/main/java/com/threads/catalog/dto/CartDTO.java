package com.threads.catalog.dto;

import com.threads.catalog.model.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDTO {
    private String id;
    private String userId;
    private List<CartItemDTO> items;
    private List<SavedItemDTO> savedForLater;
    private long total; // mapped from cartTotal for frontend
    private long cartTotal; // original

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDTO {
        private ProductDTO product;
        private String productId;
        private int quantity;
        private long priceSnapshot;
        private String titleSnapshot;
        private String imageSnapshot;
        private String size;
        private String color;
        private Date addedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavedItemDTO {
        private String productId;
        private Date addedAt;
    }
}
