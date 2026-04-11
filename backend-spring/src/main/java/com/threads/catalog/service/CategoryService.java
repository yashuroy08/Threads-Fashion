package com.threads.catalog.service;

import com.threads.catalog.dto.CategoryDTO;
import com.threads.catalog.model.Category;
import com.threads.catalog.repository.CategoryRepository;
import com.threads.common.exception.DuplicateResourceException;
import com.threads.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDTO> findAll() {
        return categoryRepository.findByIsActiveTrue()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CategoryDTO> findRootCategories() {
        return categoryRepository.findByParentIdIsNull()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CategoryDTO> findChildren(String parentId) {
        return categoryRepository.findByParentId(parentId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public CategoryDTO findBySlug(String slug) {
        Category cat = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + slug));
        return toDTO(cat);
    }

    public CategoryDTO create(String name, String parentId) {
        String slug = name.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");

        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Category with slug already exists: " + slug);
        }

        Category category = Category.builder()
                .name(name.trim())
                .slug(slug)
                .parentId(parentId)
                .isActive(true)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category id={} name={}", saved.getId(), saved.getName());
        return toDTO(saved);
    }

    public CategoryDTO update(String id, String name) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        cat.setName(name.trim());
        return toDTO(categoryRepository.save(cat));
    }

    public void delete(String id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        cat.setActive(false);
        categoryRepository.save(cat);
        log.info("Deactivated category id={}", id);
    }

    private CategoryDTO toDTO(Category c) {
        return CategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .parentId(c.getParentId())
                .isActive(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
