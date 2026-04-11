package com.threads.catalog.service;

import com.threads.catalog.dto.OrderDTO;
import com.threads.catalog.model.Cart;
import com.threads.catalog.model.Order;
import com.threads.catalog.model.Product;
import com.threads.catalog.model.User;
import com.threads.catalog.repository.CartRepository;
import com.threads.catalog.repository.OrderRepository;
import com.threads.catalog.repository.ProductRepository;
import com.threads.catalog.repository.UserRepository;
import com.threads.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuditService auditService;

    public OrderDTO placeOrder(String userId, Order.ShippingAddress address, String paymentMethod) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot place order with empty cart");
        }

        // Collect all product IDs to batch-fetch product data
        List<String> productIds = cart.getItems().stream()
                .map(Cart.CartItem::getProductId)
                .toList();
        Map<String, Product> productMap = new HashMap<>();
        try {
            List<Product> products = productRepository.findAllById(productIds);
            products.forEach(p -> productMap.put(p.getId(), p));
        } catch (Exception e) {
            log.warn("Could not fetch products for order enrichment: {}", e.getMessage());
        }

        List<Order.OrderItem> items = cart.getItems().stream()
                .map(ci -> {
                    Product product = productMap.get(ci.getProductId());
                    // Use cart snapshots first, fall back to product data
                    String title = ci.getTitleSnapshot();
                    if (title == null || title.isBlank()) {
                        title = product != null ? product.getTitle() : "Product";
                    }
                    String image = ci.getImageSnapshot();
                    if (image == null || image.isBlank()) {
                        image = (product != null && product.getImages() != null && !product.getImages().isEmpty())
                                ? product.getImages().get(0).getUrl() : null;
                    }
                    return Order.OrderItem.builder()
                            .productId(ci.getProductId())
                            .title(title)
                            .quantity(ci.getQuantity())
                            .price(ci.getPriceSnapshot())
                            .size(ci.getSize())
                            .color(ci.getColor())
                            .image(image)
                            .build();
                })
                .toList();

        long subtotal = items.stream()
                .mapToLong(i -> i.getPrice() * i.getQuantity())
                .sum();

        // Calculate Tax (18% GST)
        long tax = (long) (subtotal * 0.18);

        // Shipping Charges (Free shipping above ₹999, else ₹99)
        long shippingCharges = (subtotal >= 99900) ? 0 : 9900; // Assuming paise, ₹999.00 = 99900 paise

        long total = subtotal + tax + shippingCharges;

        String orderId = "TF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Get seller zip code from first product for distance tracking
        String sellerZip = "110001"; // default Delhi
        if (!productMap.isEmpty()) {
            Product firstProduct = productMap.values().iterator().next();
            if (firstProduct.getSellerZipCode() != null && !firstProduct.getSellerZipCode().isBlank()) {
                sellerZip = firstProduct.getSellerZipCode();
            }
        }

        // Estimate distance from seller zip to buyer zip
        double distanceKm = estimateDistance(sellerZip, address.getZipCode());

        // Estimated delivery: 3-7 days based on distance
        int deliveryDays = distanceKm > 1000 ? 7 : distanceKm > 500 ? 5 : 3;
        Date estimatedDelivery = new Date(System.currentTimeMillis() + (long) deliveryDays * 24 * 60 * 60 * 1000);

        Order order = Order.builder()
                .orderId(orderId)
                .userId(userId)
                .items(items)
                .subtotal(subtotal)
                .tax(tax)
                .shippingCharges(shippingCharges)
                .total(total)
                .status("PLACED")
                .shippingAddress(address)
                .paymentMethod(paymentMethod != null ? paymentMethod : "card")
                .sellerZipCode(sellerZip)
                .distanceKm(distanceKm)
                .estimatedDeliveryDate(estimatedDelivery)
                .build();

        Order saved = orderRepository.save(order);

        // Clear the cart
        cart.getItems().clear();
        cartRepository.save(cart);

        // Send confirmation email
        try {
            userRepository.findByEmail(userId).ifPresent(user -> {
                emailService.sendOrderConfirmation(user, saved);
            });
        } catch (Exception e) {
            log.error("Failed to send order confirmation email: {}", e.getMessage());
        }

        auditService.log("ORDER_PLACED", userId, "Order placed: " + orderId);
        log.info("Order placed orderId={} userId={} total={}", orderId, userId, total);

        return toDTO(saved);
    }

    public List<OrderDTO> getUserOrders(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private Order findOrder(String id) {
        return orderRepository.findByOrderId(id)
                .orElseGet(() -> orderRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id)));
    }

    public OrderDTO getOrder(String id) {
        Order order = findOrder(id);
        return toDTO(order);
    }

    public Page<OrderDTO> listAll(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDTO);
    }

    public OrderDTO updateStatus(String id, String status) {
        Order order = findOrder(id);
        order.setStatus(status);
        Order saved = orderRepository.save(order);

        // Send status update email
        try {
            userRepository.findByEmail(saved.getUserId()).ifPresent(user -> {
                emailService.sendOrderStatusUpdate(user, saved);
            });
        } catch (Exception e) {
            log.error("Failed to send order status update email: {}", e.getMessage());
        }

        return toDTO(saved);
    }

    public OrderDTO cancelOrder(String userId, String orderId, String reason) {
        Order order = findOrder(orderId);

        if (!order.getUserId().equals(userId)) {
            throw new IllegalStateException("Not authorized to cancel this order");
        }
        if (!"PLACED".equals(order.getStatus()) && !"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Order cannot be cancelled in status: " + order.getStatus());
        }

        order.setStatus("CANCELLED");
        order.setCancellationReason(reason);
        auditService.log("ORDER_CANCELLED", userId, "Order cancelled: " + order.getOrderId());
        return toDTO(orderRepository.save(order));
    }

    public OrderDTO requestReturn(String userId, String orderId, String reason) {
        Order order = findOrder(orderId);
        if (!order.getUserId().equals(userId)) throw new IllegalStateException("Not authorized");
        if (!"DELIVERED".equals(order.getStatus())) throw new IllegalStateException("Only delivered orders can be returned");

        order.setStatus("RETURN_REQUESTED");
        order.setReturnReason(reason);
        return toDTO(orderRepository.save(order));
    }

    public OrderDTO requestExchange(String userId, String orderId, String reason) {
        Order order = findOrder(orderId);
        if (!order.getUserId().equals(userId)) throw new IllegalStateException("Not authorized");
        if (!"DELIVERED".equals(order.getStatus())) throw new IllegalStateException("Only delivered orders can be exchanged");

        order.setStatus("EXCHANGE_REQUESTED");
        order.setExchangeReason(reason);
        return toDTO(orderRepository.save(order));
    }

    public void deleteOrder(String orderId) {
        Order order = findOrder(orderId);
        orderRepository.deleteById(order.getId());
        log.info("Deleted order id={}", orderId);
    }

    public void bulkDelete(List<String> orderIds) {
        orderRepository.deleteAllById(orderIds);
        log.info("Bulk deleted {} orders", orderIds.size());
    }

    // ----- Distance Estimator -----

    private double estimateDistance(String sellerZip, String buyerZip) {
        if (sellerZip == null || buyerZip == null) return 500.0;
        try {
            int sellerPrefix = Integer.parseInt(sellerZip.substring(0, 3));
            int buyerPrefix = Integer.parseInt(buyerZip.substring(0, 3));
            int diff = Math.abs(sellerPrefix - buyerPrefix);
            // Rough estimate: each prefix unit ~5-10 km
            return Math.max(50, diff * 7.5);
        } catch (Exception e) {
            return 500.0;
        }
    }

    // ----- DTO Mapper -----

    private OrderDTO toDTO(Order o) {
        return OrderDTO.builder()
                .id(o.getId())
                .orderId(o.getOrderId())
                .userId(o.getUserId())
                .items(o.getItems() != null ? o.getItems().stream()
                        .map(i -> OrderDTO.OrderItemDTO.builder()
                                .productId(i.getProductId()).title(i.getTitle())
                                .quantity(i.getQuantity()).price(i.getPrice())
                                .size(i.getSize()).color(i.getColor()).image(i.getImage()).build())
                        .toList() : List.of())
                .subtotal(o.getSubtotal())
                .tax(o.getTax())
                .shippingCharges(o.getShippingCharges())
                .total(o.getTotal())
                .status(o.getStatus())
                .shippingAddress(o.getShippingAddress() != null
                        ? OrderDTO.ShippingAddressDTO.builder()
                            .street(o.getShippingAddress().getStreet())
                            .city(o.getShippingAddress().getCity())
                            .state(o.getShippingAddress().getState())
                            .zipCode(o.getShippingAddress().getZipCode()).build()
                        : null)
                .paymentMethod(o.getPaymentMethod())
                .inventoryProcessed(o.isInventoryProcessed())
                .cancellationReason(o.getCancellationReason())
                .returnReason(o.getReturnReason())
                .exchangeReason(o.getExchangeReason())
                .distanceKm(o.getDistanceKm())
                .sellerZipCode(o.getSellerZipCode())
                .estimatedDeliveryDate(o.getEstimatedDeliveryDate())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
