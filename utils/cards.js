const { CardFactory, MessageFactory } = require('botbuilder');

/**
 * Creates an adaptive card for flight search results
 */
function createFlightSearchCard(flights) {
    const card = {
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                text: 'Flight Search Results',
                weight: 'Bolder',
                size: 'Medium'
            },
            {
                type: 'Container',
                items: flights.map(flight => ({
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: `${flight.airline} - ${flight.flightNumber}`,
                                    weight: 'Bolder'
                                },
                                {
                                    type: 'TextBlock',
                                    text: `${flight.departure} → ${flight.arrival}`,
                                    spacing: 'None'
                                },
                                {
                                    type: 'TextBlock',
                                    text: `${flight.departureTime} - ${flight.arrivalTime}`,
                                    spacing: 'None',
                                    isSubtle: true
                                }
                            ]
                        },
                        {
                            type: 'Column',
                            width: 'auto',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: `$${flight.price}`,
                                    weight: 'Bolder',
                                    color: 'Accent'
                                }
                            ]
                        }
                    ],
                    selectAction: {
                        type: 'Action.Submit',
                        data: {
                            action: 'selectFlight',
                            flightId: flight.id
                        }
                    }
                }))
            }
        ]
    };
    
    return CardFactory.adaptiveCard(card);
}

/**
 * Creates a booking confirmation card
 */
function createBookingConfirmationCard(booking) {
    const card = {
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                text: 'Booking Confirmation',
                weight: 'Bolder',
                size: 'Medium',
                color: 'Good'
            },
            {
                type: 'FactSet',
                facts: [
                    {
                        title: 'Booking ID:',
                        value: booking.id
                    },
                    {
                        title: 'Flight:',
                        value: `${booking.airline} ${booking.flightNumber}`
                    },
                    {
                        title: 'Route:',
                        value: `${booking.departure} → ${booking.arrival}`
                    },
                    {
                        title: 'Date:',
                        value: booking.date
                    },
                    {
                        title: 'Time:',
                        value: `${booking.departureTime} - ${booking.arrivalTime}`
                    },
                    {
                        title: 'Passenger:',
                        value: booking.passengerName
                    },
                    {
                        title: 'Total Price:',
                        value: `$${booking.totalPrice}`
                    }
                ]
            }
        ]
    };
    
    return CardFactory.adaptiveCard(card);
}

/**
 * Creates a payment form card
 */
function createPaymentCard(bookingDetails) {
    const card = {
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                text: 'Payment Information',
                weight: 'Bolder',
                size: 'Medium'
            },
            {
                type: 'TextBlock',
                text: `Total Amount: $${bookingDetails.totalPrice}`,
                weight: 'Bolder',
                color: 'Accent'
            },
            {
                type: 'Input.Text',
                id: 'cardNumber',
                label: 'Card Number',
                placeholder: '1234 5678 9012 3456',
                maxLength: 19
            },
            {
                type: 'Input.Text',
                id: 'expiryDate',
                label: 'Expiry Date',
                placeholder: 'MM/YY',
                maxLength: 5
            },
            {
                type: 'Input.Text',
                id: 'cvv',
                label: 'CVV',
                placeholder: '123',
                maxLength: 4
            },
            {
                type: 'Input.Text',
                id: 'cardholderName',
                label: 'Cardholder Name',
                placeholder: 'John Doe'
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Process Payment',
                data: {
                    action: 'processPayment',
                    bookingId: bookingDetails.id
                }
            }
        ]
    };
    
    return CardFactory.adaptiveCard(card);
}

/**
 * Creates a welcome card with quick actions
 */
function createWelcomeCard() {
    const card = {
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                text: '✈️ Flight Booking Assistant',
                weight: 'Bolder',
                size: 'Large',
                horizontalAlignment: 'Center'
            },
            {
                type: 'TextBlock',
                text: 'Welcome! I can help you search and book flights. What would you like to do?',
                wrap: true,
                horizontalAlignment: 'Center'
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: '🔍 Search Flights',
                data: { action: 'searchFlights' }
            },
            {
                type: 'Action.Submit',
                title: '📋 View My Bookings',
                data: { action: 'viewBookings' }
            },
            {
                type: 'Action.Submit',
                title: '❌ Cancel Booking',
                data: { action: 'cancelBooking' }
            }
        ]
    };
    
    return CardFactory.adaptiveCard(card);
}

/**
 * Creates a flight search form card
 */
function createFlightSearchFormCard() {
    const card = {
        type: 'AdaptiveCard',
        version: '1.3',
        body: [
            {
                type: 'TextBlock',
                text: 'Search Flights',
                weight: 'Bolder',
                size: 'Medium'
            },
            {
                type: 'Input.Text',
                id: 'departure',
                label: 'From',
                placeholder: 'Departure city'
            },
            {
                type: 'Input.Text',
                id: 'arrival',
                label: 'To',
                placeholder: 'Arrival city'
            },
            {
                type: 'Input.Date',
                id: 'departureDate',
                label: 'Departure Date'
            },
            {
                type: 'Input.Number',
                id: 'passengers',
                label: 'Number of Passengers',
                value: 1,
                min: 1,
                max: 9
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Search Flights',
                data: { action: 'performSearch' }
            }
        ]
    };
    
    return CardFactory.adaptiveCard(card);
}

module.exports = {
    createFlightSearchCard,
    createBookingConfirmationCard,
    createPaymentCard,
    createWelcomeCard,
    createFlightSearchFormCard
};