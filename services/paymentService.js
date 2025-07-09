const { v4: uuidv4 } = require("uuid");
const databaseService = require("./databaseService");

class PaymentService {
  constructor() {
    this.supportedMethods = [
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
    ];
    this.currencies = ["USD", "EUR", "INR", "GBP"];
  }

  // Validate payment method
  isValidPaymentMethod(method) {
    if (!method) return false;
    return this.supportedMethods.includes(method.toLowerCase());
  }

  // Validate credit card number (basic validation)
  validateCreditCard(cardNumber) {
    // Remove spaces and hyphens
    const cleanNumber = cardNumber.replace(/[\s-]/g, "");

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

    const [month, year] = expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    if (
      expYear < currentYear ||
      (expYear === currentYear && expMonth < currentMonth)
    ) {
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
      console.log("Processing payment with data:", paymentData);
      
      // Enhanced validation
      if (!paymentData) {
        throw new Error("Payment data is required");
      }

      if (!paymentData.bookingId) {
        throw new Error("Booking ID is required");
      }

      // Handle both amount formats (direct amount or amountMoney object)
      let amountInSmallestUnit;
      let currency;

      if (paymentData.amountMoney) {
        // If amountMoney object is provided, use it
        amountInSmallestUnit = paymentData.amountMoney.amount;
        currency = paymentData.amountMoney.currency;
      } else {
        // Use direct amount and currency fields
        amountInSmallestUnit = paymentData.amount;
        currency = paymentData.currency || 'USD';
      }

      // Validate amount
      if (!amountInSmallestUnit || amountInSmallestUnit <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Validate currency
      const supportedCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY'];
      if (!supportedCurrencies.includes(currency)) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      // Convert amount back to main currency unit for database storage
      let amountInMainUnit;
      if (currency === 'JPY' || currency === 'KRW') {
        // Yen and Won don't have fractional units
        amountInMainUnit = amountInSmallestUnit;
      } else {
        // Most currencies use cents/paise (1/100 of main unit)
        amountInMainUnit = amountInSmallestUnit / 100;
      }

      // Validate card information
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
        throw new Error("Card information is incomplete");
      }

      // Validate card number format (basic validation)
      const cardNumber = paymentData.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardNumber)) {
        throw new Error("Invalid card number format");
      }

      // Validate expiry date format (MM/YY)
      if (!/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
        throw new Error("Invalid expiry date format");
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(paymentData.cvv)) {
        throw new Error("Invalid CVV format");
      }

      // Mock payment gateway processing (90% success rate)
      const isSuccessful = Math.random() > 0.1;
      const transactionId = uuidv4();

      console.log("Payment processing result:", {
        isSuccessful,
        transactionId,
        amount: amountInMainUnit,
        currency,
        bookingId: paymentData.bookingId
      });

      // Prepare the data for the database
      const paymentRecordData = {
        bookingId: paymentData.bookingId,
        transactionId: transactionId,
        amount: amountInMainUnit, // Amount in main currency unit (dollars/rupees)
        currency: currency, // Store the currency
        paymentMethod: paymentData.paymentMethod || "credit_card",
        paymentStatus: isSuccessful ? "completed" : "failed",
        paymentGateway: "mock_gateway",
        gatewayTransactionId: isSuccessful ? `gw_${transactionId}` : null,
        customerEmail: paymentData.customerEmail,
        customerName: paymentData.customerName,
        cardLast4: cardNumber.slice(-4), // Store only last 4 digits
        createdAt: new Date(),
      };

      // Store payment record in database
      await databaseService.createPaymentRecord(paymentRecordData);

