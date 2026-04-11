package com.threads.catalog.controller;

import com.threads.catalog.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final EmailService emailService;

    @GetMapping("/email")
    public String testEmail(@RequestParam String to) {
        try {
            emailService.sendEmail(to, "Test Email", "<h1>This is a test email from Threads Fashion</h1>", true);
            return "Email task submitted. Check logs.";
        } catch (Exception e) {
            return "Failed to submit email task: " + e.getMessage();
        }
    }
}
