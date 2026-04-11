package com.threads.catalog.controller;

import com.threads.catalog.model.User;
import com.threads.catalog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/me")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                              @RequestBody Map<String, Object> updates) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("firstName")) {
            Object val = updates.get("firstName");
            user.setFirstName(val != null ? val.toString() : "");
        }
        if (updates.containsKey("lastName")) {
            Object val = updates.get("lastName");
            user.setLastName(val != null ? val.toString() : "");
        }
        if (updates.containsKey("phoneNumber")) {
            Object val = updates.get("phoneNumber");
            user.setPhoneNumber(val != null ? val.toString() : null);
        }
        if (updates.containsKey("gender")) {
            Object val = updates.get("gender");
            user.setGender(val != null ? val.toString() : "");
        }

        userRepository.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<User> addAddress(@AuthenticationPrincipal UserDetails userDetails,
                                           @RequestBody User.Address address) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAddresses() == null) {
            user.setAddresses(new ArrayList<>());
        }
        
        Optional<User.Address> existing = user.getAddresses().stream()
                .filter(a -> a.getAddressType() != null && a.getAddressType().equals(address.getAddressType()))
                .findFirst();

        if (existing.isPresent()) {
            User.Address addr = existing.get();
            addr.setCity(address.getCity());
            addr.setState(address.getState());
            addr.setStreet(address.getStreet());
            addr.setZipCode(address.getZipCode());
        } else {
            user.getAddresses().add(address);
        }

        userRepository.save(user);
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me/addresses/{type}")
    public ResponseEntity<User> updateAddress(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable String type,
                                              @RequestBody User.Address address) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAddresses() == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<User.Address> existing = user.getAddresses().stream()
                .filter(a -> a.getAddressType() != null && a.getAddressType().equals(type))
                .findFirst();

        if (existing.isPresent()) {
            User.Address addr = existing.get();
            addr.setCity(address.getCity());
            addr.setState(address.getState());
            addr.setStreet(address.getStreet());
            addr.setZipCode(address.getZipCode());
            userRepository.save(user);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/me/addresses/{type}")
    public ResponseEntity<User> deleteAddress(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable String type) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAddresses() != null) {
            user.getAddresses().removeIf(a -> a.getAddressType() != null && a.getAddressType().equals(type));
            userRepository.save(user);
        }

        user.setPassword(null);
        return ResponseEntity.ok(user);
    }
}
