package com.threads.catalog.repository;

import com.threads.catalog.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentId(String parentId);
    List<Category> findByParentIdIsNull();
    List<Category> findByIsActiveTrue();
    boolean existsBySlug(String slug);
}
