/**
 * Frontend Validation Utilities
 * Client-side validation for forms and user inputs
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Email Validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const validateEmail = (email: string): ValidationResult => {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length < 3 || trimmedEmail.length > 254) {
        return { isValid: false, error: 'Email must be between 3 and 254 characters' };
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    const [localPart, domain] = trimmedEmail.split('@');

    if (localPart.length > 64) {
        return { isValid: false, error: 'Email local part is too long' };
    }

    if (!domain || domain.split('.').length < 2) {
        return { isValid: false, error: 'Please enter a valid email domain' };
    }

    return { isValid: true };
};

/**
 * UPI ID Validation
 */
const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

export const validateUpiId = (upiId: string): ValidationResult => {
    if (!upiId || typeof upiId !== 'string') {
        return { isValid: false, error: 'UPI ID is required' };
    }

    const trimmedUpi = upiId.trim().toLowerCase();

    if (trimmedUpi.length < 6 || trimmedUpi.length > 50) {
        return { isValid: false, error: 'UPI ID must be between 6 and 50 characters' };
    }

    if (!UPI_REGEX.test(trimmedUpi)) {
        return { isValid: false, error: 'Invalid UPI ID format (e.g., username@paytm)' };
    }

    const [username, handle] = trimmedUpi.split('@');

    if (!username || username.length < 3 || username.length > 30) {
        return { isValid: false, error: 'UPI username must be between 3 and 30 characters' };
    }

    const validHandles = [
        'paytm', 'phonepe', 'googlepay', 'ybl', 'okaxis', 'okicici',
        'okhdfcbank', 'oksbi', 'axl', 'ibl', 'upi', 'airtel',
        'fbl', 'pnb', 'boi', 'cnrb', 'federal', 'indus', 'kotak'
    ];

    const isCommonHandle = validHandles.some(h => handle.includes(h));
    const hasValidFormat = /^[a-z0-9]+$/.test(handle);

    if (!isCommonHandle && !hasValidFormat) {
        return { isValid: false, error: 'Please use a valid UPI payment handle' };
    }

    return { isValid: true };
};

/**
 * Card Number Validation (Luhn Algorithm)
 */
const CARD_NUMBER_REGEX = /^[0-9]{13,19}$/;

export const validateCardNumber = (cardNumber: string): ValidationResult => {
    if (!cardNumber || typeof cardNumber !== 'string') {
        return { isValid: false, error: 'Card number is required' };
    }

    const cleaned = cardNumber.replace(/[\s-]/g, '');

    if (!CARD_NUMBER_REGEX.test(cleaned)) {
        return { isValid: false, error: 'Card number must be 13-19 digits' };
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

    if (sum % 10 !== 0) {
        return { isValid: false, error: 'Invalid card number' };
    }

    return { isValid: true };
};

/**
 * CVV Validation
 */
const CVV_REGEX = /^[0-9]{3,4}$/;

export const validateCvv = (cvv: string, cardNumber?: string): ValidationResult => {
    if (!cvv || typeof cvv !== 'string') {
        return { isValid: false, error: 'CVV is required' };
    }

    const cleaned = cvv.trim();

    if (!CVV_REGEX.test(cleaned)) {
        return { isValid: false, error: 'CVV must be 3 or 4 digits' };
    }

    if (cardNumber) {
        const cleanedCard = cardNumber.replace(/[\s-]/g, '');
        const isAmex = /^3[47]/.test(cleanedCard);

        if (isAmex && cleaned.length !== 4) {
            return { isValid: false, error: 'American Express CVV must be 4 digits' };
        }

        if (!isAmex && cleaned.length !== 3) {
            return { isValid: false, error: 'CVV must be 3 digits' };
        }
    }

    return { isValid: true };
};

/**
 * Card Expiry Validation
 */
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/;

export const validateCardExpiry = (expiry: string): ValidationResult => {
    if (!expiry || typeof expiry !== 'string') {
        return { isValid: false, error: 'Expiry date is required' };
    }

    const trimmed = expiry.trim();

    if (!EXPIRY_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Expiry must be in MM/YY or MM/YYYY format' };
    }

    const [month, year] = trimmed.split('/');
    const monthNum = parseInt(month, 10);
    let yearNum = parseInt(year, 10);

    if (year.length === 2) {
        yearNum += 2000;
    }

    if (monthNum < 1 || monthNum > 12) {
        return { isValid: false, error: 'Invalid month' };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear) {
        return { isValid: false, error: 'Card has expired' };
    }

    if (yearNum === currentYear && monthNum < currentMonth) {
        return { isValid: false, error: 'Card has expired' };
    }

    if (yearNum > currentYear + 10) {
        return { isValid: false, error: 'Expiry date is too far in the future' };
    }

    return { isValid: true };
};

/**
 * Cardholder Name Validation
 */
const CARDHOLDER_NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;

export const validateCardholderName = (name: string): ValidationResult => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Cardholder name is required' };
    }

    const trimmed = name.trim();

    if (!CARDHOLDER_NAME_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Name must contain only letters, spaces, hyphens, and apostrophes' };
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        return { isValid: false, error: 'Please enter both first and last name' };
    }

    return { isValid: true };
};

/**
 * Password Validation
 */
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long' };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one letter' };
    }

    return { isValid: true };
};

/**
 * Phone Number Validation (E.164 format)
 */
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export const validatePhoneNumber = (phone: string): ValidationResult => {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required' };
    }

    const trimmed = phone.trim();

    if (!PHONE_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Phone number must be in E.164 format (e.g., +919876543210)' };
    }

    return { isValid: true };
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
 * Format Card Number with Spaces
 */
export const formatCardNumber = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
};

/**
 * Format Expiry Date
 */
export const formatExpiry = (expiry: string): string => {
    const cleaned = expiry.replace(/\D/g, '');
    if (cleaned.length >= 2) {
        return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
};

/**
 * Comprehensive Validator Object
 */
export const validators = {
    email: validateEmail,
    upiId: validateUpiId,
    cardNumber: validateCardNumber,
    cvv: validateCvv,
    cardExpiry: validateCardExpiry,
    cardholderName: validateCardholderName,
    password: validatePassword,
    phoneNumber: validatePhoneNumber,
    getCardType,
    formatCardNumber,
    formatExpiry
};

export default validators;
