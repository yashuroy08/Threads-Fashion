package com.threads.catalog.service;

import com.threads.catalog.model.Order;
import com.threads.catalog.model.User;
import com.threads.catalog.util.EmailTemplates;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @PostConstruct
    public void logStatus() {
        if (fromEmail == null || fromEmail.isEmpty()) {
            log.warn("EmailService: spring.mail.username is EMPTY. Emails will be MOCKED.");
        } else {
            log.info("EmailService: host=smtp.zoho.in, from={}", fromEmail);
        }
    }

    @Async
    public void sendEmail(String to, String subject, String content, boolean isHtml) {
        try {
            if (fromEmail == null || fromEmail.isEmpty()) {
                String maskedTo = to != null && to.contains("@") ? to.substring(0, 2) + "****" + to.substring(to.indexOf("@")) : "****";
                log.warn("[Email Mock] Sent to: {}, Subject: {}, IsHtml: {}", 
                    maskedTo, subject, isHtml);
                return;
            }

            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Threads Fashion");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, isHtml);

            javaMailSender.send(message);
            String maskedTo = to != null && to.contains("@") ? to.substring(0, 2) + "****" + to.substring(to.indexOf("@")) : "****";
            log.info("Email sent successfully to {}", maskedTo);
        } catch (Exception e) {
            String maskedTo = to != null && to.contains("@") ? to.substring(0, 2) + "****" + to.substring(to.indexOf("@")) : "****";
            log.error("Failed to send email to {}", maskedTo, e);
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
        
        String htmlBody = EmailTemplates.getOrderConfirmationTemplate(customerName, order.getOrderId(), subtotal, tax, shipping, total, itemsHtml);
        sendEmail(user.getEmail(), subject, htmlBody, true);
    }

    public void sendOrderStatusUpdate(User user, Order order) {
        String subject = "Order Update #" + order.getOrderId() + ": " + order.getStatus();
        String customerName = user.getFirstName() != null && !user.getFirstName().isEmpty() ? user.getFirstName() : "Valued Customer";
        
        String htmlBody = EmailTemplates.getStatusUpdateTemplate(customerName, order.getOrderId(), order.getStatus());
        sendEmail(user.getEmail(), subject, htmlBody, true);
    }
}
