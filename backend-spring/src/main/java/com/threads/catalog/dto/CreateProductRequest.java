package com.threads.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateProductRequest {

    @NotBlank(message = "Product title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Price amount is required")
    @Min(value = 0, message = "Price cannot be negative")
    private Integer priceAmount; // in paise

    @NotBlank(message = "Parent category ID is required")
    private String parentCategoryId;

    @NotBlank(message = "Child category ID is required")
    private String childCategoryId;

    private List<ImageInput> images;
    private List<VariantInput> variants;
    private boolean isFeatured;
    private Double discountPercentage;
    private String sellerZipCode;

    @Data
    public static class ImageInput {
        private String url;
        private String altText;
        private String color;
    }

    @Data
    public static class VariantInput {
        private String size;
        private String color;
        @Min(0)
        private int stock;
        private String sku;
    }
}
