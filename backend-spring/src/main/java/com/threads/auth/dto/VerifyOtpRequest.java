package com.threads.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;
    @NotBlank
    private String otp;
    @NotBlank
    private String type;
}
