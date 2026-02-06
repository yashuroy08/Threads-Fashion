# Validation System Documentation

## Overview
This document explains the comprehensive validation system implemented for the e-commerce platform. The system includes both backend and frontend validation for emails, UPI IDs, card details, passwords, and phone numbers.

## Files Created

### Backend
- **`backend/src/common/utils/validators.ts`** - Server-side validation utilities

### Frontend
- **`frontend/src/services/validators.ts`** - Client-side validation utilities

---

## Backend Validation

### Import
```typescript
import { validate } from '../../../common/utils/validators';
```

### Available Validators

#### 1. Email Validation
```typescript
const isValid = validate.email('user@example.com');
// Returns: boolean
```

**Rules:**
- Must be 3-254 characters
- RFC 5322 compliant format
- Local part max 64 characters
- Must have valid domain with TLD

**Examples:**
- ✅ `user@example.com`
- ✅ `john.doe+tag@company.co.uk`
- ❌ `invalid@`
- ❌ `@example.com`

---

#### 2. UPI ID Validation
```typescript
const isValid = validate.upiId('user123@paytm');
// Returns: boolean
```

**Rules:**
- 6-50 characters total
- Username: 3-30 characters
- Format: `username@handle`
- Supports common UPI handles (paytm, phonepe, googlepay, ybl, etc.)

**Examples:**
- ✅ `user123@paytm`
- ✅ `9876543210@ybl`
- ✅ `john.doe@okaxis`
- ❌ `ab@paytm` (username too short)
- ❌ `user@invalid`

---

#### 3. Card Number Validation (Luhn Algorithm)
```typescript
const isValid = validate.cardNumber('4532015112830366');
// Returns: boolean
```

**Rules:**
- 13-19 digits
- Passes Luhn algorithm check
- Accepts spaces and dashes (auto-removed)

**Examples:**
- ✅ `4532 0151 1283 0366` (Visa)
- ✅ `5425233430109903` (Mastercard)
- ❌ `1234567890123456` (fails Luhn)

---

#### 4. CVV Validation
```typescript
const isValid = validate.cvv('123');
const isValidAmex = validate.cvv('1234', '378282246310005'); // Amex
// Returns: boolean
```

**Rules:**
- 3 digits for Visa/Mastercard/Discover
- 4 digits for American Express
- Auto-detects card type if card number provided

**Examples:**
- ✅ `123` (standard)
- ✅ `1234` (Amex)
- ❌ `12` (too short)

---

#### 5. Card Expiry Validation
```typescript
const isValid = validate.cardExpiry('12/25');
// Returns: boolean
```

**Rules:**
- Format: MM/YY or MM/YYYY
- Month: 01-12
- Not expired
- Not more than 10 years in future

**Examples:**
- ✅ `12/25`
- ✅ `06/2026`
- ❌ `13/25` (invalid month)
- ❌ `01/20` (expired)

---

#### 6. Cardholder Name Validation
```typescript
const isValid = validate.cardholderName('John Doe');
// Returns: boolean
```

**Rules:**
- 2-50 characters
- Letters, spaces, hyphens, apostrophes only
- Must have at least first and last name

**Examples:**
- ✅ `John Doe`
- ✅ `Mary-Jane O'Connor`
- ❌ `John` (no last name)
- ❌ `John123` (contains numbers)

---

#### 7. Phone Number Validation (E.164)
```typescript
const isValid = validate.phoneNumber('+919876543210');
// Returns: boolean
```

**Rules:**
- E.164 format: +[country code][number]
- 1-15 digits total (including country code)

**Examples:**
- ✅ `+919876543210` (India)
- ✅ `+14155552671` (US)
- ❌ `9876543210` (missing +)
- ❌ `+91 9876543210` (no spaces)

---

#### 8. Indian Mobile Number Validation
```typescript
const isValid = validate.indianMobile('9876543210');
// Returns: boolean
```

**Rules:**
- 10 digits
- Starts with 6-9

**Examples:**
- ✅ `9876543210`
- ✅ `7890123456`
- ❌ `5876543210` (starts with 5)

---

#### 9. Get Card Type
```typescript
const cardType = validate.getCardType('4532015112830366');
// Returns: 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | 'JCB' | 'Diners Club' | 'Unknown'
```

---

## Frontend Validation

### Import
```typescript
import { validators } from '../services/validators';
```

### Usage with React Forms

#### Example: Email Validation
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    const result = validators.email(value);
    if (!result.isValid) {
        setEmailError(result.error || '');
    } else {
        setEmailError('');
    }
};

// In JSX
<input
    type="email"
    value={email}
    onChange={handleEmailChange}
    className={emailError ? 'error' : ''}
/>
{emailError && <span className="error-message">{emailError}</span>}
```

---

#### Example: UPI ID Validation
```typescript
const [upiId, setUpiId] = useState('');
const [upiError, setUpiError] = useState('');

const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUpiId(value);
    
    const result = validators.upiId(value);
    setUpiError(result.isValid ? '' : result.error || '');
};
```

---

#### Example: Card Number with Formatting
```typescript
const [cardNumber, setCardNumber] = useState('');
const [cardError, setCardError] = useState('');
const [cardType, setCardType] = useState('');

const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces
    const formatted = validators.formatCardNumber(value);
    setCardNumber(formatted);
    
    const result = validators.cardNumber(value);
    setCardError(result.isValid ? '' : result.error || '');
    
    if (result.isValid) {
        setCardType(validators.getCardType(value));
    }
};

