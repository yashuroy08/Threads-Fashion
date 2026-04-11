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
import java.util.ArrayList;
import java.util.List;

@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @NotBlank
    private String title;

    @Indexed(unique = true)
    @NotBlank
    private String slug;

    @NotBlank
    private String description;

    // Hierarchical categories
    @Indexed
    @NotNull
    private String parentCategoryId;

    @Indexed
    @NotNull
    private String childCategoryId;

    @NotNull
    private Price price;

    private List<ProductImage> images;

    // Filtering fields
    @Indexed
    @Builder.Default
    private List<String> sizes = new ArrayList<>();

    @Indexed
    @Builder.Default
    private List<String> colors = new ArrayList<>();

    @Indexed
    @Builder.Default
    private boolean isFeatured = false;

    @Builder.Default
    private Double discountPercentage = 0.0;

    @Indexed
    @Builder.Default
    private boolean isActive = true;

    @Builder.Default
    private boolean inStock = true;

    // Variant-level stock management
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    // Legacy fields (computed from variants)
    @Builder.Default
    @Min(0)
    private int stock = 0;

    @Builder.Default
    @Min(0)
    private int reservedStock = 0;

    @Builder.Default
    private String sellerZipCode = "110001";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Price {
        @Min(0)
        private int amount; // in paise
        @Builder.Default
        private String currency = "INR";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductImage {
        private String url;
        private String altText;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductVariant {
        private String size;
        private String color;
        @Builder.Default
        private int stock = 0;
        @Builder.Default
        private int reservedStock = 0;
        @Builder.Default
        private int availableStock = 0;
        private String sku;
    }

    /**
     * Replicates the Mongoose pre-save hook: sync sizes/colors from variants,
     * compute totals, and update inStock status.
     */
    public void syncFromVariants() {
        if (variants != null && !variants.isEmpty()) {
            this.sizes = variants.stream().map(ProductVariant::getSize)
                    .filter(s -> s != null && !s.isBlank())
                    .distinct().toList();
            this.colors = variants.stream().map(ProductVariant::getColor)
                    .filter(c -> c != null && !c.isBlank())
                    .distinct().toList();

            variants.forEach(v ->
                    v.setAvailableStock(v.getStock() - v.getReservedStock()));

            this.stock = variants.stream().mapToInt(ProductVariant::getStock).sum();
            this.reservedStock = variants.stream().mapToInt(ProductVariant::getReservedStock).sum();
            this.inStock = this.stock > 0;
        } else {
            this.inStock = this.stock > 0;
        }
    }

    /** Total available stock across all variants. */
    public int getAvailableStock() {
        return this.stock - this.reservedStock;
    }
}
