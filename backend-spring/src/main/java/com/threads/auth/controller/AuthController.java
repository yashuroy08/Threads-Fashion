package com.threads.auth.controller;

import com.threads.auth.dto.AuthResponse;
import com.threads.auth.dto.LoginRequest;
import com.threads.auth.dto.RegisterRequest;
import com.threads.auth.service.AuthService;
import com.threads.catalog.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody com.threads.auth.dto.GoogleAuthRequest req) {
        return ResponseEntity.ok(authService.googleLogin(req));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody com.threads.auth.dto.VerifyOtpRequest req) {
        return ResponseEntity.ok(authService.verifyOtp(req));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody com.threads.auth.dto.ResendOtpRequest req) {
        authService.resendOtp(req);
        return ResponseEntity.ok().body(java.util.Map.of("message", "OTP sent successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody com.threads.auth.dto.ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok().body(java.util.Map.of("message", "Password reset instructions sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody com.threads.auth.dto.ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok().body(java.util.Map.of("message", "Password reset successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        user.setPassword(null); // Never expose password hash
        return ResponseEntity.ok(user);
    }
}