      if (isSuccessful) {
        return {
          success: true,
          transactionId: transactionId,
          paymentId: transactionId, // Some systems expect paymentId
          message: "Payment processed successfully",
          amount: amountInMainUnit,
          currency: currency,
          gatewayTransactionId: `gw_${transactionId}`
        };
      } else {
        return {
          success: false,
          error: "Payment processing failed. Please try again.",
          message: "Payment processing failed. Please try again.",
          transactionId: null,
          paymentId: null
        };
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      
      // Try to save failed payment record
      try {
        if (paymentData?.bookingId) {
          const failedPaymentData = {
            bookingId: paymentData.bookingId,
            transactionId: uuidv4(),
            amount: 0,
            currency: paymentData.currency || paymentData.amountMoney?.currency || 'USD',
            paymentMethod: paymentData.paymentMethod || "credit_card",
            paymentStatus: "failed",
            paymentGateway: "mock_gateway",
            gatewayTransactionId: null,
            errorMessage: error.message,
            createdAt: new Date(),
          };
          await databaseService.createPaymentRecord(failedPaymentData);
        }
      } catch (dbError) {
        console.error("Failed to save failed payment record:", dbError);
      }

      return {
        success: false,
        error: error.message || "An error occurred while processing payment",
        message: error.message || "An error occurred while processing payment",
        transactionId: null,
        paymentId: null
      };
    }
  }

  // Helper method to validate card number using Luhn algorithm
  validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
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

  // Helper method to get card type
  getCardType(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    
    return 'unknown';
  }

  // Helper method to format currency amount for display
  formatCurrencyAmount(amount, currency) {
    const symbols = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    
    const symbol = symbols[currency] || currency + ' ';
    
    if (currency === 'JPY' || currency === 'KRW') {
      return `${symbol}${Math.round(amount)}`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  // Validate payment data
  validatePaymentData(paymentData) {
    const errors = [];

    // Check required fields
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push("Invalid payment amount");
    }

    if (!paymentData.paymentMethod) {
      errors.push("Payment method is required");
    }

    if (!this.isValidPaymentMethod(paymentData.paymentMethod)) {
      errors.push("Unsupported payment method");
    }

    if (!paymentData.bookingId) {
      errors.push("Booking ID is required");
    }

    // Validate card details for card payments
    if (["credit_card", "debit_card"].includes(paymentData.paymentMethod)) {
      if (
        !paymentData.cardNumber ||
        !this.validateCreditCard(paymentData.cardNumber)
      ) {
        errors.push("Invalid card number");
      }

      if (
        !paymentData.expiryDate ||
        !this.validateExpiryDate(paymentData.expiryDate)
      ) {
        errors.push("Invalid expiry date");
      }

      if (!paymentData.cvv || !this.validateCVV(paymentData.cvv)) {
        errors.push("Invalid CVV");
      }

      if (
        !paymentData.cardHolderName ||
        paymentData.cardHolderName.trim().length < 2
      ) {
        errors.push("Invalid cardholder name");
      }
    }

    // Validate PayPal email
    if (paymentData.paymentMethod === "paypal") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!paymentData.email || !emailRegex.test(paymentData.email)) {
        errors.push("Invalid PayPal email address");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  // Calculate processing fee
  calculateProcessingFee(amount, paymentMethod) {
    const feeRates = {
      credit_card: 0.029, // 2.9%
      debit_card: 0.019, // 1.9%
      paypal: 0.034, // 3.4%
      bank_transfer: 0.005, // 0.5%
    };

    const rate = feeRates[paymentMethod] || 0.029;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  // Get payment methods with fees
  getPaymentMethods(amount) {
    return this.supportedMethods.map((method) => ({
      method: method,
      displayName: this.getPaymentMethodDisplayName(method),
      processingFee: this.calculateProcessingFee(amount, method),
    }));
  }

  // Get display name for payment method
  getPaymentMethodDisplayName(method) {
    const displayNames = {
      credit_card: "Credit Card",
      debit_card: "Debit Card",
      paypal: "PayPal",
      bank_transfer: "Bank Transfer",
    };
    return displayNames[method] || method;
  }

  // Simulate processing delay
  async simulateProcessingDelay() {
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    return new Promise((resolve) => setTimeout(resolve, delay));
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
          message: "Refund processed successfully",
        };
      } else {
        return {
          success: false,
          error: "Refund processing failed. Please contact support.",
          refundId: null,
        };
      }
    } catch (error) {
      console.error("Refund processing error:", error);
      return {
        success: false,
        error: "An error occurred while processing refund",
        refundId: null,
      };
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const payment = await databaseService.getPaymentByBookingId(paymentId);
      return payment ? payment.status : null;
    } catch (error) {
      console.error("Error getting payment status:", error);
      return null;
    }
  }
}

module.exports = new PaymentService();
