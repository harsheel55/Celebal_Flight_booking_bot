// File: bot/dialogs/paymentDialog.js
const { ComponentDialog, WaterfallDialog, TextPrompt, ChoicePrompt } = require('botbuilder-dialogs');
const { MessageFactory, CardFactory } = require('botbuilder');
const { PaymentService } = require('../../services/paymentService');

const WATERFALL_DIALOG = 'waterfallDialog';
const TEXT_PROMPT = 'textPrompt';
const CHOICE_PROMPT = 'choicePrompt';

class PaymentDialog extends ComponentDialog {
    constructor() {
        super('PaymentDialog');

        this.paymentService = new PaymentService();

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.paymentMethodStep.bind(this),
            this.cardDetailsStep.bind(this),
            this.billingAddressStep.bind(this),
            this.processPaymentStep.bind(this),
            this.confirmationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async paymentMethodStep(stepContext) {
        const paymentOptions = ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay'];
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: 'Please select your payment method:',
            choices: paymentOptions
        });
    }

    async cardDetailsStep(stepContext) {
        stepContext.values.paymentMethod = stepContext.result.value;
        
        if (stepContext.values.paymentMethod === 'PayPal' || stepContext.values.paymentMethod === 'Apple Pay') {
            // Skip card details for alternative payment methods
            stepContext.values.skipCardDetails = true;
            return await stepContext.next();
        }

        const cardForm = this.createCardDetailsForm();
        await stepContext.context.sendActivity(MessageFactory.attachment(cardForm));
        return await stepContext.prompt(TEXT_PROMPT, 'Please enter your card number (16 digits):');
    }

    async billingAddressStep(stepContext) {
        if (!stepContext.values.skipCardDetails) {
            stepContext.values.cardNumber = stepContext.result;
            
            // In a real implementation, you would collect all card details securely
            // For demo purposes, we'll simulate this
            stepContext.values.cardDetails = {
                number: stepContext.result,
                // These would be collected in a real implementation
                expiryMonth: '12',
                expiryYear: '2025',
                cvv: '123'
            };
        }

        return await stepContext.prompt(TEXT_PROMPT, 'Please enter your billing address:');
    }

    async processPaymentStep(stepContext) {
        stepContext.values.billingAddress = stepContext.result;
        
        await stepContext.context.sendActivity('🔄 Processing your payment securely...');
        
        try {
            const paymentData = {
                method: stepContext.values.paymentMethod,
                amount: stepContext.options.amount,
                currency: stepContext.options.currency || 'USD',
                cardDetails: stepContext.values.cardDetails,
                billingAddress: stepContext.values.billingAddress
            };

            const result = await this.paymentService.processSecurePayment(paymentData);
            stepContext.values.paymentResult = result;
            
        } catch (error) {
            console.error('Payment error:', error);
            stepContext.values.paymentResult = {
                success: false,
                error: 'Payment processing failed. Please try again.'
            };
        }

        return await stepContext.next();
    }

    async confirmationStep(stepContext) {
        const result = stepContext.values.paymentResult;
        
        if (result.success) {
            const successCard = this.createPaymentSuccessCard(result);
            await stepContext.context.sendActivity(MessageFactory.attachment(successCard));
            return await stepContext.endDialog(result);
        } else {
            const errorCard = this.createPaymentErrorCard(result.error);
            await stepContext.context.sendActivity(MessageFactory.attachment(errorCard));
            return await stepContext.endDialog(result);
        }
    }

    createCardDetailsForm() {
        return CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: '💳 Secure Payment',
                    weight: 'Bolder',
                    size: 'Medium'
                },
                {
                    type: 'TextBlock',
                    text: 'Your payment information is encrypted and secure.',
                    size: 'Small',
                    color: 'Accent'
                },
                {
                    type: 'Input.Text',
                    id: 'cardNumber',
                    placeholder: '1234 5678 9012 3456',
                    maxLength: 19,
                    style: 'Tel'
                },
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                {
                                    type: 'Input.Text',
                                    id: 'expiryDate',
                                    placeholder: 'MM/YY',
                                    maxLength: 5
                                }
                            ]
                        },
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                {
                                    type: 'Input.Text',
                                    id: 'cvv',
                                    placeholder: 'CVV',
                                    maxLength: 4,
                                    style: 'Password'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'Input.Text',
                    id: 'cardholderName',
                    placeholder: 'Cardholder Name'
                }
            ]
        });
    }

    createPaymentSuccessCard(result) {
        return CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: '✅ Payment Successful!',
                    weight: 'Bolder',
                    size: 'Large',
                    color: 'Good'
                },
                {
                    type: 'FactSet',
                    facts: [
                        { title: 'Transaction ID:', value: result.transactionId },
                        { title: 'Amount:', value: `$${result.amount}` },
                        { title: 'Date:', value: new Date().toLocaleString() },
                        { title: 'Status:', value: 'Completed' }
                    ]
                },
                {
                    type: 'TextBlock',
                    text: '🔒 Your payment has been processed securely.',
                    size: 'Small',
                    color: 'Accent'
                }
            ]
        });
    }

    createPaymentErrorCard(error) {
        return CardFactory.adaptiveCard({
            type: 'AdaptiveCard',
            version: '1.2',
            body: [
                {
                    type: 'TextBlock',
                    text: '❌ Payment Failed',
                    weight: 'Bolder',
                    size: 'Large',
                    color: 'Attention'
                },
                {
                    type: 'TextBlock',
                    text: error,
                    wrap: true,
                    color: 'Attention'
                },
                {
                    type: 'TextBlock',
                    text: 'Please check your payment details and try again, or contact your bank.',
                    wrap: true,
                    size: 'Small'
                }
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Retry Payment',
                    data: { action: 'retry_payment' }
                }
            ]
        });
    }
}

module.exports = { PaymentDialog };
