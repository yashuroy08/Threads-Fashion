package com.threads.catalog.service;

import com.threads.catalog.dto.WishlistItemDTO;
import com.threads.catalog.model.Product;
import com.threads.catalog.model.Wishlist;
import com.threads.catalog.repository.ProductRepository;
import com.threads.catalog.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;

    public List<WishlistItemDTO> getWishlist(String userId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> wishlistRepository.save(
                        Wishlist.builder().userId(userId).items(new ArrayList<>()).build()));

        return populateWishlistItems(wishlist);
    }

    public List<WishlistItemDTO> addItem(String userId, String productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> Wishlist.builder().userId(userId).items(new ArrayList<>()).build());

        if (wishlist.getItems() == null) {
            wishlist.setItems(new ArrayList<>());
        }

        boolean exists = wishlist.getItems().stream()
                .anyMatch(i -> productId.equals(i.getProductId()));

        if (!exists) {
            wishlist.getItems().add(
                    Wishlist.WishlistItem.builder().productId(productId).addedAt(new Date()).build());
            wishlist = wishlistRepository.save(wishlist);
            log.info("Successfully added to wishlist userId={} productId={}", userId, productId);
        }

        return populateWishlistItems(wishlist);
    }

    public List<WishlistItemDTO> removeItem(String userId, String productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElse(null);
        if (wishlist != null) {
            if (wishlist.getItems() != null) {
                wishlist.getItems().removeIf(i -> i != null && productId.equals(i.getProductId()));
            }
            wishlist = wishlistRepository.save(wishlist);
        }
        return populateWishlistItems(wishlist);
    }

    private List<WishlistItemDTO> populateWishlistItems(Wishlist wishlist) {
        if (wishlist == null || wishlist.getItems() == null || wishlist.getItems().isEmpty()) {
            return new ArrayList<>();
        }

        List<String> productIds = wishlist.getItems().stream()
                .map(Wishlist.WishlistItem::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        return wishlist.getItems().stream()
                .map(item -> {
                    Product product = productMap.get(item.getProductId());
                    if (product == null) return null;

                    // Manual mapping to ensure frontend compatibility (id -> _id)
                    Map<String, Object> productObj = new HashMap<>();
                    productObj.put("_id", product.getId());
                    productObj.put("title", product.getTitle());
                    productObj.put("price", product.getPrice());
                    productObj.put("images", product.getImages());
                    productObj.put("slug", product.getSlug());
                    productObj.put("sizes", product.getSizes());
                    productObj.put("colors", product.getColors());

                    return WishlistItemDTO.builder()
                            .product(productObj)
                            .addedAt(item.getAddedAt())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
