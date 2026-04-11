package com.threads.catalog.service;

import com.threads.catalog.dto.CreateProductRequest;
import com.threads.catalog.dto.ProductDTO;
import com.threads.catalog.model.Category;
import com.threads.catalog.model.Product;
import com.threads.catalog.repository.CategoryRepository;
import com.threads.catalog.repository.ProductRepository;
import com.threads.common.exception.DuplicateResourceException;
import com.threads.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final MongoTemplate mongoTemplate;

    public Page<ProductDTO> findAll(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable).map(this::toDTO);
    }

    /**
     * Public product listing with the same query semantics as the Node catalog service:
     * optional parent/child category (ObjectId or slug), search, sort, and facet filters.
     */
    public Page<ProductDTO> findProducts(
            int page,
            int size,
            String parentCategory,
            String childCategory,
            String q,
            String sort,
            String sizes,
            String colors,
            Integer minPrice,
            Integer maxPrice) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Sort mongoSort = buildSort(sort);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, mongoSort);

        Optional<String> childId = resolveCategoryId(childCategory);
        Optional<String> parentId = resolveCategoryId(parentCategory);

        if (childCategory != null && !childCategory.isBlank() && childId.isEmpty()) {
            return Page.empty(pageable);
        }
        if (parentCategory != null && !parentCategory.isBlank() && parentId.isEmpty()
                && (childCategory == null || childCategory.isBlank())) {
            return Page.empty(pageable);
        }

        List<Criteria> ands = new ArrayList<>();
        // Match Mongoose defaults: treat missing / null isActive as active; exclude only explicit false.
        ands.add(new Criteria().orOperator(
                Criteria.where("isActive").is(true),
                Criteria.where("isActive").exists(false),
                Criteria.where("isActive").is(null)));

        if (childId.isPresent()) {
            ands.add(refIdMatches("childCategoryId", childId.get()));
        } else if (parentId.isPresent()) {
            ands.add(refIdMatches("parentCategoryId", parentId.get()));
        }

        if (q != null && !q.isBlank()) {
            String term = q.trim();
            ands.add(new Criteria().orOperator(
                    Criteria.where("title").regex(term, "i"),
                    Criteria.where("description").regex(term, "i")));
        }

        if (sizes != null && !sizes.isBlank()) {
            List<String> sizeList = Arrays.stream(sizes.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!sizeList.isEmpty()) {
                ands.add(Criteria.where("sizes").in(sizeList));
            }
        }
        if (colors != null && !colors.isBlank()) {
            List<String> colorList = Arrays.stream(colors.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            if (!colorList.isEmpty()) {
                ands.add(Criteria.where("colors").in(colorList));
            }
        }

        if (minPrice != null || maxPrice != null) {
            Criteria price = Criteria.where("price.amount");
            if (minPrice != null) {
                price = price.gte(minPrice);
            }
            if (maxPrice != null) {
                price = price.lte(maxPrice);
            }
            ands.add(price);
        }

        Criteria top = ands.size() == 1
                ? ands.get(0)
                : new Criteria().andOperator(ands.toArray(Criteria[]::new));

        Query countQuery = new Query(top);
        long total = mongoTemplate.count(countQuery, Product.class);

        Query pagedQuery = new Query(top).with(pageable);
        List<Product> list = mongoTemplate.find(pagedQuery, Product.class);
        List<ProductDTO> dtos = list.stream().map(this::toDTO).collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, total);
    }

    private Sort buildSort(String sort) {
        if (sort == null || sort.isBlank() || "newest".equals(sort)) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("price.amount"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price.amount"));
            case "featured" -> Sort.by(Sort.Order.desc("isFeatured"), Sort.Order.desc("createdAt"));
            default -> Sort.by(Sort.Order.desc("createdAt"));
        };
    }

    private Optional<String> resolveCategoryId(String param) {
        if (param == null || param.isBlank()) {
            return Optional.empty();
        }
        String trimmed = param.trim();
        if (looksLikeHexObjectId(trimmed)) {
            return Optional.of(trimmed);
        }
        return categoryRepository.findBySlug(trimmed.toLowerCase()).map(Category::getId);
    }

    private static boolean looksLikeHexObjectId(String s) {
        return s.length() == 24 && s.matches("[a-fA-F0-9]{24}");
    }

    /**
     * Category refs in Mongo may be stored as ObjectId (Mongoose) or String. Matching only one type returns no rows.
     */
    private static Criteria refIdMatches(String field, String id) {
        if (looksLikeHexObjectId(id)) {
            ObjectId oid = new ObjectId(id);
            return new Criteria().orOperator(
                    Criteria.where(field).is(id),
                    Criteria.where(field).is(oid));
        }
        return Criteria.where(field).is(id);
    }

    public ProductDTO findBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));
        return toDTO(product);
    }

    /**
     * Tries to find a product by slug first, then falls back to findById.
     * This handles the case where the frontend navigates using a productId (from order items)
     * instead of a slug.
     */
    public ProductDTO findBySlugOrId(String slugOrId) {
        // Try slug first
        Optional<Product> bySlug = productRepository.findBySlug(slugOrId);
        if (bySlug.isPresent()) {
            return toDTO(bySlug.get());
        }
        // Fall back to ID lookup
        return productRepository.findById(slugOrId)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slugOrId));
    }

    public ProductDTO findById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toDTO(product);
    }

    public Page<ProductDTO> search(String keyword, Pageable pageable) {
        return productRepository.searchByTitle(keyword, pageable).map(this::toDTO);
    }

    public List<ProductDTO> findFeatured() {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrue()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ----- Admin operations -----

    public Page<ProductDTO> findAllAdmin(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDTO);
    }

    public ProductDTO create(CreateProductRequest req) {
        // Generate slug from title
        String slug = req.getTitle().toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");

        if (productRepository.findBySlug(slug).isPresent()) {
            throw new DuplicateResourceException("Product with slug already exists: " + slug);
        }

        List<Product.ProductImage> images = req.getImages() != null
                ? req.getImages().stream()
                    .map(img -> Product.ProductImage.builder()
                            .url(img.getUrl())
                            .altText(img.getAltText())
                            .color(img.getColor())
                            .build())
                    .toList()
                : List.of();

        List<Product.ProductVariant> variants = req.getVariants() != null
                ? req.getVariants().stream()
                    .map(v -> Product.ProductVariant.builder()
                            .size(v.getSize())
                            .color(v.getColor())
                            .stock(v.getStock())
                            .sku(v.getSku())
                            .build())
                    .toList()
                : List.of();

        Product product = Product.builder()
                .title(req.getTitle().trim())
                .slug(slug)
                .description(req.getDescription().trim())
                .parentCategoryId(req.getParentCategoryId())
                .childCategoryId(req.getChildCategoryId())
                .price(Product.Price.builder()
                        .amount(req.getPriceAmount())
                        .currency("INR")
                        .build())
                .images(images)
                .variants(variants)
                .isFeatured(req.isFeatured())
                .discountPercentage(req.getDiscountPercentage() != null ? req.getDiscountPercentage() : 0.0)
                .sellerZipCode(req.getSellerZipCode() != null ? req.getSellerZipCode() : "110001")
                .build();

        // Replicate Mongoose pre-save hook
        product.syncFromVariants();

        Product saved = productRepository.save(product);
        log.info("Created product id={} title={}", saved.getId(), saved.getTitle());
        return toDTO(saved);
    }

    public ProductDTO update(String id, CreateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        if (req.getTitle() != null) product.setTitle(req.getTitle().trim());
        if (req.getDescription() != null) product.setDescription(req.getDescription().trim());
        if (req.getPriceAmount() != null) {
            product.setPrice(Product.Price.builder()
                    .amount(req.getPriceAmount()).currency("INR").build());
        }
        if (req.getParentCategoryId() != null) product.setParentCategoryId(req.getParentCategoryId());
        if (req.getChildCategoryId() != null) product.setChildCategoryId(req.getChildCategoryId());
        if (req.getDiscountPercentage() != null) product.setDiscountPercentage(req.getDiscountPercentage());
        product.setFeatured(req.isFeatured());

        if (req.getImages() != null) {
            product.setImages(req.getImages().stream()
                    .map(img -> Product.ProductImage.builder()
                            .url(img.getUrl()).altText(img.getAltText()).color(img.getColor()).build())
                    .toList());
        }
        if (req.getVariants() != null) {
            product.setVariants(req.getVariants().stream()
                    .map(v -> Product.ProductVariant.builder()
                            .size(v.getSize()).color(v.getColor()).stock(v.getStock()).sku(v.getSku()).build())
                    .toList());
        }

        product.syncFromVariants();
        Product saved = productRepository.save(product);
        log.info("Updated product id={}", saved.getId());
        return toDTO(saved);
    }

    public void deactivate(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
        log.info("Deactivated product id={}", id);
    }

    public void reactivate(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(true);
        productRepository.save(product);
        log.info("Reactivated product id={}", id);
    }

    // ----- DTO Mapper -----

    public ProductDTO toDTO(Product p) {
        String parentCatName = null;
        String childCatName = null;
        if (p.getParentCategoryId() != null) {
            parentCatName = categoryRepository.findById(p.getParentCategoryId())
                    .map(Category::getName).orElse(null);
        }
        if (p.getChildCategoryId() != null) {
            childCatName = categoryRepository.findById(p.getChildCategoryId())
                    .map(Category::getName).orElse(null);
        }

        return ProductDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .description(p.getDescription())
                .priceAmount(p.getPrice() != null ? p.getPrice().getAmount() : 0)
                .currency(p.getPrice() != null ? p.getPrice().getCurrency() : "INR")
                .images(p.getImages() != null ? p.getImages().stream()
                        .map(i -> ProductDTO.ImageDTO.builder()
                                .url(i.getUrl()).altText(i.getAltText()).color(i.getColor()).build())
                        .toList() : List.of())
                .sizes(p.getSizes())
                .colors(p.getColors())
                .isFeatured(p.isFeatured())
                .discountPercentage(p.getDiscountPercentage())
                .isActive(p.isActive())
                .inStock(p.isInStock())
                .stock(p.getStock())
                .availableStock(p.getAvailableStock())
                .variants(p.getVariants() != null ? p.getVariants().stream()
                        .map(v -> ProductDTO.VariantDTO.builder()
                                .size(v.getSize()).color(v.getColor())
                                .stock(v.getStock()).reservedStock(v.getReservedStock())
                                .availableStock(v.getAvailableStock()).sku(v.getSku()).build())
                        .toList() : List.of())
                .parentCategoryId(p.getParentCategoryId())
                .childCategoryId(p.getChildCategoryId())
                .parentCategoryName(parentCatName)
                .childCategoryName(childCatName)
                .sellerZipCode(p.getSellerZipCode())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
