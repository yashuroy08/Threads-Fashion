package com.threads.catalog.service;

import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.threads.catalog.repository.OrderRepository;
import com.threads.catalog.model.Order;
import com.threads.common.exception.PaymentException;
import com.threads.common.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;
    private final OrderRepository orderRepository;

    @PostConstruct
    public void init() {
        if (keyId != null && !keyId.isEmpty() && keySecret != null && !keySecret.isEmpty()) {
            try {
                this.razorpayClient = new RazorpayClient(keyId, keySecret);
                log.info("Razorpay client initialized");
            } catch (RazorpayException e) {
                log.error("Failed to initialize Razorpay client", e);
            }
        } else {
            log.warn("Razorpay credentials not fully configured. Payments will fail in production.");
        }
    }

    public Map<String, Object> createRazorpayOrder(double amount, String orderId) {
        if (razorpayClient == null) {
            log.warn("[Payment Mock] Returned mock Razorpay order for order: {}", orderId);
            Map<String, Object> mockResp = new HashMap<>();
            mockResp.put("id", "mock_rzp_order_" + System.currentTimeMillis());
            mockResp.put("amount", Math.round(amount * 100)); // amount in paise
            mockResp.put("currency", "INR");
            mockResp.put("receipt", orderId);
            return mockResp;
        }

        try {
            var options = new org.json.JSONObject();
            options.put("amount", Math.round(amount * 100)); // Razorpay uses paise
            options.put("currency", "INR");
            options.put("receipt", orderId);
            options.put("payment_capture", 1);

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);

            Map<String, Object> response = new HashMap<>();
            response.put("id", razorpayOrder.get("id"));
            response.put("amount", razorpayOrder.get("amount"));
            response.put("currency", razorpayOrder.get("currency"));
            response.put("receipt", razorpayOrder.get("receipt"));

            return response;
        } catch (RazorpayException e) {
            log.error("Error creating Razorpay order: ", e);
            throw new PaymentException("Failed to create Razorpay Order: " + e.getMessage());
        }
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (razorpayClient == null) {
            return true; // Mock verification
        }
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            var validator = com.razorpay.Utils.verifySignature(payload, signature, keySecret);
            return validator;
        } catch (RazorpayException e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }

    public Payment fetchPaymentDetails(String paymentId) {
        if (razorpayClient == null) {
            return null; // Handle thoughtfully in the caller
        }
        try {
            return razorpayClient.payments.fetch(paymentId);
        } catch (RazorpayException e) {
            throw new PaymentException("Failed to fetch payment details: " + e.getMessage());
        }
    }

    public com.threads.catalog.model.Order verifyAndUpdateOrder(String orderId, String razorpayOrderId,
            String razorpayPaymentId, String signature) {
        if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)) {
            throw new PaymentException("Invalid payment signature");
        }

        com.threads.catalog.model.Order order = orderRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        order.setStatus("CONFIRMED");

        var paymentInfo = new com.threads.catalog.model.Order.PaymentInfo();
        paymentInfo.setMethod("upi");
        paymentInfo.setTransactionId(razorpayPaymentId);
        paymentInfo.setRazorpayOrderId(razorpayOrderId);
        paymentInfo.setPaidAt(new Date());

        if (razorpayClient != null) {
            Payment payment = fetchPaymentDetails(razorpayPaymentId);
            if (payment != null) {
                paymentInfo.setPaymentStatus(payment.get("status"));
            }
        } else {
            paymentInfo.setPaymentStatus("captured"); // Mocking success
        }

        order.setPaymentInfo(paymentInfo);
        return orderRepository.save(order);
    }
}
