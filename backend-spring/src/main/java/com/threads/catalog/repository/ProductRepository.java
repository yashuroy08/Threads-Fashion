package com.threads.catalog.repository;

import com.threads.catalog.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySlug(String slug);
    List<Product> findByParentCategoryId(String parentCategoryId);
    List<Product> findByChildCategoryId(String childCategoryId);
    Page<Product> findByIsActiveTrue(Pageable pageable);
    List<Product> findByIsFeaturedTrueAndIsActiveTrue();
    long countByIsActiveTrue();

    @Query("{ 'isActive': true, 'title': { $regex: ?0, $options: 'i' } }")
    Page<Product> searchByTitle(String keyword, Pageable pageable);

    @Query("{ 'isActive': true, 'price.amount': { $gte: ?0, $lte: ?1 } }")
    Page<Product> findByPriceRange(int minPrice, int maxPrice, Pageable pageable);
}
