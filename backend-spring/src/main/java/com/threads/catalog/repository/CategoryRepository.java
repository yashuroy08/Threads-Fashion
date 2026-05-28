package com.threads.catalog.repository;

import com.threads.catalog.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    
    @Cacheable("categories")
    Optional<Category> findBySlug(String slug);
    
    @Cacheable("categories")
    List<Category> findByParentId(String parentId);
    
    @Cacheable("categories")
    List<Category> findByParentIdIsNull();
    
    @Cacheable("categories")
    List<Category> findByIsActiveTrue();
    
    boolean existsBySlug(String slug);
    
    @Cacheable("categories")
    Optional<Category> findById(String id);
    
    @Cacheable("categories")
    List<Category> findAllById(Iterable<String> ids);
}
