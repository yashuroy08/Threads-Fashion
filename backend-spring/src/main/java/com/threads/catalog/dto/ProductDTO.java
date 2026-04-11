package com.threads.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private String id;
    private String title;
    private String slug;
    private String description;
    private int priceAmount;
    private String currency;
    private List<ImageDTO> images;
    private List<String> sizes;
    private List<String> colors;
    @com.fasterxml.jackson.annotation.JsonProperty("isFeatured")
    private boolean isFeatured;
    private Double discountPercentage;
    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    private boolean isActive;
    @com.fasterxml.jackson.annotation.JsonProperty("inStock")
    private boolean inStock;
    private int stock;
    private int availableStock;
    private List<VariantDTO> variants;
    private String parentCategoryId;
    private String childCategoryId;
    private String parentCategoryName;
    private String childCategoryName;
    private String sellerZipCode;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDTO {
        private String url;
        private String altText;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantDTO {
        private String size;
        private String color;
        private int stock;
        private int reservedStock;
        private int availableStock;
        private String sku;
    }

    public java.util.Map<String, Object> getPrice() {
        java.util.Map<String, Object> priceMap = new java.util.HashMap<>();
        priceMap.put("amount", this.priceAmount);
        priceMap.put("currency", this.currency);
        return priceMap;
    }
}
