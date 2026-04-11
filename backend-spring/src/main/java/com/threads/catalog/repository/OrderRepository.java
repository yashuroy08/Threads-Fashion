package com.threads.catalog.repository;

import com.threads.catalog.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    Optional<Order> findByOrderId(String orderId);
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Order> findByStatus(String status, Pageable pageable);
    long countByStatus(String status);
    long countByStatusIn(List<String> statuses);
}
