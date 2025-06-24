const { v4: uuidv4 } = require('uuid');
const databaseService = require('./databaseService');

class PaymentService {
    constructor() {
        this.supportedMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
        this.currencies = ['USD', 'EUR', 'INR', 'GBP'];
    }

    // Validate payment method
    isValidPaymentMethod(method) {
        if (!method) return false;
        return this.supportedMethods.includes(method.toLowerCase());
    }

    // Validate credit card number (basic validation)
    validateCreditCard(cardNumber) {
        // Remove spaces and hyphens
        const cleanNumber = cardNumber.replace(/[\s-]/g, '');
        
        // Check if it's all digits and has valid length
        if (!/^\d{13,19}$/.test(cleanNumber)) {
            return false;
        }

        // Luhn algorithm for basic validation
        return this.luhnCheck(cleanNumber);
    }

    // Luhn algorithm implementation
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));

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

    // Validate expiry date
    validateExpiryDate(expiryDate) {
        const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!regex.test(expiryDate)) {
            return false;
        }

        const [month, year] = expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        const expYear = parseInt(year);
        const expMonth = parseInt(month);

        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            return false;
        }

        return true;
    }

    // Validate CVV
    validateCVV(cvv) {
        return /^\d{3,4}$/.test(cvv);
    }

    // Process payment (mock implementation)
    async processPayment(paymentData) {
        try {
            // Validate payment data
            const validation = this.validatePaymentData(paymentData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', '),
                    transactionId: null
                };
            }

            // Simulate payment processing delay
            await this.simulateProcessingDelay();

            // Mock payment gateway response (90% success rate)
            const isSuccessful = Math.random() > 0.1;
            const transactionId = uuidv4();

            if (isSuccessful) {
                // Save payment record
                const payment = await databaseService.createPayment({
                    bookingId: paymentData.bookingId,
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    status: 'completed',
                    transactionId: transactionId
                });

                return {
                    success: true,
                    transactionId: transactionId,
                    paymentId: payment.id,
                    message: 'Payment processed successfully'
                };
            } else {
                // Save failed payment record
                await databaseService.createPayment({
                    bookingId: paymentData.bookingId,
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    status: 'failed',
                    transactionId: null
                });

                return {
                    success: false,
                    error: 'Payment processing failed. Please try again.',
                    transactionId: null
                };
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                error: 'An error occurred while processing payment',
                transactionId: null
            };
        }
    }

    // Validate payment data
    validatePaymentData(paymentData) {
        const errors = [];

        // Check required fields
        if (!paymentData.amount || paymentData.amount <= 0) {
            errors.push('Invalid payment amount');
        }

        if (!paymentData.paymentMethod) {
            errors.push('Payment method is required');
        }

        if (!this.isValidPaymentMethod(paymentData.paymentMethod)) {
            errors.push('Unsupported payment method');
        }

        if (!paymentData.bookingId) {
            errors.push('Booking ID is required');
        }

        // Validate card details for card payments
        if (['credit_card', 'debit_card'].includes(paymentData.paymentMethod)) {
            if (!paymentData.cardNumber || !this.validateCreditCard(paymentData.cardNumber)) {
                errors.push('Invalid card number');
            }

            if (!paymentData.expiryDate || !this.validateExpiryDate(paymentData.expiryDate)) {
                errors.push('Invalid expiry date');
            }

            if (!paymentData.cvv || !this.validateCVV(paymentData.cvv)) {
                errors.push('Invalid CVV');
            }

            if (!paymentData.cardHolderName || paymentData.cardHolderName.trim().length < 2) {
                errors.push('Invalid cardholder name');
            }
        }

        // Validate PayPal email
        if (paymentData.paymentMethod === 'paypal') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!paymentData.email || !emailRegex.test(paymentData.email)) {
                errors.push('Invalid PayPal email address');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Calculate processing fee
    calculateProcessingFee(amount, paymentMethod) {
        const feeRates = {
            'credit_card': 0.029, // 2.9%
            'debit_card': 0.019,  // 1.9%
            'paypal': 0.034,      // 3.4%
            'bank_transfer': 0.005 // 0.5%
        };

        const rate = feeRates[paymentMethod] || 0.029;
        return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
    }

    // Get payment methods with fees
    getPaymentMethods(amount) {
        return this.supportedMethods.map(method => ({
            method: method,
            displayName: this.getPaymentMethodDisplayName(method),
            processingFee: this.calculateProcessingFee(amount, method)
        }));
    }

    // Get display name for payment method
    getPaymentMethodDisplayName(method) {
        const displayNames = {
            'credit_card': 'Credit Card',
            'debit_card': 'Debit Card',
            'paypal': 'PayPal',
            'bank_transfer': 'Bank Transfer'
        };
        return displayNames[method] || method;
    }

    // Simulate processing delay
    async simulateProcessingDelay() {
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Refund payment (mock implementation)
    async refundPayment(transactionId, amount) {
        try {
            // Simulate refund processing
            await this.simulateProcessingDelay();

            // Mock refund success (95% success rate)
            const isSuccessful = Math.random() > 0.05;
            const refundId = uuidv4();

            if (isSuccessful) {
                return {
                    success: true,
                    refundId: refundId,
                    amount: amount,
                    message: 'Refund processed successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'Refund processing failed. Please contact support.',
                    refundId: null
                };
            }
        } catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                error: 'An error occurred while processing refund',
                refundId: null
            };
        }
    }

    // Get payment status
    async getPaymentStatus(paymentId) {
        try {
            const payment = await databaseService.getPaymentByBookingId(paymentId);
            return payment ? payment.status : null;
        } catch (error) {
            console.error('Error getting payment status:', error);
            return null;
        }
    }
}

module.exports = new PaymentService();