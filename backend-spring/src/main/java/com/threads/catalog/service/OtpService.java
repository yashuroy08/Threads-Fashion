package com.threads.catalog.service;

import com.threads.catalog.model.Otp;
import com.threads.catalog.repository.OtpRepository;
import com.threads.common.exception.ResourceNotFoundException;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Date;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${twilio.account-sid}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token}")
    private String twilioAuthToken;

    @Value("${twilio.from-number}")
    private String twilioFromNumber;

    @PostConstruct
    public void init() {
        log.info("OtpService: Twilio Account SID = {}", (twilioAccountSid != null && !twilioAccountSid.isEmpty()) ? "PRESENT" : "MISSING");
        if (twilioAccountSid != null && !twilioAccountSid.isEmpty() && twilioAuthToken != null && !twilioAuthToken.isEmpty()) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            log.info("Twilio client initialized");
        } else {
            log.warn("Twilio credentials not configured. SMS will be mocked.");
        }
    }

    public boolean sendSMS(String phoneNumber, String otpCode) {
        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            String maskedPhone = phoneNumber != null && phoneNumber.length() > 4 ? phoneNumber.substring(0, 2) + "****" + phoneNumber.substring(phoneNumber.length() - 2) : "****";
            log.warn("[SMS Mock] TWILIO credentials missing. OTP handled for: {}", maskedPhone);
            return true;
        }
        try {
            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioFromNumber),
                    "Your Threads Fashion verification code is: " + otpCode + ". Valid for 5 minutes."
            ).create();
            log.info("[Twilio SMS] OTP sent to {}", phoneNumber);
            return true;
        } catch (Exception e) {
            log.error("[Twilio Error] {}", e.getMessage());
            return false;
        }
    }

    public boolean sendDualOTP(String phoneNumber, String email, String otpCode) {
        log.info("[OTP] Sending to email: {}", email);
        emailService.sendOTP(email, otpCode);
        boolean emailSent = true; // Email service sends async currently, assuming success or mocked
        
        boolean smsSent = false;
        if (phoneNumber != null && !phoneNumber.isEmpty()) {
            log.info("[OTP] Sending to phone: {}", phoneNumber);
            smsSent = sendSMS(phoneNumber, otpCode);
        }
        
        return emailSent || smsSent;
    }

    public String generateOTP(String userId, String type) {
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        String otpCode = String.valueOf(num);

        String otpHash = passwordEncoder.encode(otpCode);
        
        otpRepository.deleteByUserIdAndType(userId, type);
        
        Otp otp = Otp.builder()
                .userId(userId)
                .otpHash(otpHash)
                .type(type)
                .expiresAt(new Date(System.currentTimeMillis() + 5 * 60 * 1000)) // 5 mins
                .attempts(0)
                .build();
                
        otpRepository.save(otp);
        return otpCode;
    }

    public boolean verifyOTP(String userId, String otpCode, String type, boolean persist) {
        Optional<Otp> otpDocOpt = otpRepository.findByUserIdAndType(userId, type);
        
        if (otpDocOpt.isEmpty()) {
            throw new ResourceNotFoundException("OTP expired or not found");
        }
        
        Otp otpDoc = otpDocOpt.get();
        
        if (otpDoc.getAttempts() >= 3) {
            otpRepository.deleteById(otpDoc.getId());
            throw new ResourceNotFoundException("Too many failed attempts. Please request a new code.");
        }
        
        if (!passwordEncoder.matches(otpCode, otpDoc.getOtpHash())) {
            otpDoc.setAttempts(otpDoc.getAttempts() + 1);
            otpRepository.save(otpDoc);
            throw new ResourceNotFoundException("Invalid verification code");
        }
        
        if (!persist) {
            otpRepository.deleteById(otpDoc.getId());
        }
        return true;
    }
}
