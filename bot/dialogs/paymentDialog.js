// File: services/paymentService.js
const { v4: uuidv4 } = require('uuid');
const databaseService = require('./databaseService');

class PaymentService {
    constructor() {
        // Initialize payment gateway configurations
        this.squareConfig = {
            environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
            applicationId: process.env.SQUARE_APPLICATION_ID,
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            locationId: process.env.SQUARE_LOCATION_ID
        };
    }

    async processSecurePayment(paymentData) {
        const transactionId = uuidv4();
        
        try {
            // Create payment record in database FIRST
            const paymentRecord = await databaseService.createPaymentRecord({
                bookingId: paymentData.bookingId || paymentData.orderNumber,
                transactionId: transactionId,
                amount: paymentData.amount,
                paymentMethod: paymentData.method || paymentData.paymentMethod,
                paymentStatus: 'pending',
                paymentGateway: 'square',
                gatewayTransactionId: null
            });

            // Process payment based on method
            let paymentResult;
            if (paymentData.method === 'PayPal' || paymentData.method === 'Apple Pay') {
                paymentResult = await this.processAlternativePayment(paymentData, transactionId);
            } else {
                paymentResult = await this.processCardPayment(paymentData, transactionId);
            }

            // Update payment record with result
            if (paymentResult.success) {
                await databaseService.updatePaymentRecord(
                    transactionId, 
                    'completed', 
                    null
                );
                
                // Update booking payment status
                if (paymentData.bookingId) {
                    await databaseService.updatePaymentStatus(
                        paymentData.bookingId, 
                        'paid', 
                        transactionId
                    );
                }
            } else {
                await databaseService.updatePaymentRecord(
                    transactionId, 
                    'failed', 
                    paymentResult.error
                );
            }

            return {
                success: paymentResult.success,
                transactionId: transactionId,
                gatewayTransactionId: paymentResult.gatewayTransactionId,
                amount: paymentData.amount,
                error: paymentResult.error
            };

        } catch (error) {
            console.error('Payment processing error:', error);
            
            // Update payment record as failed
            try {
                await databaseService.updatePaymentRecord(
                    transactionId, 
                    'failed', 
                    error.message
                );
            } catch (dbError) {
                console.error('Failed to update payment record:', dbError);
            }

            return {
                success: false,
                error: 'An error occurred while processing payment',
                transactionId: transactionId
            };
        }
    }

    async processCardPayment(paymentData, transactionId) {
        try {
            // Simulate card payment processing
            console.log('Processing card payment:', {
                transactionId,
                amount: paymentData.amount,
                method: paymentData.method || paymentData.paymentMethod
            });

            // Simulate payment gateway call
            const isSuccessful = Math.random() > 0.1; // 90% success rate for demo
            
            if (isSuccessful) {
                return {
                    success: true,
                    gatewayTransactionId: `gw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    message: 'Payment processed successfully'
                };
            } else {
                return {
                    success: false,
                    error: 'Card payment declined by bank',
                    gatewayTransactionId: null
                };
            }

        } catch (error) {
            console.error('Card payment error:', error);
            return {
                success: false,
                error: 'Payment gateway error',
                gatewayTransactionId: null
            };
        }
    }

    async processAlternativePayment(paymentData, transactionId) {
        try {
            console.log('Processing alternative payment:', {
                transactionId,
                method: paymentData.method,
                amount: paymentData.amount
            });

            // Simulate alternative payment processing
            const isSuccessful = Math.random() > 0.05; // 95% success rate for demo
            
            if (isSuccessful) {
                return {
                    success: true,
                    gatewayTransactionId: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    message: `${paymentData.method} payment processed successfully`
                };
            } else {
                return {
                    success: false,
                    error: `${paymentData.method} payment failed`,
                    gatewayTransactionId: null
                };
            }

        } catch (error) {
            console.error('Alternative payment error:', error);
            return {
                success: false,
                error: 'Alternative payment processing error',
                gatewayTransactionId: null
            };
        }
    }

    // Method to handle refunds
    async processRefund(transactionId, amount) {
        try {
            // Simulate refund processing
            console.log('Processing refund:', { transactionId, amount });
            
            const refundResult = {
                success: true,
                refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                amount: amount,
                message: 'Refund processed successfully'
            };

            // You would integrate with your actual payment gateway here
            return refundResult;

        } catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                error: 'Refund processing failed',
                refundId: null
            };
        }
    }

    // Method to verify payment status
    async verifyPaymentStatus(transactionId) {
        try {
            // In a real implementation, you would call your payment gateway's API
            // to verify the payment status
            console.log('Verifying payment status for:', transactionId);
            
            return {
                success: true,
                status: 'completed',
                transactionId: transactionId
            };

        } catch (error) {
            console.error('Payment verification error:', error);
            return {
                success: false,
                error: 'Payment verification failed'
            };
        }
    }

    // Method to get payment details
    async getPaymentDetails(transactionId) {
        try {
            // This would typically query your payment gateway
            console.log('Getting payment details for:', transactionId);
            
            return {
                transactionId: transactionId,
                status: 'completed',
                amount: 0, // Would be fetched from gateway
                method: 'card',
                processedAt: new Date()
            };

        } catch (error) {
            console.error('Error getting payment details:', error);
            throw error;
        }
    }
}

module.exports = { PaymentService };