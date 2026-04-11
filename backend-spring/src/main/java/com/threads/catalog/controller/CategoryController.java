package com.threads.catalog.controller;

import com.threads.catalog.dto.CategoryDTO;
import com.threads.catalog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> list() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @GetMapping("/roots")
    public ResponseEntity<List<CategoryDTO>> roots() {
        return ResponseEntity.ok(categoryService.findRootCategories());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CategoryDTO> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(categoryService.findBySlug(slug));
    }

    @GetMapping("/{parentId}/children")
    public ResponseEntity<List<CategoryDTO>> children(@PathVariable String parentId) {
        return ResponseEntity.ok(categoryService.findChildren(parentId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDTO> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String parentId = body.getOrDefault("parentId", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(name, parentId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryDTO> update(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(categoryService.update(id, body.get("name")));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
