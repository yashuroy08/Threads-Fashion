package com.threads.catalog.controller;

import com.threads.catalog.model.Order;
import com.threads.catalog.service.PaymentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createPaymentOrder(@RequestBody CreateOrderRequest req) {
        Map<String, Object> responseFields = paymentService.createRazorpayOrder(req.getAmount(), req.getOrderId());
        return ResponseEntity.ok(Map.of("success", true, "data", responseFields));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody VerifyPaymentRequest req) {
        Order updatedOrder = paymentService.verifyAndUpdateOrder(
                req.getOrderId(),
                req.getRazorpay_order_id(),
                req.getRazorpay_payment_id(),
                req.getRazorpay_signature()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully",
                "data", Map.of(
                        "orderId", updatedOrder.getOrderId(),
                        "status", updatedOrder.getStatus(),
                        "paymentId", req.getRazorpay_payment_id()
                )
        ));
    }

    @Data
    static class CreateOrderRequest {
        private double amount;
        private String orderId;
    }

    @Data
    static class VerifyPaymentRequest {
        private String razorpay_order_id;
        private String razorpay_payment_id;
        private String razorpay_signature;
        private String orderId;
    }
}
