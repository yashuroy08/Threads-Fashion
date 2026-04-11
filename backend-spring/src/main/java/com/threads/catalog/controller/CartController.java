package com.threads.catalog.controller;

import com.threads.catalog.dto.CartDTO;
import com.threads.catalog.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDTO> getMyCart(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cartService.getCart(getUserId(user)));
    }

    @PostMapping("/items")
    public ResponseEntity<CartDTO> addItem(@AuthenticationPrincipal UserDetails user,
                                            @RequestBody Map<String, Object> body) {
        String productId = (String) body.get("productId");
        int quantity = body.containsKey("quantity") ? ((Number) body.get("quantity")).intValue() : 1;
        String size = (String) body.get("size");
        String color = (String) body.get("color");
        return ResponseEntity.ok(cartService.addItem(getUserId(user), productId, quantity, size, color));
    }

    @PatchMapping("/items/{productId}")
    public ResponseEntity<CartDTO> updateItem(@AuthenticationPrincipal UserDetails user,
                                               @PathVariable String productId,
                                               @RequestBody Map<String, Object> body) {
        int quantity = ((Number) body.get("quantity")).intValue();
        String size = (String) body.get("size");
        String color = (String) body.get("color");
        return ResponseEntity.ok(cartService.updateItemQuantity(getUserId(user), productId, quantity, size, color));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartDTO> removeItem(@AuthenticationPrincipal UserDetails user,
                                               @PathVariable String productId,
                                               @RequestParam(required = false) String size,
                                               @RequestParam(required = false) String color) {
        return ResponseEntity.ok(cartService.removeItem(getUserId(user), productId, size, color));
    }

    @DeleteMapping
    public ResponseEntity<CartDTO> clearCart(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(cartService.clearCart(getUserId(user)));
    }

    @PostMapping("/saved/{productId}")
    public ResponseEntity<CartDTO> saveForLater(@AuthenticationPrincipal UserDetails user,
                                                 @PathVariable String productId) {
        return ResponseEntity.ok(cartService.saveForLater(getUserId(user), productId));
    }

    @PostMapping("/saved/{productId}/move-to-cart")
    public ResponseEntity<CartDTO> moveSavedToCart(@AuthenticationPrincipal UserDetails user,
                                                    @PathVariable String productId) {
        return ResponseEntity.ok(cartService.moveSavedToCart(getUserId(user), productId));
    }

    private String getUserId(UserDetails user) {
        // Using email as the userId lookup key (matches Node.js behavior)
        return user.getUsername();
    }
}
