package com.threads.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendOtpRequest {
    @NotBlank
    @jakarta.validation.constraints.Email
    private String email;
    @NotBlank
    private String type;
}
