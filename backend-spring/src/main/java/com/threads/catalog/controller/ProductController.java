package com.threads.catalog.controller;

import com.threads.catalog.dto.CreateProductRequest;
import com.threads.catalog.dto.ProductDTO;
import com.threads.catalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // ---- Public routes ----

    @GetMapping
    public ResponseEntity<Page<ProductDTO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String parentCategory,
            @RequestParam(required = false) String childCategory,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String sizes,
            @RequestParam(required = false) String colors,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice) {
        int pageSize = limit != null ? limit : size;
        String sortMode = (sortBy != null && !sortBy.isBlank()) ? sortBy : sort;
        return ResponseEntity.ok(productService.findProducts(
                page,
                pageSize,
                parentCategory,
                childCategory,
                q,
                sortMode,
                sizes,
                colors,
                minPrice,
                maxPrice));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(productService.search(q, PageRequest.of(page, size)));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<ProductDTO>> featured() {
        return ResponseEntity.ok(productService.findFeatured());
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<ProductDTO> getBySlugOrId(@PathVariable String slugOrId) {
        return ResponseEntity.ok(productService.findBySlugOrId(slugOrId));
    }

    @GetMapping("/{slug}/details")
    public ResponseEntity<ProductDTO> getDetailsBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(productService.findBySlug(slug));
    }

    // ---- Admin routes ----

    @GetMapping("/admin/products")
    public ResponseEntity<Map<String, Object>> adminList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ProductDTO> products = productService.findAllAdmin(PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of("items", products.getContent()));
    }

    @PostMapping("/admin/create")
    public ResponseEntity<ProductDTO> create(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(req));
    }

    @PutMapping("/admin/update/{id}")
    public ResponseEntity<ProductDTO> update(@PathVariable String id,
                                              @Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    @DeleteMapping("/admin/deactivate/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/reactivate/{id}")
    public ResponseEntity<Void> reactivate(@PathVariable String id) {
        productService.reactivate(id);
        return ResponseEntity.ok().build();
    }
}
