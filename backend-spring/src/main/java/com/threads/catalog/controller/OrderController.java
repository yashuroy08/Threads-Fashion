package com.threads.catalog.controller;

import com.threads.catalog.dto.OrderDTO;
import com.threads.catalog.model.Order;
import com.threads.catalog.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ---- User routes ----

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@AuthenticationPrincipal UserDetails user,
                                                 @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, String> addressMap = (Map<String, String>) body.get("shippingAddress");
        Order.ShippingAddress address = Order.ShippingAddress.builder()
                .street(addressMap.get("street"))
                .city(addressMap.get("city"))
                .state(addressMap.get("state"))
                .zipCode(addressMap.get("zipCode"))
                .build();
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "card");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(user.getUsername(), address, paymentMethod));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderDTO>> myOrders(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(orderService.getUserOrders(user.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrder(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PostMapping("/cancel/{id}")
    public ResponseEntity<OrderDTO> cancel(@AuthenticationPrincipal UserDetails user,
                                            @PathVariable String id,
                                            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(orderService.cancelOrder(user.getUsername(), id, reason));
    }

    @PostMapping("/return/{id}")
    public ResponseEntity<OrderDTO> requestReturn(@AuthenticationPrincipal UserDetails user,
                                                    @PathVariable String id,
                                                    @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.requestReturn(user.getUsername(), id, body.get("reason")));
    }

    @PostMapping("/exchange/{id}")
    public ResponseEntity<OrderDTO> requestExchange(@AuthenticationPrincipal UserDetails user,
                                                      @PathVariable String id,
                                                      @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.requestExchange(user.getUsername(), id, body.get("reason")));
    }

    // ---- Admin routes ----

    @GetMapping("/admin/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OrderDTO>> adminList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(orderService.listAll(PageRequest.of(page, size)));
    }

    @PatchMapping("/admin/status/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> updateStatus(@PathVariable String id,
                                                  @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/admin/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOrder(@PathVariable String orderId) {
        orderService.deleteOrder(orderId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/bulk-delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> body) {
        orderService.bulkDelete(body.get("orderIds"));
        return ResponseEntity.noContent().build();
    }
}
