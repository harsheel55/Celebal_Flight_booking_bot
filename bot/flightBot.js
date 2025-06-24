// Enhanced flightBot.js with complete booking integration
const { ActivityHandler, MessageFactory, CardFactory } = require('botbuilder');
const { MainDialog } = require('./dialogs/mainDialog');
const { BookingDialog } = require('./dialogs/bookingDialog');
const { ConversationState, UserState, MemoryStorage } = require('botbuilder');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { FlightService } = require('../services/flightService');

class FlightBot extends ActivityHandler {
    constructor() {
        super();
        
        // Create conversation and user state
        const memoryStorage = new MemoryStorage();
        this.conversationState = new ConversationState(memoryStorage);
        this.userState = new UserState(memoryStorage);
        this.dialogState = this.conversationState.createProperty('DialogState');
        
        // Initialize services
        this.flightService = new FlightService();
        
        // Create dialogs
        this.mainDialog = new MainDialog(this.flightService);
        this.bookingDialog = new BookingDialog();
        
        this.dialogSet = new DialogSet(this.dialogState);
        this.dialogSet.add(this.mainDialog);
        this.dialogSet.add(this.bookingDialog);
        
        // Store flight search results for booking
        this.searchResults = {};
        
        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');
            console.log('Message text:', context.activity.text);
            
            try {
                // Handle card actions (flight selection)
                if (context.activity.value && context.activity.value.action === 'selectFlight') {
                    await this.handleFlightSelection(context, context.activity.value);
                    return;
                }
                
                // Handle booking confirmation
                if (context.activity.value && context.activity.value.action === 'confirmBooking') {
                    await this.handleBookingConfirmation(context, context.activity.value);
                    return;
                }
                
                const dialogContext = await this.dialogSet.createContext(context);
                const results = await dialogContext.continueDialog();
                
                if (results.status === DialogTurnStatus.empty) {
                    await dialogContext.beginDialog('MainDialog');
                }
                
                // Handle completed search results
                if (results.status === DialogTurnStatus.complete && results.result) {
                    await this.handleSearchResults(context, results.result);
                }
                
            } catch (error) {
                console.error('Error in onMessage:', error);
                await context.sendActivity(MessageFactory.text('Sorry, something went wrong. Please try again.'));
            }
            
            await next();
        });
        
        this.onMembersAdded(async (context, next) => {
            const welcomeText = '✈️ Welcome to Flight Booking Bot! I can help you search and book flights.\n\n' +
                              'Simply type "search flights" or "book flight" to get started.\n\n' +
                              'Available commands:\n' +
                              '• Search flights\n' +
                              '• Check flight status\n' +
                              '• View bookings\n' +
                              '• Cancel booking';
            
            const membersAdded = context.activity.membersAdded;
            
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText));
                }
            }
            await next();
        });
    }
    
    async handleSearchResults(context, searchResult) {
        try {
            console.log('Handling search results:', searchResult);
            
            if (searchResult.flights && searchResult.flights.length > 0) {
                // Store results for booking
                const userId = context.activity.from.id;
                this.searchResults[userId] = {
                    flights: searchResult.flights,
                    searchParams: searchResult.searchParams,
                    timestamp: new Date()
                };
                
                // Send flight cards
                const flightCards = this.createFlightCards(searchResult.flights);
                if (flightCards && flightCards.length > 0) {
                    const cardActivity = MessageFactory.carousel(flightCards);
                    cardActivity.text = `✈️ Found ${searchResult.flights.length} flights for your search:`;
                    await context.sendActivity(cardActivity);
                } else {
                    // Fallback to text if cards fail
                    const textResponse = this.formatFlightResponse(searchResult.flights);
                    await context.sendActivity(MessageFactory.text(textResponse));
                }
                
                await context.sendActivity(MessageFactory.text('Select a flight to proceed with booking! 👆'));
            } else {
                await context.sendActivity(MessageFactory.text('No flights found for your search criteria. Please try different dates or destinations.'));
            }
        } catch (error) {
            console.error('Error handling search results:', error);
            await context.sendActivity(MessageFactory.text('Sorry, there was an error displaying the search results.'));
        }
    }
    
    async handleFlightSelection(context, actionData) {
        try {
            console.log('Flight selected:', actionData);
            
            const userId = context.activity.from.id;
            const userSearchResults = this.searchResults[userId];
            
            if (!userSearchResults) {
                await context.sendActivity(MessageFactory.text('Sorry, your search results have expired. Please search again.'));
                return;
            }
            
            // Find the selected flight
            const selectedFlight = userSearchResults.flights.find(f => f.id === actionData.flightId);
            
            if (!selectedFlight) {
                await context.sendActivity(MessageFactory.text('Sorry, the selected flight is no longer available.'));
                return;
            }
            
            // Create booking confirmation card
            const confirmationCard = this.createBookingConfirmationCard(selectedFlight);
            await context.sendActivity(MessageFactory.attachment(confirmationCard));
            
        } catch (error) {
            console.error('Error handling flight selection:', error);
            await context.sendActivity(MessageFactory.text('Sorry, there was an error processing your selection.'));
        }
    }
    
    async handleBookingConfirmation(context, actionData) {
        try {
            console.log('Booking confirmation:', actionData);
            
            if (actionData.confirm === 'yes') {
                // Start the booking dialog
                const dialogContext = await this.dialogSet.createContext(context);
                
                const userId = context.activity.from.id;
                const userSearchResults = this.searchResults[userId];
                const selectedFlight = userSearchResults.flights.find(f => f.id === actionData.flightId);
                
                await dialogContext.beginDialog('BookingDialog', { 
                    flightData: selectedFlight,
                    searchParams: userSearchResults.searchParams 
                });
            } else {
                await context.sendActivity(MessageFactory.text('Booking cancelled. Feel free to select another flight or search again.'));
            }
            
        } catch (error) {
            console.error('Error handling booking confirmation:', error);
            await context.sendActivity(MessageFactory.text('Sorry, there was an error processing your booking confirmation.'));
        }
    }
    
    createFlightCards(flights) {
        const cards = [];
        
        flights.forEach((flight, index) => {
            const card = CardFactory.adaptiveCard({
                type: "AdaptiveCard",
                version: "1.2",
                body: [
                    {
                        type: "Container",
                        style: "emphasis",
                        items: [
                            {
                                type: "ColumnSet",
                                columns: [
                                    {
                                        type: "Column",
                                        width: "stretch",
                                        items: [
                                            {
                                                type: "TextBlock",
                                                text: `${flight.airline} ${flight.flightNumber}`,
                                                weight: "Bolder",
                                                size: "Medium",
                                                color: "Accent"
                                            }
                                        ]
                                    },
                                    {
                                        type: "Column",
                                        width: "auto",
                                        items: [
                                            {
                                                type: "TextBlock",
                                                text: flight.price,
                                                weight: "Bolder",
                                                size: "Large",
                                                color: "Attention"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: "Container",
                        spacing: "Medium",
                        items: [
                            {
                                type: "ColumnSet",
                                columns: [
                                    {
                                        type: "Column",
                                        width: "stretch",
                                        items: [
                                            {
                                                type: "TextBlock",
                                                text: "🛫 Departure",
                                                weight: "Bolder",
                                                size: "Small"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: `${flight.departure.time}`,
                                                weight: "Bolder",
                                                spacing: "None"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: `${flight.departure.airport}`,
                                                size: "Small",
                                                spacing: "None"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: flight.departure.date,
                                                size: "Small",
                                                color: "Accent",
                                                spacing: "None"
                                            }
                                        ]
                                    },
                                    {
                                        type: "Column",
                                        width: "auto",
                                        verticalContentAlignment: "Center",
                                        items: [
                                            {
                                                type: "TextBlock",
                                                text: "✈️",
                                                size: "Large",
                                                horizontalAlignment: "Center"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: flight.duration,
                                                size: "Small",
                                                horizontalAlignment: "Center",
                                                spacing: "None"
                                            }
                                        ]
                                    },
                                    {
                                        type: "Column",
                                        width: "stretch",
                                        items: [
                                            {
                                                type: "TextBlock",
                                                text: "🛬 Arrival",
                                                weight: "Bolder",
                                                size: "Small"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: `${flight.arrival.time}`,
                                                weight: "Bolder",
                                                spacing: "None"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: `${flight.arrival.airport}`,
                                                size: "Small",
                                                spacing: "None"
                                            },
                                            {
                                                type: "TextBlock",
                                                text: flight.arrival.date,
                                                size: "Small",
                                                color: "Accent",
                                                spacing: "None"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                actions: [
                    {
                        type: "Action.Submit",
                        title: "🎯 Select this flight",
                        style: "positive",
                        data: {
                            action: "selectFlight",
                            flightId: flight.id,
                            flightNumber: flight.flightNumber
                        }
                    }
                ]
            });
            
            cards.push(card);
        });
        
        return cards;
    }
    
    createBookingConfirmationCard(flight) {
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
                            text: "✈️ Confirm Your Flight Selection",
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
                                { title: "Flight:", value: `${flight.airline} ${flight.flightNumber}` },
                                { title: "Route:", value: `${flight.departure.airport} → ${flight.arrival.airport}` },
                                { title: "Departure:", value: `${flight.departure.time} on ${flight.departure.date}` },
                                { title: "Arrival:", value: `${flight.arrival.time} on ${flight.arrival.date}` },
                                { title: "Duration:", value: flight.duration },
                                { title: "Total Price:", value: flight.price }
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
                            text: "Proceed with booking? You'll need to provide passenger details and payment information.",
                            wrap: true,
                            size: "Small",
                            color: "Accent"
                        }
                    ]
                }
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "✅ Yes, Book This Flight",
                    style: "positive",
                    data: {
                        action: "confirmBooking",
                        flightId: flight.id,
                        confirm: "yes"
                    }
                },
                {
                    type: "Action.Submit",
                    title: "❌ Cancel",
                    data: {
                        action: "confirmBooking",
                        flightId: flight.id,
                        confirm: "no"
                    }
                }
            ]
        });
    }
    
    formatFlightResponse(flights) {
        if (!flights || flights.length === 0) {
            return "No flights found for your search.";
        }
        
        let response = `✈️ **Found ${flights.length} available flights:**\n\n`;
        
        flights.forEach((flight, index) => {
            response += `**${index + 1}. ${flight.airline} ${flight.flightNumber}**\n`;
            response += `🛫 **Departure:** ${flight.departure.time} from ${flight.departure.airport} (${flight.departure.date})\n`;
            response += `🛬 **Arrival:** ${flight.arrival.time} at ${flight.arrival.airport} (${flight.arrival.date})\n`;
            response += `⏱️ **Duration:** ${flight.duration}\n`;
            response += `💰 **Price:** ${flight.price}\n`;
            response += `---\n\n`;
        });
        
        response += "Reply with the flight number (e.g., 'AI101') to book that flight!";
        
        return response;
    }
    
    async run(context) {
        await super.run(context);
        
        // Save any state changes that might have occurred during the turn
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}

module.exports = { FlightBot };