package com.threads.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {
    @NotBlank
    private String googleId;
    @NotBlank
    @Email
    private String email;
    private String firstName;
    private String lastName;
}
