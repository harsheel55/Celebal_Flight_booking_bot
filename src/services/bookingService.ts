import { Flight } from './flightService';

// Interface for booking details
export interface BookingDetails {
  id: string;
  userId: string;
  flight: Flight;
  passengers: Passenger[];
  totalPrice: number;
  bookingDate: Date;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  status: 'confirmed' | 'cancelled' | 'changed';
  confirmationCode: string;
}

// Interface for passenger details
export interface Passenger {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  specialRequests?: string;
}

// Interface for payment details
export interface PaymentDetails {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  timestamp: Date;
}

// Mock database for bookings (in a real app, this would be a database)
const bookingsDB: BookingDetails[] = [];

/**
 * Creates a new booking
 * @param flight The flight to book
 * @param passengers List of passengers
 * @param userId User ID
 * @returns The created booking details
 */
export const createBooking = (
  flight: Flight,
  passengers: Passenger[],
  userId: string = 'user-123' // Default user ID for demo
): BookingDetails => {
  // Calculate total price based on number of passengers
  const basePrice = flight.price || 500; // Default to 500 if price not available
  const totalPrice = basePrice * passengers.length;
  
  // Generate a random confirmation code
  const confirmationCode = generateConfirmationCode();
  
  const booking: BookingDetails = {
    id: `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    flight,
    passengers,
    totalPrice,
    bookingDate: new Date(),
    paymentStatus: 'pending',
    status: 'confirmed',
    confirmationCode
  };
  
  // Save to our mock database
  bookingsDB.push(booking);
  
  console.log('Created booking:', booking);
  return booking;
};

/**
 * Processes a payment for a booking
 * @param bookingId The booking ID
 * @param paymentMethod The payment method
 * @returns The payment details
 */
export const processPayment = (
  bookingId: string,
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'other' = 'credit_card'
): PaymentDetails => {
  // Find the booking
  const booking = bookingsDB.find(b => b.id === bookingId);
  
  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }
  
  // Create payment details
  const payment: PaymentDetails = {
    id: `payment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId,
    amount: booking.totalPrice,
    currency: 'USD',
    method: paymentMethod,
    status: 'completed', // Assume payment is successful for demo
    transactionId: `txn-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: new Date()
  };
  
  // Update booking payment status
  booking.paymentStatus = 'completed';
  
  console.log('Processed payment:', payment);
  return payment;
};

/**
 * Gets all bookings for a user
 * @param userId The user ID
 * @returns List of bookings
 */
export const getUserBookings = (userId: string = 'user-123'): BookingDetails[] => {
  return bookingsDB.filter(booking => booking.userId === userId);
};

/**
 * Gets a booking by ID
 * @param bookingId The booking ID
 * @returns The booking details or undefined if not found
 */
export const getBookingById = (bookingId: string): BookingDetails | undefined => {
  return bookingsDB.find(booking => booking.id === bookingId);
};

/**
 * Gets a booking by confirmation code
 * @param confirmationCode The confirmation code
 * @returns The booking details or undefined if not found
 */
export const getBookingByConfirmationCode = (confirmationCode: string): BookingDetails | undefined => {
  return bookingsDB.find(booking => booking.confirmationCode === confirmationCode);
};

/**
 * Cancels a booking
 * @param bookingId The booking ID
 * @returns The updated booking details
 */
export const cancelBooking = (bookingId: string): BookingDetails => {
  const booking = bookingsDB.find(b => b.id === bookingId);
  
  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }
  
  booking.status = 'cancelled';
  
  // In a real app, you would also handle refund processing here
  booking.paymentStatus = 'refunded';
  
  console.log('Cancelled booking:', booking);
  return booking;
};

/**
 * Generates a random confirmation code
 * @returns A random confirmation code
 */
const generateConfirmationCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate a 6-character code
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  
  return code;
};

/**
 * Searches for bookings by destination
 * @param destination The destination to search for
 * @param userId The user ID
 * @returns List of bookings matching the destination
 */
export const searchBookingsByDestination = (
  destination: string,
  userId: string = 'user-123'
): BookingDetails[] => {
  const userBookings = getUserBookings(userId);
  
  return userBookings.filter(booking => {
    const arrivalAirport = booking.flight.arrival?.airport || '';
    const arrivalCity = booking.flight.arrival?.iata || '';
    
    return (
      arrivalAirport.toLowerCase().includes(destination.toLowerCase()) ||
      arrivalCity.toLowerCase().includes(destination.toLowerCase())
    );
  });
};

/**
 * Formats a booking for display in the chat
 * @param booking The booking to format
 * @returns A formatted string representation of the booking
 */
export const formatBookingForDisplay = (booking: BookingDetails): string => {
  const flight = booking.flight;
  const departureDate = new Date(flight.departure?.scheduled || '').toLocaleDateString();
  const departureTime = new Date(flight.departure?.scheduled || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const arrivalTime = new Date(flight.arrival?.scheduled || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return `
✈️ Booking: ${booking.confirmationCode}
📅 Date: ${departureDate}
🛫 Departure: ${flight.departure?.airport} (${flight.departure?.iata}) at ${departureTime}
🛬 Arrival: ${flight.arrival?.airport} (${flight.arrival?.iata}) at ${arrivalTime}
🧑‍✈️ Airline: ${flight.airline?.name} ${flight.flight?.number}
👥 Passengers: ${booking.passengers.length}
💰 Total: $${booking.totalPrice}
📊 Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
  `.trim();
};

/**
 * Creates a mock booking for demo purposes
 * @param flight The flight to book
 * @returns The created booking details
 */
export const createMockBooking = (flight: Flight): BookingDetails => {
  const passengers: Passenger[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      passportNumber: 'AB1234567',
      dateOfBirth: '1990-01-01'
    }
  ];
  
  return createBooking(flight, passengers);
};