// In JSX
<div className="card-input">
    <input
        type="text"
        value={cardNumber}
        onChange={handleCardChange}
        placeholder="1234 5678 9012 3456"
        maxLength={19}
    />
    {cardType && <span className="card-type">{cardType}</span>}
    {cardError && <span className="error">{cardError}</span>}
</div>
```

---

#### Example: Expiry Date with Formatting
```typescript
const [expiry, setExpiry] = useState('');
const [expiryError, setExpiryError] = useState('');

const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = validators.formatExpiry(value);
    setExpiry(formatted);
    
    const result = validators.cardExpiry(formatted);
    setExpiryError(result.isValid ? '' : result.error || '');
};

// In JSX
<input
    type="text"
    value={expiry}
    onChange={handleExpiryChange}
    placeholder="MM/YY"
    maxLength={5}
/>
```

---

#### Example: Complete Payment Form
```typescript
const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: ''
});

const [errors, setErrors] = useState({
    cardNumber: '',
    cardholderName: '',
    expiry: '',
    cvv: ''
});

const validateForm = () => {
    const newErrors = {
        cardNumber: validators.cardNumber(formData.cardNumber).error || '',
        cardholderName: validators.cardholderName(formData.cardholderName).error || '',
        expiry: validators.cardExpiry(formData.expiry).error || '',
        cvv: validators.cvv(formData.cvv, formData.cardNumber).error || ''
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== '');
};

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
        // Process payment
        console.log('Form is valid, processing payment...');
    }
};
```

---

## Integration Examples

### Backend Controller (Already Implemented)

#### Payment Controller
```typescript
// File: backend/src/modules/catalog/controllers/payment.controller.ts
import { validate } from '../../../common/utils/validators';

export const verifyUpi = async (req: Request, res: Response) => {
    const { vpa } = req.body;
    
    if (!validate.upiId(vpa)) {
        throw new AppError('Invalid UPI ID format', 400);
    }
    
    // Process UPI verification...
};
```

#### Auth Controller
```typescript
// File: backend/src/modules/catalog/controllers/auth.controller.ts
import { validate } from '../../../common/utils/validators';

export const registerHandler = async (req: Request, res: Response) => {
    const { email, phoneNumber, password } = req.body;
    
    if (!validate.email(email)) {
        throw new AppError('Invalid email address format', 400);
    }
    
    if (!validate.phoneNumber(phoneNumber)) {
        throw new AppError('Invalid phone number format', 400);
    }
    
    if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters', 400);
    }
    
    // Process registration...
};
```

---

## Testing

### Backend Tests
```typescript
import { validate } from '../common/utils/validators';

describe('Email Validation', () => {
    it('should validate correct email', () => {
        expect(validate.email('user@example.com')).toBe(true);
    });
    
    it('should reject invalid email', () => {
        expect(validate.email('invalid@')).toBe(false);
    });
});

describe('UPI Validation', () => {
    it('should validate correct UPI ID', () => {
        expect(validate.upiId('user123@paytm')).toBe(true);
    });
    
    it('should reject invalid UPI ID', () => {
        expect(validate.upiId('ab@paytm')).toBe(false);
    });
});
```

---

## Error Messages

All frontend validators return structured error messages:

```typescript
interface ValidationResult {
    isValid: boolean;
    error?: string;
}
```

**Example Error Messages:**
- Email: "Please enter a valid email address"
- UPI: "Invalid UPI ID format (e.g., username@paytm)"
- Card: "Invalid card number"
- CVV: "CVV must be 3 digits"
- Expiry: "Card has expired"
- Name: "Please enter both first and last name"

---

## Best Practices

1. **Always validate on both frontend and backend**
   - Frontend: Better UX with immediate feedback
   - Backend: Security and data integrity

2. **Use appropriate error messages**
   - Be specific about what's wrong
   - Provide examples of correct format

3. **Sanitize inputs**
   - Remove spaces/dashes from card numbers
   - Trim whitespace from emails
   - Convert UPI IDs to lowercase

4. **Progressive validation**
   - Validate on blur for better UX
   - Show errors after user interaction
   - Clear errors when user corrects input

5. **Security considerations**
   - Never log sensitive data (card numbers, CVVs)
   - Use HTTPS for all payment forms
   - Implement rate limiting on backend

---

## Common UPI Handles

The validator recognizes these common UPI payment handles:
- `@paytm` - Paytm
- `@phonepe` - PhonePe
- `@googlepay` - Google Pay
- `@ybl` - Yes Bank
- `@okaxis` - Axis Bank
- `@okicici` - ICICI Bank
- `@okhdfcbank` - HDFC Bank
- `@oksbi` - State Bank of India
- `@axl` - Axis Bank Limited
- `@ibl` - IDBI Bank
- `@upi` - Generic UPI
- `@airtel` - Airtel Payments Bank
- `@fbl` - Federal Bank
- `@pnb` - Punjab National Bank
- `@boi` - Bank of India
- `@cnrb` - Canara Bank
- `@federal` - Federal Bank
- `@indus` - IndusInd Bank
- `@kotak` - Kotak Mahindra Bank

---

## Card Type Detection

The system automatically detects these card types:
- **Visa**: Starts with 4
- **Mastercard**: Starts with 51-55
- **American Express**: Starts with 34 or 37
- **Discover**: Starts with 6011 or 65
- **JCB**: Starts with 35
- **Diners Club**: Starts with 300-305 or 36 or 38

---

## Support

For issues or questions about the validation system:
1. Check this documentation
2. Review the validator source code
3. Test with the examples provided
4. Ensure you're using the latest version

---

**Last Updated:** January 23, 2026
**Version:** 1.0.0
