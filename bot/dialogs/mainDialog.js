// Enhanced MainDialog.js with improved flow
const { ComponentDialog, WaterfallDialog, TextPrompt, ChoicePrompt, NumberPrompt, ConfirmPrompt } = require('botbuilder-dialogs');
const { MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';
const TEXT_PROMPT = 'textPrompt';
const CHOICE_PROMPT = 'choicePrompt';
const NUMBER_PROMPT = 'numberPrompt';
const CONFIRM_PROMPT = 'confirmPrompt';

class MainDialog extends ComponentDialog {
    constructor(flightService) {
        super('MainDialog');
        
        this.flightService = flightService;
        
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.initialStep.bind(this),
            this.actionStep.bind(this),
            this.originStep.bind(this),
            this.destinationStep.bind(this),
            this.departureDateStep.bind(this),
            this.returnDateStep.bind(this),
            this.passengersStep.bind(this),
            this.searchFlightsStep.bind(this),
            this.finalStep.bind(this)
        ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
    }
    
    async initialStep(stepContext) {
        const messageText = stepContext.options.restartMsg || '✈️ Welcome to Flight Booking Bot! How can I help you today?';
        
        const promptOptions = {
            prompt: MessageFactory.text(messageText),
            choices: [
                'Search Flights',
                'Check Flight Status', 
                'View My Bookings',
                'Cancel Booking'
            ]
        };
        
        return await stepContext.prompt(CHOICE_PROMPT, promptOptions);
    }
    
    async actionStep(stepContext) {
        const action = stepContext.result.value;
        stepContext.values.action = action;
        
        switch (action) {
            case 'Search Flights':
                return await stepContext.prompt(TEXT_PROMPT, {
                    prompt: MessageFactory.text('Great! Let\'s find you some flights. 🛫\n\nPlease enter your departure city (e.g., Mumbai, Delhi, Bangalore):')
                });
                
            case 'Check Flight Status':
                return await stepContext.prompt(TEXT_PROMPT, {
                    prompt: MessageFactory.text('Please enter your flight number (e.g., AI101, 6E234):')
                });
                
            case 'View My Bookings':
                await stepContext.context.sendActivity('📋 Here are your recent bookings:\n\n*This feature is coming soon!*');
                return await stepContext.endDialog();
                
            case 'Cancel Booking':
                await stepContext.context.sendActivity('❌ Booking cancellation:\n\n*This feature is coming soon!*');
                return await stepContext.endDialog();
                
            default:
                await stepContext.context.sendActivity('I didn\'t understand that option. Please try again.');
                return await stepContext.replaceDialog(this.id);
        }
    }
    
    async originStep(stepContext) {
        const action = stepContext.values.action;
        
        if (action === 'Check Flight Status') {
            const flightNumber = stepContext.result;
            await this.handleFlightStatus(stepContext, flightNumber);
            return await stepContext.endDialog();
        }
        
        // Continue with flight search
        stepContext.values.origin = stepContext.result;
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: MessageFactory.text('Where would you like to go? (destination city):')
        });
    }
    
    async destinationStep(stepContext) {
        stepContext.values.destination = stepContext.result;
        return await stepContext.prompt(TEXT_PROMPT, {
            prompt: MessageFactory.text('When would you like to travel? (YYYY-MM-DD format, e.g., 2025-07-15):')
        });
    }
    
    async departureDateStep(stepContext) {
        const dateInput = stepContext.result;
        
        // Basic date validation
        if (!this.isValidDate(dateInput)) {
            await stepContext.context.sendActivity('Please enter a valid date in YYYY-MM-DD format (e.g., 2025-07-15).');
            return await stepContext.replaceDialog(this.id, { restartMsg: 'Let\'s try again.' });
        }
        
        stepContext.values.departureDate = dateInput;
        
        return await stepContext.prompt(CONFIRM_PROMPT, {
            prompt: MessageFactory.text('Is this a round trip? (Yes for round trip, No for one way)')
        });
    }
    
    async returnDateStep(stepContext) {
        const isRoundTrip = stepContext.result;
        stepContext.values.isRoundTrip = isRoundTrip;
        
        if (isRoundTrip) {
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: MessageFactory.text('When would you like to return? (YYYY-MM-DD format):')
            });
        } else {
            stepContext.values.returnDate = null;
            return await stepContext.next();
        }
    }
    
    async passengersStep(stepContext) {
        if (stepContext.values.isRoundTrip && stepContext.result) {
            const returnDateInput = stepContext.result;
            
            if (!this.isValidDate(returnDateInput)) {
                await stepContext.context.sendActivity('Please enter a valid return date in YYYY-MM-DD format.');
                return await stepContext.replaceDialog(this.id, { restartMsg: 'Let\'s try again.' });
            }
            
            stepContext.values.returnDate = returnDateInput;
        }
        
        return await stepContext.prompt(NUMBER_PROMPT, {
            prompt: MessageFactory.text('How many passengers? (1-9):'),
            validations: {
                required: true,
                min: 1,
                max: 9
            }
        });
    }
    
    async searchFlightsStep(stepContext) {
        stepContext.values.passengers = stepContext.result || 1;
        
        // Show search summary
        const summary = this.createSearchSummary(stepContext.values);
        await stepContext.context.sendActivity(MessageFactory.text(summary));
        await stepContext.context.sendActivity(MessageFactory.text('🔍 Searching for flights...'));
        
        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const searchResult = await this.flightService.searchFlights(
                stepContext.values.origin,
                stepContext.values.destination,
                stepContext.values.departureDate,
                stepContext.values.returnDate,
                stepContext.values.passengers
            );
            
            console.log('MainDialog: Search completed, result:', searchResult);
            
            if (searchResult && searchResult.flights && searchResult.flights.length > 0) {
                await stepContext.context.sendActivity(MessageFactory.text(`✅ Found ${searchResult.flights.length} flights for your search!`));
                
                // Add search parameters to the result for booking purposes
                searchResult.searchParams = {
                    origin: stepContext.values.origin,
                    destination: stepContext.values.destination,
                    departureDate: stepContext.values.departureDate,
                    returnDate: stepContext.values.returnDate,
                    passengers: stepContext.values.passengers
                };
                
                return await stepContext.endDialog(searchResult);
            } else {
                await stepContext.context.sendActivity(MessageFactory.text('❌ No flights found for your search criteria. Please try different dates or destinations.'));
                return await stepContext.endDialog();
            }
            
        } catch (error) {
            console.error('MainDialog: Search error:', error);
            await stepContext.context.sendActivity(MessageFactory.text('❌ Sorry, there was an error searching for flights. Please try again.'));
            return await stepContext.endDialog();
        }
    }
    
    async finalStep(stepContext) {
        return await stepContext.endDialog();
    }
    
    async handleFlightStatus(stepContext, flightNumber) {
        try {
            await stepContext.context.sendActivity(MessageFactory.text('🔍 Checking flight status...'));
            
            const status = await this.flightService.getFlightStatus(flightNumber);
            
            if (status) {
                const statusMessage = this.formatFlightStatus(status);
                await stepContext.context.sendActivity(MessageFactory.text(statusMessage));
            } else {
                await stepContext.context.sendActivity(MessageFactory.text('❌ Flight not found. Please check the flight number and try again.'));
            }
        } catch (error) {
            console.error('Error getting flight status:', error);
            await stepContext.context.sendActivity(MessageFactory.text('❌ Sorry, I couldn\'t retrieve the flight status. Please try again later.'));
        }
    }
    
    createSearchSummary(values) {
        let summary = `📋 **Search Summary:**\n`;
        summary += `🛫 **From:** ${values.origin}\n`;
        summary += `🛬 **To:** ${values.destination}\n`;
        summary += `📅 **Departure:** ${values.departureDate}\n`;
        
        if (values.returnDate) {
            summary += `📅 **Return:** ${values.returnDate}\n`;
        }
        
        summary += `👥 **Passengers:** ${values.passengers}\n`;
        summary += `🎫 **Trip Type:** ${values.isRoundTrip ? 'Round Trip' : 'One Way'}\n`;
        
        return summary;
    }
    
    formatFlightStatus(status) {
        let message = `✈️ **Flight Status: ${status.flightNumber}**\n\n`;
        message += `📊 **Status:** ${status.status.toUpperCase()}\n\n`;
        
        message += `🛫 **Departure:**\n`;
        message += `📍 ${status.departure.airport}\n`;
        message += `⏰ Scheduled: ${new Date(status.departure.scheduled).toLocaleString('en-IN')}\n`;
        message += `⏰ Estimated: ${new Date(status.departure.estimated).toLocaleString('en-IN')}\n\n`;
        
        message += `🛬 **Arrival:**\n`;
        message += `📍 ${status.arrival.airport}\n`;
        message += `⏰ Scheduled: ${new Date(status.arrival.scheduled).toLocaleString('en-IN')}\n`;
        message += `⏰ Estimated: ${new Date(status.arrival.estimated).toLocaleString('en-IN')}\n`;
        
        return message;
    }
    
    isValidDate(dateString) {
        // Basic date validation for YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return date instanceof Date && !isNaN(date) && date >= today;
    }
}

module.exports = { MainDialog };

