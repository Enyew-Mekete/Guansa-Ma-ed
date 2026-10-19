/**
 * Ethiopian Mobile Phone Number Validator & Formatter
 * 
 * Supports both Ethiopian network operators:
 * - Ethio Telecom (prefixes: 09 / +251 9)
 * - Safaricom Ethiopia (prefixes: 07 / +251 7)
 * 
 * Total digits after prefix must be exactly 8 digits (9 digits total mobile number).
 */

export interface PhoneValidationResult {
  isValid: boolean;
  operator?: 'Ethio Telecom' | 'Safaricom Ethiopia';
  normalized?: string; // Formatted as +251 9XX XXX XXX
  rawDigits?: string;
  errorMessage?: string;
}

export function validateEthiopianPhone(input: string): PhoneValidationResult {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      errorMessage: 'Ethiopian phone number is required',
    };
  }

  // Clean all whitespace, dashes, parens, plus
  const cleaned = input.trim().replace(/[\s\-\(\)]/g, '');

  let operator: 'Ethio Telecom' | 'Safaricom Ethiopia' | undefined;
  let nationalNumber = '';

  // Check prefix forms:
  // 1. +2519... or +2517...
  if (cleaned.startsWith('+251')) {
    const afterCountry = cleaned.slice(4);
    if (afterCountry.length !== 9) {
      return {
        isValid: false,
        errorMessage: 'Ethiopian mobile numbers require 9 digits after +251 (e.g., +251 91 123 4567)',
      };
    }
    if (afterCountry.startsWith('9')) {
      operator = 'Ethio Telecom';
      nationalNumber = afterCountry;
    } else if (afterCountry.startsWith('7')) {
      operator = 'Safaricom Ethiopia';
      nationalNumber = afterCountry;
    } else {
      return {
        isValid: false,
        errorMessage: 'Invalid Ethiopian mobile prefix. Must start with 9 (Ethio Telecom) or 7 (Safaricom)',
      };
    }
  } 
  // 2. 002519... or 002517...
  else if (cleaned.startsWith('00251')) {
    const afterCountry = cleaned.slice(5);
    if (afterCountry.length !== 9) {
      return {
        isValid: false,
        errorMessage: 'Ethiopian mobile numbers require 9 digits after country code',
      };
    }
    if (afterCountry.startsWith('9')) {
      operator = 'Ethio Telecom';
      nationalNumber = afterCountry;
    } else if (afterCountry.startsWith('7')) {
      operator = 'Safaricom Ethiopia';
      nationalNumber = afterCountry;
    } else {
      return {
        isValid: false,
        errorMessage: 'Invalid Ethiopian mobile prefix. Must start with 9 or 7',
      };
    }
  } 
  // 3. 2519... or 2517...
  else if (cleaned.startsWith('251') && cleaned.length === 12) {
    const afterCountry = cleaned.slice(3);
    if (afterCountry.startsWith('9')) {
      operator = 'Ethio Telecom';
      nationalNumber = afterCountry;
    } else if (afterCountry.startsWith('7')) {
      operator = 'Safaricom Ethiopia';
      nationalNumber = afterCountry;
    } else {
      return {
        isValid: false,
        errorMessage: 'Invalid Ethiopian mobile prefix. Must start with 9 or 7',
      };
    }
  }
  // 4. Local 09..., 07..., or 011... (Addis Ababa Fixed Line)
  else if (cleaned.startsWith('09') || cleaned.startsWith('07') || cleaned.startsWith('011')) {
    if (cleaned.length !== 10) {
      return {
        isValid: false,
        errorMessage: 'Local Ethiopian numbers must be exactly 10 digits (e.g., 0943305937 or 0115502331)',
      };
    }
    operator = cleaned.startsWith('07') ? 'Safaricom Ethiopia' : 'Ethio Telecom';
    nationalNumber = cleaned.slice(1); // 9 digits
  }
  // 5. Short 9... or 7... or 11... (9 digits)
  else if ((cleaned.startsWith('9') || cleaned.startsWith('7') || cleaned.startsWith('11')) && cleaned.length === 9) {
    operator = cleaned.startsWith('7') ? 'Safaricom Ethiopia' : 'Ethio Telecom';
    nationalNumber = cleaned;
  }
  else {
    return {
      isValid: false,
      errorMessage: 'Invalid format. Use Ethiopian format: 09XXXXXXXX, 011XXXXXXX, 07XXXXXXXX, or +251 9XXXXXXXX',
    };
  }

  // Ensure nationalNumber contains only digits
  if (!/^\d{9}$/.test(nationalNumber)) {
    return {
      isValid: false,
      errorMessage: 'Ethiopian phone number must contain valid digits only',
    };
  }

  // Format into canonical Ethiopian international representation: +251 9XX XXX XXX
  const p1 = nationalNumber.slice(0, 3);
  const p2 = nationalNumber.slice(3, 6);
  const p3 = nationalNumber.slice(6, 9);
  const normalized = `+251 ${p1} ${p2} ${p3}`;

  return {
    isValid: true,
    operator,
    normalized,
    rawDigits: `+251${nationalNumber}`,
  };
}

export function validateFeedbackPhone(input: string): PhoneValidationResult {
  const compact = input.trim().replace(/[\s\-()]/g, '');
  if (!/^(?:09\d{8}|\+2519\d{8})$/.test(compact)) {
    return {
      isValid: false,
      errorMessage: 'Use a valid Ethiopian mobile number starting with 09 or +251 9.',
    };
  }
  return validateEthiopianPhone(compact);
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const randomLetters = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `GM-${new Date().getFullYear()}-${timestamp}${randomLetters}`;
}
