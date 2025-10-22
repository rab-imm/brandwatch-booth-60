/**
 * Phase 1: Input Sanitization Library
 * XSS prevention and input cleaning functions
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify for comprehensive XSS prevention
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text by removing all HTML tags and special characters
 */
export function sanitizePlainText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Sanitize file name to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.\.+/g, '.') // Prevent path traversal
    .substring(0, 255); // Limit length
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http, https, mailto, tel
  if (!lowerUrl.match(/^(https?|mailto|tel):/i) && !lowerUrl.startsWith('/')) {
    return '';
  }
  
  return trimmed;
}

/**
 * Escape special characters for safe SQL-like operations
 * Note: This is NOT a substitute for parameterized queries!
 * Only use for display purposes, never for database queries
 */
export function escapeSpecialChars(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f');
}

/**
 * Sanitize WhatsApp message text (for external API calls)
 * Removes dangerous characters that could break WhatsApp API
 */
export function sanitizeWhatsAppText(text: string): string {
  return text
    .replace(/[^\w\s\-.,!?@#$%&*()+=/\\[\]{}:;"'<>~`|]/g, '') // Keep safe chars
    .substring(0, 4096); // WhatsApp message length limit
}

/**
 * Sanitize email subject line
 */
export function sanitizeEmailSubject(subject: string): string {
  return subject
    .replace(/[\r\n]/g, '') // Remove newlines (prevent header injection)
    .replace(/[^\w\s\-.,!?@#$%&*()+=/\\[\]{}:;"'<>~`|]/g, '')
    .substring(0, 200); // Reasonable subject length
}

/**
 * Sanitize email body (allow some HTML for formatting)
 */
export function sanitizeEmailBody(body: string): string {
  return DOMPurify.sanitize(body, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'strong', 'em', 'u',
      'ul', 'ol', 'li', 'a', 'div', 'span',
    ],
    ALLOWED_ATTR: ['href', 'target', 'style'],
  });
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJSON(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Remove dangerous keys
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  
  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (!dangerousKeys.includes(key.toLowerCase())) {
        sanitized[key] = sanitizeJSON(obj[key]);
      }
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize credit card number (for display only - never store!)
 */
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return '****';
  }
  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
}

/**
 * Sanitize phone number for display (mask middle digits)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 7) {
    return phone;
  }
  const first = cleaned.slice(0, 3);
  const last = cleaned.slice(-3);
  const middle = '*'.repeat(cleaned.length - 6);
  return `${first}${middle}${last}`;
}

/**
 * Sanitize Emirates ID for display (mask middle digits)
 */
export function maskEmiratesID(emiratesId: string): string {
  const cleaned = emiratesId.replace(/\D/g, '');
  if (cleaned.length !== 15) {
    return emiratesId;
  }
  return `${cleaned.slice(0, 3)}-****-*******-${cleaned.slice(-1)}`;
}

/**
 * Remove all whitespace and normalize string
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize search query to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\s\-.,]/g, '') // Remove special characters
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Validate and sanitize hex color code
 */
export function sanitizeHexColor(color: string): string {
  const cleaned = color.replace(/[^0-9A-Fa-f#]/g, '');
  if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
    return cleaned;
  }
  return '#000000'; // Default to black if invalid
}

/**
 * Sanitize CSS class name
 */
export function sanitizeCSSClassName(className: string): string {
  return className
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^[0-9-]/, '_'); // Can't start with number or hyphen
}

/**
 * Deep freeze object to prevent modification (security)
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  Object.freeze(obj);
  
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value);
    }
  });
  
  return obj;
}
