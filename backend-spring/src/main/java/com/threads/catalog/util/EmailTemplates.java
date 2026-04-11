package com.threads.catalog.util;

public class EmailTemplates {

    private static final String COMMON_STYLE = 
        "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }" +
        ".container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }" +
        ".header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f4f4f4; }" +
        ".header h1 { color: #000; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0; }" +
        ".content { padding: 30px 0; }" +
        ".otp-code { font-size: 32px; font-weight: bold; color: #000; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 4px; margin: 20px 0; letter-spacing: 5px; }" +
        ".order-details { width: 100%; border-collapse: collapse; margin: 20px 0; }" +
        ".order-details th { text-align: left; padding: 10px; background: #f4f4f4; border-bottom: 2px solid #eee; }" +
        ".order-details td { padding: 10px; border-bottom: 1px solid #eee; }" +
        ".total-row { font-weight: bold; background: #fafafa; }" +
        ".button { display: inline-block; padding: 12px 25px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }" +
        ".footer { text-align: center; padding-top: 20px; font-size: 12px; color: #888; border-top: 1px solid #f4f4f4; }";

    public static String getOtpTemplate(String otp) {
        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='container'>" +
               "  <div class='header'><h1>Threads Fashion</h1></div>" +
               "  <div class='content'>" +
               "    <p>Hello,</p>" +
               "    <p>Thank you for choosing <strong>Threads Fashion</strong>. Use the following verification code to complete your request. This code is valid for 5 minutes.</p>" +
               "    <div class='otp-code'>" + otp + "</div>" +
               "    <p>If you didn't request this, please ignore this email or contact support.</p>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    &copy; 2026 Threads Fashion. All rights reserved.<br>" +
               "    Premium Apparel for Every Thread of Your Life." +
               "  </div>" +
               "</div></body></html>";
    }

    public static String getOrderConfirmationTemplate(String customerName, String orderId, String subtotal, String tax, String shipping, String total, String itemsHtml) {
        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='container'>" +
               "  <div class='header'><h1>Threads Fashion</h1></div>" +
               "  <div class='content'>" +
               "    <p>Hi " + customerName + ",</p>" +
               "    <p>Exciting news! Your order <strong>#" + orderId + "</strong> has been placed successfully. We are getting it ready for you.</p>" +
               "    <h3>Order Summary</h3>" +
               "    <table class='order-details'>" +
               "      <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>" +
               "      <tbody>" + itemsHtml + "</tbody>" +
               "      <tfoot>" +
               "        <tr><td>Subtotal</td><td></td><td>" + subtotal + "</td></tr>" +
               "        <tr><td>Tax (18%)</td><td></td><td>" + tax + "</td></tr>" +
               "        <tr><td>Shipping</td><td></td><td>" + shipping + "</td></tr>" +
               "        <tr class='total-row'><td>Order Total</td><td></td><td>" + total + "</td></tr>" +
               "      </tfoot>" +
               "    </table>" +
               "    <p>We'll notify you once your threads are on the way!</p>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    &copy; 2026 Threads Fashion. All rights reserved.<br>" +
               "    Follow your stylejourney with #ThreadsFashion" +
               "  </div>" +
               "</div></body></html>";
    }

    public static String getStatusUpdateTemplate(String customerName, String orderId, String status) {
        String statusColor = "#000";
        String statusMessage = "Your order status has been updated.";
        
        if ("SHIPPED".equalsIgnoreCase(status)) {
            statusColor = "#27ae60";
            statusMessage = "Pack your bags! Your order is on its way.";
        } else if ("DELIVERED".equalsIgnoreCase(status)) {
            statusColor = "#2980b9";
            statusMessage = "Delivered! We hope you love your new threads.";
        }

        return "<html><head><style>" + COMMON_STYLE + "</style></head><body>" +
               "<div class='container'>" +
               "  <div class='header'><h1>Threads Fashion</h1></div>" +
               "  <div class='content'>" +
               "    <p>Hi " + customerName + ",</p>" +
               "    <p>" + statusMessage + "</p>" +
               "    <div style='padding: 15px; background: #f9f9f9; border-left: 5px solid " + statusColor + "; margin: 20px 0;'>" +
               "      Order: <strong>#" + orderId + "</strong><br>" +
               "      Current Status: <strong style='color: " + statusColor + ";'>" + status.toUpperCase() + "</strong>" +
               "    </div>" +
               "    <p>Thank you for shopping with Threads Fashion.</p>" +
               "  </div>" +
               "  <div class='footer'>" +
               "    &copy; 2026 Threads Fashion. All rights reserved.<br>" +
               "    Need help? Contact support@threadsfashion.in" +
               "  </div>" +
               "</div></body></html>";
    }
}
