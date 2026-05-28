package com.threads.catalog.util;

public class EmailTemplates {

    private static final String COMMON_STYLE = 
        "body { font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 0; background-color: #f9f9f9; }" +
        ".email-wrapper { width: 100%; background-color: #f9f9f9; padding: 40px 0; }" +
        ".container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }" +
        ".header { text-align: center; padding: 40px 20px; background-color: #000; color: #fff; }" +
        ".header h1 { font-size: 24px; letter-spacing: 4px; text-transform: uppercase; margin: 0; font-weight: 600; }" +
        ".content { padding: 40px; color: #333; }" +
        ".content h2 { font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px; }" +
        ".otp-code { font-size: 36px; font-weight: 700; color: #000; text-align: center; padding: 30px; background: #f4f4f5; border-radius: 8px; margin: 30px 0; letter-spacing: 8px; }" +
        ".order-details { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 14px; }" +
        ".order-details th { text-align: left; padding: 15px 10px; background: #fafafa; border-bottom: 2px solid #eaeaea; color: #666; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; }" +
        ".order-details td { padding: 15px 10px; border-bottom: 1px solid #eaeaea; }" +
        ".total-row { font-weight: 600; background: #fafafa; }" +
        ".total-row td { border-bottom: none; }" +
        ".cta-container { text-align: center; margin: 40px 0 20px; }" +
        ".button { display: inline-block; padding: 16px 36px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; transition: background-color 0.3s ease; }" +
        ".status-box { padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; background-color: #fafafa; border: 1px solid #eaeaea; }" +
        ".status-box .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 5px; display: block; }" +
        ".status-box .value { font-size: 18px; font-weight: 600; color: #000; }" +
        ".footer { text-align: center; padding: 30px 40px; font-size: 12px; color: #888; background-color: #fafafa; border-top: 1px solid #eaeaea; }" +
        ".footer p { margin: 5px 0; }";

    public static String getOtpTemplate(String otp) {
        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='email-wrapper'><div class='container'>" +
               "  <div class='header'><h1>Threads</h1></div>" +
               "  <div class='content'>" +
               "    <h2>Authentication Request</h2>" +
               "    <p>We received a request to verify your identity. Please use the verification code below to proceed.</p>" +
               "    <div class='otp-code'>" + otp + "</div>" +
               "    <p style='color: #666; font-size: 14px;'>This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    <p>&copy; 2026 Threads Fashion. All rights reserved.</p>" +
               "    <p>Premium Apparel for Every Thread of Your Life.</p>" +
               "  </div>" +
               "</div></div></body></html>";
    }

    public static String getOrderConfirmationTemplate(String customerName, String orderId, String subtotal, String tax, String shipping, String total, String itemsHtml, String frontendUrl) {
        String trackingLink = frontendUrl + "/orders/" + orderId;
        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='email-wrapper'><div class='container'>" +
               "  <div class='header'><h1>Threads</h1></div>" +
               "  <div class='content'>" +
               "    <h2>Thank you for your order, " + customerName + ".</h2>" +
               "    <p>Your order <strong>#" + orderId + "</strong> has been confirmed and is currently being processed. We will notify you once it ships.</p>" +
               "    <table class='order-details'>" +
               "      <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>" +
               "      <tbody>" + itemsHtml + "</tbody>" +
               "      <tfoot>" +
               "        <tr><td>Subtotal</td><td></td><td>" + subtotal + "</td></tr>" +
               "        <tr><td>Tax</td><td></td><td>" + tax + "</td></tr>" +
               "        <tr><td>Shipping</td><td></td><td>" + shipping + "</td></tr>" +
               "        <tr class='total-row'><td>Order Total</td><td></td><td>" + total + "</td></tr>" +
               "      </tfoot>" +
               "    </table>" +
               "    <div class='cta-container'>" +
               "      <a href='" + trackingLink + "' class='button'>View Order Status</a>" +
               "    </div>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    <p>&copy; 2026 Threads Fashion. All rights reserved.</p>" +
               "    <p>Follow your style journey with #ThreadsFashion</p>" +
               "  </div>" +
               "</div></div></body></html>";
    }

    public static String getStatusUpdateTemplate(String customerName, String orderId, String status, String frontendUrl) {
        String trackingLink = frontendUrl + "/orders/" + orderId;
        String statusColor = "#111";
        String statusTitle = "Order Update";
        String statusMessage = "There is an update regarding your order.";
        
        switch (status.toUpperCase()) {
            case "SHIPPED":
                statusTitle = "Your Order is on its way";
                statusMessage = "Good news! Your order has been shipped and is on its way to you.";
                break;
            case "DELIVERED":
                statusTitle = "Your Order has arrived";
                statusMessage = "Your order has been successfully delivered. We hope you love your new threads.";
                break;
            case "CANCELLED":
                statusColor = "#d32f2f";
                statusTitle = "Order Cancelled";
                statusMessage = "Your order has been cancelled. If payment was made, a refund will be initiated shortly.";
                break;
            case "RETURN_REQUESTED":
                statusTitle = "Return Request Received";
                statusMessage = "We have received your return request. Our team will review and process it shortly.";
                break;
            case "EXCHANGE_REQUESTED":
                statusTitle = "Exchange Request Received";
                statusMessage = "We have received your exchange request. Our team will review and process it shortly.";
                break;
            case "REFUNDED":
                statusColor = "#2e7d32";
                statusTitle = "Refund Processed";
                statusMessage = "Your refund has been successfully processed and should reflect in your account soon.";
                break;
            default:
                statusMessage = "Your order status has been updated to: " + status;
                break;
        }

        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='email-wrapper'><div class='container'>" +
               "  <div class='header'><h1>Threads</h1></div>" +
               "  <div class='content'>" +
               "    <h2>" + statusTitle + "</h2>" +
               "    <p>Hi " + customerName + ",</p>" +
               "    <p>" + statusMessage + "</p>" +
               "    <div class='status-box' style='border-left: 4px solid " + statusColor + ";'>" +
               "      <span class='label'>Order Reference</span>" +
               "      <span class='value'>#" + orderId + "</span>" +
               "    </div>" +
               "    <div class='cta-container'>" +
               "      <a href='" + trackingLink + "' class='button'>Track Order Live</a>" +
               "    </div>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    <p>&copy; 2026 Threads Fashion. All rights reserved.</p>" +
               "    <p>Need help? Contact support@threadsfashion.in</p>" +
               "  </div>" +
               "</div></div></body></html>";
    }
}
