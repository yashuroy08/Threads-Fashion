package com.threads.catalog.controller;

import com.threads.catalog.model.AdminSettings;
import com.threads.catalog.model.AuditLog;
import com.threads.catalog.model.Order;
import com.threads.catalog.repository.OrderRepository;
import com.threads.catalog.repository.ProductRepository;
import com.threads.catalog.repository.UserRepository;
import com.threads.catalog.service.AdminSettingsService;
import com.threads.catalog.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AuditService auditService;
    private final AdminSettingsService adminSettingsService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final MongoTemplate mongoTemplate;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> dashboardStats() {
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();

        List<Order> latestOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).getContent();

        long returnCount = orderRepository.countByStatusIn(List.of("RETURN_REQUESTED", "RETURN_APPROVED"));
        long exchangeCount = orderRepository.countByStatusIn(List.of("EXCHANGE_REQUESTED", "EXCHANGE_APPROVED"));
        long cancellationCount = orderRepository.countByStatus("CANCELLED");
        long activeOrderCount = orderRepository.countByStatusIn(List.of("PLACED", "PENDING", "CONFIRMED"));

        // Revenue aggregation
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").ne("CANCELLED")),
                Aggregation.group().sum("total").as("total")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "orders", Map.class);
        long revenue = 0;
        if (!results.getMappedResults().isEmpty()) {
             Object totalObj = results.getMappedResults().get(0).get("total");
             if (totalObj instanceof Number) {
                 revenue = ((Number) totalObj).longValue();
             }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("products", totalProducts);
        stats.put("orders", totalOrders);
        stats.put("users", totalUsers);
        stats.put("revenue", revenue);
        stats.put("activeOrders", activeOrderCount);
        stats.put("returns", returnCount);
        stats.put("exchanges", exchangeCount);
        stats.put("cancellations", cancellationCount);

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("latestOrders", latestOrders);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/audit")
    public ResponseEntity<Page<AuditLog>> auditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.getAll(PageRequest.of(page, size)));
    }

    @GetMapping("/settings")
    public ResponseEntity<AdminSettings> getSettings() {
        return ResponseEntity.ok(adminSettingsService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<AdminSettings> updateSettings(@RequestBody AdminSettings settings) {
        return ResponseEntity.ok(adminSettingsService.updateSettings(settings));
    }

    @GetMapping("/users")
    public ResponseEntity<List<com.threads.catalog.model.User>> listAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> adminUpdateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        com.threads.catalog.model.User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("firstName") && updates.get("firstName") != null) {
            user.setFirstName(updates.get("firstName").toString());
        }
        if (updates.containsKey("lastName") && updates.get("lastName") != null) {
            user.setLastName(updates.get("lastName").toString());
        }
        if (updates.containsKey("phoneNumber")) {
            Object phone = updates.get("phoneNumber");
            user.setPhoneNumber(phone != null ? phone.toString() : null);
        }
        if (updates.containsKey("role") && updates.get("role") != null) {
            user.setRole(updates.get("role").toString());
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }
}
