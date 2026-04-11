package com.threads.common.exception;

public class PaymentException extends RuntimeException {
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }

    public PaymentException(String message) {
        super(message);
    }
}
