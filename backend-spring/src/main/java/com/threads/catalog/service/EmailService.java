package com.threads.catalog.service;

import com.threads.catalog.model.Order;
import com.threads.catalog.model.User;
import com.threads.catalog.util.EmailTemplates;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class EmailService {

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.from-email:threadsfashion@zohomail.in}")
    private String fromEmail;

    @Value("${brevo.from-name:Threads Fashion}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****";
        return email.substring(0, Math.min(2, email.indexOf("@"))) + "****" + email.substring(email.indexOf("@"));
    }

    @PostConstruct
    public void logStatus() {
        if (brevoApiKey == null || brevoApiKey.isEmpty()) {
            log.warn("EmailService: brevo.api-key is EMPTY. Emails will be MOCKED.");
        } else {
            String maskedKey = brevoApiKey.length() > 12
                    ? brevoApiKey.substring(0, 8) + "..." + brevoApiKey.substring(brevoApiKey.length() - 4)
                    : "***";
            log.info("EmailService: using Brevo API, from='{}' <{}>, apiKey={}", fromName, fromEmail, maskedKey);
        }
    }

    @Async
    public void sendEmail(String to, String subject, String content, boolean isHtml) {
        String masked = maskEmail(to);
        try {
            if (brevoApiKey == null || brevoApiKey.isEmpty()) {
                log.warn("[Email Mock] to={}, subject='{}', isHtml={}", masked, subject, isHtml);
                return;
            }

            log.info("[Brevo] Sending email to={}, from={}, subject='{}'", masked, fromEmail, subject);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> sender = new HashMap<>();
            sender.put("name", fromName);
            sender.put("email", fromEmail);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", sender);
            body.put("to", List.of(recipient));
            body.put("subject", subject);
            if (isHtml) {
                body.put("htmlContent", content);
            } else {
                body.put("textContent", content);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.brevo.com/v3/smtp/email", request, String.class);

            log.info("[Brevo] SUCCESS to={}, status={}, response={}", masked, response.getStatusCode(), response.getBody());

        } catch (HttpClientErrorException e) {
            log.error("[Brevo] API ERROR to={}, status={}, body={}", masked, e.getStatusCode(), e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("[Brevo] FAILED to={}, error={}", masked, e.getMessage(), e);
        }
    }

    public void sendOTP(String email, String otp) {
        String subject = "Your Verification Code - Threads Fashion";
        String htmlBody = EmailTemplates.getOtpTemplate(otp);
        sendEmail(email, subject, htmlBody, true);
    }

    private String formatINR(long paise) {
        return String.format("₹%.2f", paise / 100.0);
    }

    public void sendOrderConfirmation(User user, Order order) {
        String subject = "Order Confirmed #" + order.getOrderId() + " - Threads Fashion";
        
        String itemsHtml = order.getItems().stream()
                .map(item -> String.format(
                        "<tr><td>%s (Size: %s)</td><td>%d</td><td>%s</td></tr>",
                        item.getTitle(), item.getSize() != null ? item.getSize() : "N/A", 
                        item.getQuantity(), formatINR(item.getPrice())
                ))
                .collect(Collectors.joining());

        String customerName = user.getFirstName() != null && !user.getFirstName().isEmpty() ? user.getFirstName() : "Valued Customer";
        String subtotal = formatINR(order.getSubtotal());
        String tax = formatINR(order.getTax());
        String shipping = order.getShippingCharges() == 0 ? "FREE" : formatINR(order.getShippingCharges());
        String total = formatINR(order.getTotal());
        
        String htmlBody = EmailTemplates.getOrderConfirmationTemplate(customerName, order.getOrderId(), subtotal, tax, shipping, total, itemsHtml, frontendUrl);
        sendEmail(user.getEmail(), subject, htmlBody, true);
    }

    public void sendOrderStatusUpdate(User user, Order order) {
        String subject = "Order Update #" + order.getOrderId() + ": " + order.getStatus();
        String customerName = user.getFirstName() != null && !user.getFirstName().isEmpty() ? user.getFirstName() : "Valued Customer";
        
        String htmlBody = EmailTemplates.getStatusUpdateTemplate(customerName, order.getOrderId(), order.getStatus(), frontendUrl);
        sendEmail(user.getEmail(), subject, htmlBody, true);
    }
}
