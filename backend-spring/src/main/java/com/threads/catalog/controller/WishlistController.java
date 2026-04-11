package com.threads.catalog.controller;

import com.threads.catalog.dto.WishlistItemDTO;
import com.threads.catalog.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistItemDTO>> getWishlist(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(wishlistService.getWishlist(user.getUsername()));
    }

    @PostMapping("/add")
    public ResponseEntity<List<WishlistItemDTO>> addItem(@AuthenticationPrincipal UserDetails user,
                                             @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(wishlistService.addItem(user.getUsername(), body.get("productId")));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<List<WishlistItemDTO>> removeItem(@AuthenticationPrincipal UserDetails user,
                                                @PathVariable String productId) {
        return ResponseEntity.ok(wishlistService.removeItem(user.getUsername(), productId));
    }
}
