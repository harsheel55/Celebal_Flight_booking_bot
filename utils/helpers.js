/**
 * Utility helper functions for the flight booking bot
 */

/**
 * Validates email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number format
 */
function isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

/**
 * Validates credit card number using Luhn algorithm
 */
function isValidCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleanNumber)) {
        return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber.charAt(i));
        
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
}

/**
 * Validates CVV format
 */
function isValidCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

/**
 * Validates expiry date format and checks if not expired
 */
function isValidExpiryDate(expiryDate) {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const expiry = new Date(year, month - 1);
    
    return expiry > now;
}

/**
 * Validates date format and ensures it's not in the past
 */
function isValidFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today && !isNaN(date.getTime());
}

/**
 * Formats date to readable string
 */
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Formats time to 12-hour format
 */
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Calculates flight duration
 */
function calculateFlightDuration(departureTime, arrivalTime) {
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
    
    let depTotalMinutes = depHours * 60 + depMinutes;
    let arrTotalMinutes = arrHours * 60 + arrMinutes;
    
    // Handle next day arrivals
    if (arrTotalMinutes < depTotalMinutes) {
        arrTotalMinutes += 24 * 60;
    }
    
    const durationMinutes = arrTotalMinutes - depTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
}

/**
 * Generates a random booking reference
 */
function generateBookingReference() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Capitalizes first letter of each word
 */
function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

/**
 * Sanitizes user input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/script/gi, '') // Remove script tags
        .substring(0, 500); // Limit length
}

/**
 * Validates passenger count
 */
function isValidPassengerCount(count) {
    const num = parseInt(count);
    return !isNaN(num) && num >= 1 && num <= 9;
}

/**
 * Formats currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Calculates total price with taxes and fees
 */
function calculateTotalPrice(basePrice, passengers = 1) {
    const tax = basePrice * 0.12; // 12% tax
    const serviceFee = 25; // $25 service fee
    const total = (basePrice + tax) * passengers + serviceFee;
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
}

/**
 * Checks if a string contains only alphabetic characters and spaces
 */
function isAlphabeticWithSpaces(str) {
    return /^[a-zA-Z\s]+$/.test(str);
}

/**
 * Extracts city name from various formats
 */
function extractCityName(input) {
    // Remove common airport codes and extra info
    return input
        .replace(/\([^)]*\)/g, '') // Remove parentheses content
        .replace(/\b[A-Z]{3}\b/g, '') // Remove 3-letter airport codes
        .trim()
        .split(',')[0] // Take first part if comma-separated
        .trim();
}

/**
 * Validates if two dates are in correct order
 */
function isValidDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
}

/**
 * Generates a unique transaction ID
 */
function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * Masks credit card number for display
 */
function maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    return '**** **** **** ' + cleaned.slice(-4);
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formats phone number for display
 */
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone; // Return original if not 10 digits
}

module.exports = {
    isValidEmail,
    isValidPhoneNumber,
    isValidCardNumber,
    isValidCVV,
    isValidExpiryDate,
    isValidFutureDate,
    formatDate,
    formatTime,
    calculateFlightDuration,
    generateBookingReference,
    capitalizeWords,
    sanitizeInput,
    isValidPassengerCount,
    formatCurrency,
    calculateTotalPrice,
    isAlphabeticWithSpaces,
    extractCityName,
    isValidDateRange,
    generateTransactionId,
    maskCardNumber,
    delay,
    formatPhoneNumber
};