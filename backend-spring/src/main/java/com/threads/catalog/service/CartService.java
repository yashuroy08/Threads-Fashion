package com.threads.catalog.service;

import com.threads.catalog.dto.CartDTO;
import com.threads.catalog.model.Cart;
import com.threads.catalog.model.Product;
import com.threads.catalog.dto.ProductDTO;
import com.threads.catalog.repository.CartRepository;
import com.threads.catalog.repository.ProductRepository;
import com.threads.common.exception.InsufficientStockException;
import com.threads.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public CartDTO getCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return toDTO(cart);
    }

    public CartDTO addItem(String userId, String productId, int quantity, String size, String color) {
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        // Check if item with same product+size+color already exists
        Optional<Cart.CartItem> existing = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId)
                        && equalsNullSafe(i.getSize(), size)
                        && equalsNullSafe(i.getColor(), color))
                .findFirst();

        int currentQuantity = existing.map(Cart.CartItem::getQuantity).orElse(0);
        int totalRequested = currentQuantity + quantity;

        // Stock Validation
        validateStock(product, totalRequested, size, color);

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + quantity);
        } else {
            long priceSnapshot = product.getPrice() != null ? product.getPrice().getAmount() : 0;
            String imageSnapshot = (product.getImages() != null && !product.getImages().isEmpty())
                    ? product.getImages().get(0).getUrl() : null;
            
            Cart.CartItem item = Cart.CartItem.builder()
                    .productId(productId)
                    .quantity(quantity)
                    .priceSnapshot(priceSnapshot)
                    .titleSnapshot(product.getTitle())
                    .imageSnapshot(imageSnapshot)
                    .size(size)
                    .color(color)
                    .addedAt(new Date())
                    .build();
            cart.getItems().add(item);
        }

        Cart saved = cartRepository.save(cart);
        log.info("Added item to cart userId={} productId={}", userId, productId);
        return toDTO(saved);
    }

    public CartDTO updateItemQuantity(String userId, String productId, int quantity, String size, String color) {
        Cart cart = getOrCreateCart(userId);

        Cart.CartItem item = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId)
                        && equalsNullSafe(i.getSize(), size)
                        && equalsNullSafe(i.getColor(), color))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            // Stock Validation for update
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            validateStock(product, quantity, size, color);
            
            item.setQuantity(quantity);
        }

        return toDTO(cartRepository.save(cart));
    }

    public CartDTO removeItem(String userId, String productId, String size, String color) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(i -> i.getProductId().equals(productId)
                && equalsNullSafe(i.getSize(), size)
                && equalsNullSafe(i.getColor(), color));
        return toDTO(cartRepository.save(cart));
    }

    public CartDTO clearCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        return toDTO(cartRepository.save(cart));
    }

    public CartDTO saveForLater(String userId, String productId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().removeIf(i -> i.getProductId().equals(productId));

        boolean alreadySaved = cart.getSavedForLater().stream()
                .anyMatch(s -> s.getProductId().equals(productId));
        if (!alreadySaved) {
            cart.getSavedForLater().add(
                    Cart.SavedItem.builder().productId(productId).addedAt(new Date()).build());
        }
        return toDTO(cartRepository.save(cart));
    }

    public CartDTO moveSavedToCart(String userId, String productId) {
        Cart cart = getOrCreateCart(userId);
        cart.getSavedForLater().removeIf(s -> s.getProductId().equals(productId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        long priceSnapshot = product.getPrice() != null ? product.getPrice().getAmount() : 0;
        String imageSnapshot = (product.getImages() != null && !product.getImages().isEmpty())
                ? product.getImages().get(0).getUrl() : null;

        cart.getItems().add(Cart.CartItem.builder()
                .productId(productId)
                .quantity(1)
                .priceSnapshot(priceSnapshot)
                .titleSnapshot(product.getTitle())
                .imageSnapshot(imageSnapshot)
                .addedAt(new Date())
                .build());

        return toDTO(cartRepository.save(cart));
    }

    // ----- Helpers -----

    private void validateStock(Product product, int requestedQuantity, String size, String color) {
        if (!product.isActive()) {
            throw new InsufficientStockException("This product is currently unavailable");
        }

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            Product.ProductVariant variant = product.getVariants().stream()
                    .filter(v -> equalsNullSafe(v.getSize(), size) && equalsNullSafe(v.getColor(), color))
                    .findFirst()
                    .orElseThrow(() -> new InsufficientStockException("The selected size or color is not available for this product"));

            if (variant.getAvailableStock() < requestedQuantity) {
                if (variant.getAvailableStock() <= 0) {
                    throw new InsufficientStockException("This item is currently out of stock");
                }
                throw new InsufficientStockException("Only " + variant.getAvailableStock() + " units are available in stock");
            }
        } else {
            // No variants, check base product stock
            if (product.getAvailableStock() < requestedQuantity) {
                if (product.getAvailableStock() <= 0) {
                    throw new InsufficientStockException("This item is currently out of stock");
                }
                throw new InsufficientStockException("Only " + product.getAvailableStock() + " units are available in stock");
            }
        }
    }

    private Cart getOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder().userId(userId).items(new ArrayList<>()).savedForLater(new ArrayList<>()).build()));
    }

    private boolean equalsNullSafe(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private CartDTO toDTO(Cart cart) {
        long total = cart.getItems().stream()
                .mapToLong(i -> i.getPriceSnapshot() * i.getQuantity())
                .sum();

        List<CartDTO.CartItemDTO> itemDTOs = cart.getItems().stream()
                .map(i -> {
                    ProductDTO productDTO = productRepository.findById(i.getProductId())
                            .map(productService::toDTO).orElse(null);
                    
                    return CartDTO.CartItemDTO.builder()
                            .product(productDTO)
                            .productId(i.getProductId())
                            .quantity(i.getQuantity())
                            .priceSnapshot(i.getPriceSnapshot())
                            .titleSnapshot(i.getTitleSnapshot())
                            .imageSnapshot(i.getImageSnapshot())
                            .size(i.getSize())
                            .color(i.getColor())
                            .addedAt(i.getAddedAt())
                            .build();
                }).toList();

        return CartDTO.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(itemDTOs)
                .savedForLater(cart.getSavedForLater() != null
                        ? cart.getSavedForLater().stream()
                            .map(s -> CartDTO.SavedItemDTO.builder()
                                    .productId(s.getProductId()).addedAt(s.getAddedAt()).build())
                            .toList()
                        : List.of())
                .cartTotal(total)
                .total(total) // added for frontend
                .build();
    }
}
