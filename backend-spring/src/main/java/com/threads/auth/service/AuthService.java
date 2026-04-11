package com.threads.auth.service;

import com.threads.auth.dto.AuthResponse;
import com.threads.auth.dto.LoginRequest;
import com.threads.auth.dto.RegisterRequest;
import com.threads.catalog.model.User;
import com.threads.catalog.repository.UserRepository;
import com.threads.common.exception.DuplicateResourceException;
import com.threads.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.threads.catalog.service.OtpService otpService;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + req.getEmail());
        }

        User user = User.builder()
                .email(req.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(req.getPassword()))
                .firstName(req.getFirstName() != null ? req.getFirstName() : "")
                .lastName(req.getLastName() != null ? req.getLastName() : "")
                .role("user")
                .isEmailVerified(false)
                .build();

        User saved = userRepository.save(user);
        
        // Generate and send OTP during registration for email verify
        try {
            String otp = otpService.generateOTP(saved.getId(), "verify-email");
            otpService.sendDualOTP(saved.getPhoneNumber(), saved.getEmail(), otp);
        } catch (Exception e) {
            log.warn("Failed to send initial OTP: {}", e.getMessage());
        }

        String token = jwtService.generateToken(saved.getEmail(), saved.getRole());

        log.info("User registered email={}", saved.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(saved.getId())
                .email(saved.getEmail())
                .role(saved.getRole())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .isEmailVerified(saved.isEmailVerified())
                .message("Registration successful. Please verify email.")
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        if (user.getPassword() == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());

        log.info("User logged in email={}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .isEmailVerified(user.isEmailVerified())
                .message("Login successful")
                .build();
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public AuthResponse googleLogin(com.threads.auth.dto.GoogleAuthRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElse(null);

        if (user == null) {
            // Create new user for first-time Google login
            user = User.builder()
                    .email(req.getEmail().toLowerCase().trim())
                    .firstName(req.getFirstName() != null ? req.getFirstName() : "")
                    .lastName(req.getLastName() != null ? req.getLastName() : "")
                    .googleId(req.getGoogleId())
                    .role("user")
                    .isEmailVerified(true) // Google emails are already verified
                    .build();
            user = userRepository.save(user);
            log.info("Created new user via Google login: {}", user.getEmail());
        } else {
            // Update googleId if not already set
            if (user.getGoogleId() == null) {
                user.setGoogleId(req.getGoogleId());
                user.setEmailVerified(true);
                user = userRepository.save(user);
            }
            log.info("Google login for existing user: {}", user.getEmail());
        }

        String role = (user.getRole() != null && !user.getRole().isEmpty()) ? user.getRole() : "user";
        String token = jwtService.generateToken(user.getEmail(), role);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(role)
                .firstName(user.getFirstName() != null ? user.getFirstName() : "")
                .lastName(user.getLastName() != null ? user.getLastName() : "")
                .isEmailVerified(user.isEmailVerified())
                .message("Google login successful")
                .build();
    }

    public AuthResponse verifyOtp(com.threads.auth.dto.VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Map frontend type to backend OTP type
        String otpType = mapOtpType(req.getType());
        otpService.verifyOTP(user.getId(), req.getOtp(), otpType, false);

        // Only mark email verified for registration/email verification flows
        if ("verify-email".equals(otpType)) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .isEmailVerified(user.isEmailVerified())
                .message("Verified successfully")
                .build();
    }

    private String mapOtpType(String frontendType) {
        if (frontendType == null) return "verify-email";
        return switch (frontendType) {
            case "password_reset" -> "password-reset";
            case "registration", "login_verification" -> "verify-email";
            default -> frontendType; // pass through if already in backend format
        };
    }

    public void resendOtp(com.threads.auth.dto.ResendOtpRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String type = req.getType() != null && !req.getType().isEmpty() ? req.getType() : "verify-email";
        String otp = otpService.generateOTP(user.getId(), type);
        otpService.sendDualOTP(user.getPhoneNumber(), user.getEmail(), otp);
    }

    public void forgotPassword(com.threads.auth.dto.ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String otp = otpService.generateOTP(user.getId(), "password-reset");
        otpService.sendDualOTP(user.getPhoneNumber(), user.getEmail(), otp);
    }

    public void resetPassword(com.threads.auth.dto.ResetPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        otpService.verifyOTP(user.getId(), req.getOtp(), "password-reset", false);

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }
}
