/**
 * Validation Utilities
 * Comprehensive regex-based validators for emails, UPI IDs, card details, and more
 */

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Email Validation
 * RFC 5322 compliant email regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const validateEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const trimmedEmail = email.trim();

    // Check length constraints
    if (trimmedEmail.length < 3 || trimmedEmail.length > 254) {
        return false;
    }

    // Check for valid format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return false;
    }

    // Additional checks
    const [localPart, domain] = trimmedEmail.split('@');

    // Local part shouldn't exceed 64 characters
    if (localPart.length > 64) {
        return false;
    }

    // Domain should have at least one dot and valid TLD
    if (!domain || domain.split('.').length < 2) {
        return false;
    }

    return true;
};

/**
 * UPI ID Validation
 * Format: username@bankname or mobile@bankname
 * Examples: user123@paytm, 9876543210@ybl
 */
export const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

export const validateUpiId = (upiId: string): boolean => {
    if (!upiId || typeof upiId !== 'string') {
        return false;
    }

    const trimmedUpi = upiId.trim().toLowerCase();

    // Check length (typical UPI IDs are 6-50 characters)
    if (trimmedUpi.length < 6 || trimmedUpi.length > 50) {
        return false;
    }

    // Check basic format
    if (!UPI_REGEX.test(trimmedUpi)) {
        return false;
    }

    const [username, handle] = trimmedUpi.split('@');

    // Username validation (3-30 characters)
    if (!username || username.length < 3 || username.length > 30) {
        return false;
    }

    // Handle validation (common UPI handles)
    const validHandles = [
        'paytm', 'phonepe', 'googlepay', 'ybl', 'okaxis', 'okicici',
        'okhdfcbank', 'oksbi', 'axl', 'ibl', 'upi', 'airtel',
        'fbl', 'pnb', 'boi', 'cnrb', 'federal', 'indus', 'kotak'
    ];

    // Check if handle is in common list or has valid format
    const isCommonHandle = validHandles.some(h => handle.includes(h));
    const hasValidFormat = /^[a-z0-9]+$/.test(handle);

    return isCommonHandle || hasValidFormat;
};

/**
 * Card Number Validation (Luhn Algorithm)
 * Validates credit/debit card numbers
 */
export const CARD_NUMBER_REGEX = /^[0-9]{13,19}$/;

export const validateCardNumber = (cardNumber: string): boolean => {
    if (!cardNumber || typeof cardNumber !== 'string') {
        return false;
    }

    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Check if it's numeric and has valid length
    if (!CARD_NUMBER_REGEX.test(cleaned)) {
        return false;
    }

    // Luhn Algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Card CVV Validation
 * 3 digits for Visa/Mastercard, 4 for Amex
 */
export const CVV_REGEX = /^[0-9]{3,4}$/;

export const validateCvv = (cvv: string, cardNumber?: string): boolean => {
    if (!cvv || typeof cvv !== 'string') {
        return false;
    }

    const cleaned = cvv.trim();

    if (!CVV_REGEX.test(cleaned)) {
        return false;
    }

    // If card number provided, check Amex (starts with 34 or 37) needs 4 digits
    if (cardNumber) {
        const cleanedCard = cardNumber.replace(/[\s-]/g, '');
        const isAmex = /^3[47]/.test(cleanedCard);

        if (isAmex && cleaned.length !== 4) {
            return false;
        }

        if (!isAmex && cleaned.length !== 3) {
            return false;
        }
    }

    return true;
};

/**
 * Card Expiry Validation
 * Format: MM/YY or MM/YYYY
 */
export const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;

export const validateCardExpiry = (expiry: string): boolean => {
    if (!expiry || typeof expiry !== 'string') {
        return false;
    }

    const trimmed = expiry.trim();

    if (!EXPIRY_REGEX.test(trimmed)) {
        return false;
    }

    const [month, year] = trimmed.split('/');
    const monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);

    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
        yearNum += 2000;
    }

    // Check if month is valid
    if (monthNum < 1 || monthNum > 12) {
        return false;
    }

    // Check if card is not expired
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear) {
        return false;
    }

    if (yearNum === currentYear && monthNum < currentMonth) {
        return false;
    }

    // Check if expiry is not too far in future (10 years)
    if (yearNum > currentYear + 10) {
        return false;
    }

    return true;
};

/**
 * Cardholder Name Validation
 */
export const CARDHOLDER_NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;

export const validateCardholderName = (name: string): boolean => {
    if (!name || typeof name !== 'string') {
        return false;
    }

    const trimmed = name.trim();

    if (!CARDHOLDER_NAME_REGEX.test(trimmed)) {
        return false;
    }

    // Should have at least first and last name
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        return false;
    }

    return true;
};

/**
 * Get Card Type from Card Number
 */
export const getCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    if (/^35/.test(cleaned)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'Diners Club';

    return 'Unknown';
};

/**
 * Phone Number Validation (E.164 format)
 * Format: +[country code][number]
 */
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || typeof phone !== 'string') {
        return false;
    }

    const trimmed = phone.trim();
    return PHONE_REGEX.test(trimmed);
};

/**
 * Indian Mobile Number Validation
 * Format: 10 digits starting with 6-9
 */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const validateIndianMobile = (mobile: string): boolean => {
    if (!mobile || typeof mobile !== 'string') {
        return false;
    }

    const cleaned = mobile.replace(/[\s-]/g, '');
    return INDIAN_MOBILE_REGEX.test(cleaned);
};

/**
 * Comprehensive Validator Function
 */
export const validate = {
    email: validateEmail,
    upiId: validateUpiId,
    cardNumber: validateCardNumber,
    cvv: validateCvv,
    cardExpiry: validateCardExpiry,
    cardholderName: validateCardholderName,
    phoneNumber: validatePhoneNumber,
    indianMobile: validateIndianMobile,
    getCardType
};

export default validate;
