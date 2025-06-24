// Enhanced BookingDialog.js with complete passenger details collection
const { ComponentDialog, WaterfallDialog, TextPrompt, ConfirmPrompt, NumberPrompt } = require('botbuilder-dialogs');
const { MessageFactory, CardFactory } = require('botbuilder');
const { DatabaseService } = require('../../services/databaseService');
const PaymentService = require('../../services/paymentService');

const WATERFALL_DIALOG = 'waterfallDialog';
const TEXT_PROMPT = 'textPrompt';
const CONFIRM_PROMPT = 'confirmPrompt';
const NUMBER_PROMPT = 'numberPrompt';

class BookingDialog extends ComponentDialog {
    constructor() {
        super('BookingDialog');

        this.databaseService = new DatabaseService();
        this.paymentService = new PaymentService();

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.initBookingStep.bind(this),
            this.collectPassengerNameStep.bind(this),
            this.collectEmailStep.bind(this),
            this.collectPhoneStep.bind(this),
            this.collectPassportStep.bind(this),
            this.collectAddressStep.bind(this),
            this.collectEmergencyContactStep.bind(this),
            this.showBookingSummaryStep.bind(this),
            this.confirmBookingStep.bind(this),
            this.processPaymentStep.bind(this),
            this.finalConfirmationStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initBookingStep(stepContext) {
        // Check if flight data is available
        const flightData = stepContext.options.flightData;
        const searchParams = stepContext.options.searchParams;
        
        if (!flightData) {
            await stepContext.context.sendActivity(MessageFactory.text('❌ No flight selected. Please search and select a flight first.'));
            return await stepContext.endDialog();
        }
        
        // Store flight and search data
        stepContext.values.flightData = flightData;
        stepContext.values.searchParams = searchParams;
        stepContext.values.passengers = [];
        stepContext.values.currentPassengerIndex = 0;
        
        await stepContext.context.sendActivity(MessageFactory.text('✈️ **Starting Booking Process**\n\nI\'ll need to collect passenger details for your booking. Let\'s start with the first passenger.'));
        
        return await stepContext.next();
    }

    async collectPassengerNameStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`👤 **Passenger ${currentIndex + 1} of ${totalPassengers}**\n\nPlease enter the full name (as per ID/Passport):`)
            });
        } else {
            // All passengers collected, move to next step
            return await stepContext.next();
        }
    }

    async collectEmailStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            // Initialize passenger object if not exists
            if (!stepContext.values.passengers[currentIndex]) {
                stepContext.values.passengers[currentIndex] = {};
            }
            
            stepContext.values.passengers[currentIndex].fullName = stepContext.result;
            
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`📧 **Email for ${stepContext.values.passengers[currentIndex].fullName}:**\n\nPlease enter a valid email address:`)
            });
        } else {
            return await stepContext.next();
        }
    }

    async collectPhoneStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            const email = stepContext.result;
            
            // Basic email validation
            if (!this.isValidEmail(email)) {
                await stepContext.context.sendActivity(MessageFactory.text('❌ Please enter a valid email address.'));
                return await stepContext.replaceDialog(this.id, stepContext.options);
            }
            
            stepContext.values.passengers[currentIndex].email = email;
            
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`📱 **Phone number for ${stepContext.values.passengers[currentIndex].fullName}:**\n\nPlease enter phone number with country code (e.g., +91 9876543210):`)
            });
        } else {
            return await stepContext.next();
        }
    }

    async collectPassportStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            stepContext.values.passengers[currentIndex].phone = stepContext.result;
            
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`🛂 **ID/Passport for ${stepContext.values.passengers[currentIndex].fullName}:**\n\nPlease enter ID/Passport number:`)
            });
        } else {
            return await stepContext.next();
        }
    }

    async collectAddressStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            stepContext.values.passengers[currentIndex].passport = stepContext.result;
            
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`🏠 **Address for ${stepContext.values.passengers[currentIndex].fullName}:**\n\nPlease enter complete address:`)
            });
        } else {
            return await stepContext.next();
        }
    }

    async collectEmergencyContactStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            stepContext.values.passengers[currentIndex].address = stepContext.result;
            
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text(`🚨 **Emergency contact for ${stepContext.values.passengers[currentIndex].fullName}:**\n\nPlease enter emergency contact name and phone number:`)
            });
        } else {
            return await stepContext.next();
        }
    }

    async showBookingSummaryStep(stepContext) {
        const currentIndex = stepContext.values.currentPassengerIndex;
        const totalPassengers = stepContext.values.searchParams.passengers;
        
        if (currentIndex < totalPassengers) {
            stepContext.values.passengers[currentIndex].emergencyContact = stepContext.result;
            
            // Move to next passenger
            stepContext.values.currentPassengerIndex++;
            
            // If more passengers, continue collecting details
            if (stepContext.values.currentPassengerIndex < totalPassengers) {
                await stepContext.context.sendActivity(MessageFactory.text(`✅ Details collected for ${stepContext.values.passengers[currentIndex].fullName}\n\nNow let's collect details for the next passenger.`));
                return await stepContext.replaceDialog(this.id, stepContext.options);
            }
        }
        
        // All passenger details collected, show summary
        const summaryCard = this.createBookingSummaryCard(stepContext.values);
        await stepContext.context.sendActivity(MessageFactory.attachment(summaryCard));
        
        return await stepContext.next();
    }

    async confirmBookingStep(stepContext) {
        return await stepContext.prompt(CONFIRM_PROMPT, {
            prompt: MessageFactory.text('✅ Please review the booking details above. Do you want to proceed with the booking?')
        });
    }

    async processPaymentStep(stepContext) {
        const confirmBooking = stepContext.result;
        
        if (!confirmBooking) {
            await stepContext.context.sendActivity(MessageFactory.text('❌ Booking cancelled. Thank you for using our service.'));
            return await stepContext.endDialog();
        }
        
        // Create booking record
        const bookingData = {
            bookingId: this.generateBookingId(),
            flight: stepContext.values.flightData,
            passengers: stepContext.values.passengers,
            searchParams: stepContext.values.searchParams,
            bookingDate: new Date(),
            status: 'PENDING_PAYMENT',
            totalAmount: this.calculateTotalAmount(stepContext.values.flightData, stepContext.values.passengers.length)
        };
        
        stepContext.values.bookingData = bookingData;
        
        await stepContext.context.sendActivity(MessageFactory.text('💳 **Processing Payment**\n\nInitiating secure payment process...'));
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
            const paymentResult = await this.paymentService.processPayment({
                amount: bookingData.totalAmount,
                currency: 'INR',
                bookingId: bookingData.bookingId,
                customerEmail: stepContext.values.passengers[0].email
            });
            
            if (paymentResult.success) {
                bookingData.status = 'CONFIRMED';
                bookingData.paymentId = paymentResult.paymentId;
                
                // Save booking to database
                await this.databaseService.saveBooking(bookingData);
                
                return await stepContext.next();
            } else {
                await stepContext.context.sendActivity(MessageFactory.text('❌ Payment failed. Please try again or contact support.'));
                return await stepContext.endDialog();
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            await stepContext.context.sendActivity(MessageFactory.text('❌ Payment processing failed. Please try again later.'));
            return await stepContext.endDialog();
        }
    }

    async finalConfirmationStep(stepContext) {
        const bookingData = stepContext.values.bookingData;
        
        // Send confirmation card
        const confirmationCard = this.createConfirmationCard(bookingData);
        await stepContext.context.sendActivity(MessageFactory.attachment(confirmationCard));
        
        // Send confirmation email (simulated)
        await stepContext.context.sendActivity(MessageFactory.text('📧 A confirmation email has been sent to your registered email address.'));
        
        await stepContext.context.sendActivity(MessageFactory.text('🎉 **Booking Completed Successfully!**\n\nThank you for choosing our service. Have a great trip! ✈️'));
        
        return await stepContext.endDialog();
    }

    createBookingSummaryCard(values) {
        const flight = values.flightData;
        const passengers = values.passengers;
        const totalAmount = this.calculateTotalAmount(flight, passengers.length);
        
        // Create passenger list
        const passengerFacts = passengers.map((passenger, index) => {
            return {
                title: `Passenger ${index + 1}:`,
                value: `${passenger.fullName} (${passenger.email})`
            };
        });
        
        return CardFactory.adaptiveCard({
            type: "AdaptiveCard",
            version: "1.2",
            body: [
                {
                    type: "Container",
                    style: "accent",
                    items: [
                        {
                            type: "TextBlock",
                            text: "📋 Booking Summary",
                            weight: "Bolder",
                            size: "Large",
                            horizontalAlignment: "Center",
                            color: "Light"
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "✈️ Flight Details",
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "FactSet",
                            facts: [
                                { title: "Flight:", value: `${flight.airline} ${flight.flightNumber}` },
                                { title: "Route:", value: `${flight.departure.airport} → ${flight.arrival.airport}` },
                                { title: "Departure:", value: `${flight.departure.time} on ${flight.departure.date}` },
                                { title: "Arrival:", value: `${flight.arrival.time} on ${flight.arrival.date}` },
                                { title: "Duration:", value: flight.duration }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "👥 Passenger Details",
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "FactSet",
                            facts: passengerFacts
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "💰 Payment Details",
                            weight: "Bolder",
                            size: "Medium"
                        },
                        {
                            type: "FactSet",
                            facts: [
                                { title: "Base Price:", value: flight.price },
                                { title: "Passengers:", value: passengers.length.toString() },
                                { title: "Total Amount:", value: `₹${totalAmount}` }
                            ]
                        }
                    ]
                }
            ]
        });
    }

    createConfirmationCard(bookingData) {
        return CardFactory.adaptiveCard({
            type: "AdaptiveCard",
            version: "1.2",
            body: [
                {
                    type: "Container",
                    style: "good",
                    items: [
                        {
                            type: "TextBlock",
                            text: "🎉 Booking Confirmed!",
                            weight: "Bolder",
                            size: "Large",
                            horizontalAlignment: "Center",
                            color: "Light"
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "FactSet",
                            facts: [
                                { title: "Booking ID:", value: bookingData.bookingId },
                                { title: "Payment ID:", value: bookingData.paymentId },
                                { title: "Status:", value: bookingData.status },
                                { title: "Total Paid:", value: `₹${bookingData.totalAmount}` },
                                { title: "Booking Date:", value: new Date(bookingData.bookingDate).toLocaleDateString('en-IN') }
                            ]
                        }
                    ]
                },
                {
                    type: "Container",
                    spacing: "Medium",
                    items: [
                        {
                            type: "TextBlock",
                            text: "Important: Please carry a valid ID/Passport for travel. Check-in online 24 hours before departure.",
                            wrap: true,
                            size: "Small",
                            color: "Warning"
                        }
                    ]
                }
            ]
        });
    }

    generateBookingId() {
        const prefix = 'FB';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
    }

    calculateTotalAmount(flight, passengerCount) {
        // Extract numeric value from price string (e.g., "₹8,500" -> 8500)
        const basePrice = parseInt(flight.price.replace(/[^\d]/g, ''));
        return basePrice * passengerCount;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = { BookingDialog };