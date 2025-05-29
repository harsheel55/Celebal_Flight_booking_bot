import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Plane, CreditCard, CheckCircle, Calendar, Users, Filter, Globe, X, RefreshCw, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import FlightCard from './FlightCard';
import { searchFlights, Flight, FlightSearchOptions, filterFlights, sortFlights, compareFlightPrices, PriceComparisonResult } from '@/services/flightService';
import { useToast } from '@/hooks/use-toast';
import { extractFlightDetails, FlightSearchDetails, isFlightSearchRequest, generateFlightSearchResponse } from '@/services/aiService';
import { extractFlightDetails as extractFlightDetailsNLP } from '@/services/nlpService';
import { BookingDetails, Passenger, createBooking, processPayment, getUserBookings, cancelBooking, formatBookingForDisplay, createMockBooking } from '@/services/bookingService';
import { detectLanguage, translateToEnglish, translateFromEnglish, SupportedLanguage, getPhrase, languageNames } from '@/services/translationService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  flights?: Flight[];
  priceComparison?: PriceComparisonResult[];
  selectedFlight?: { flight: Flight; price: number };
  bookings?: BookingDetails[];
  booking?: BookingDetails;
  showFilters?: boolean;
  filterOptions?: FilterOptions;
  language?: SupportedLanguage;
  timestamp: Date;
}

interface FilterOptions {
  directOnly: boolean;
  airline: string;
  maxPrice: number;
  class: 'economy' | 'business' | 'first' | '';
  sortBy: 'price' | 'duration' | 'departure' | 'arrival';
}

interface ConversationState {
  currentSearch?: FlightSearchDetails;
  selectedFlight?: { flight: Flight; price: number };
  currentBooking?: BookingDetails;
  language: SupportedLanguage;
  searchHistory: FlightSearchDetails[];
  bookingHistory: BookingDetails[];
  filterOptions: FilterOptions;
}

const FlightBot = () => {
  // Get user from auth context
  const { user } = useAuth();
  
  // Initialize conversation state with defaults
  const [conversationState, setConversationState] = useState<ConversationState>({
    language: user?.preferredLanguage as SupportedLanguage || 'en',
    searchHistory: [],
    bookingHistory: [],
    filterOptions: {
      directOnly: false,
      airline: '',
      maxPrice: 2000,
      class: '',
      sortBy: 'price'
    }
  });

  // Chat messages state
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Set initial welcome message based on user authentication status
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: user 
        ? `Hello ${user.name}! Welcome back to FlightBot. I can help you search for flights, compare prices, and book tickets directly through our chat. Just tell me where you want to go and when!\n\nTry saying: 'Find flights from New York to London' or 'Book a flight from LAX to JFK'` 
        : "Hello! I'm your flight booking assistant. I can help you search for flights, compare prices, and book tickets directly through our chat. Just tell me where you want to go and when!\n\nTry saying: 'Find flights from New York to London' or 'Book a flight from LAX to JFK'",
      isBot: true,
      language: user?.preferredLanguage as SupportedLanguage || 'en',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, [user]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Track detected language for multilingual support
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>('en');
  
  // Track if we're loading live flights
  const [loadingLiveFlights, setLoadingLiveFlights] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Using the improved AI service for flight detail extraction

  const handleFlightSelection = (flight: Flight, price: number) => {
    const bookingMessage: Message = {
      id: Date.now().toString(),
      text: `Great choice! You selected ${flight.airline?.name} flight ${flight.flight?.iata} for $${price}.\n\nFlight Details:\n• From: ${flight.departure?.airport} (${flight.departure?.iata})\n• To: ${flight.arrival?.airport} (${flight.arrival?.iata})\n• Price: $${price}\n\nWould you like to proceed with booking? Just type 'book this flight' or 'confirm booking' to continue.`,
      isBot: true,
      selectedFlight: { flight, price },
      timestamp: new Date()
    };

    setMessages(prev => [...prev, bookingMessage]);
    
    toast({
      title: "Flight Selected!",
      description: `${flight.airline?.name} flight ${flight.flight?.iata} - $${price}`,
    });
  };

  // Handle showing user's bookings
  const handleShowBookings = async () => {
    // Get user's bookings (in a real app, this would fetch from a database)
    const bookings = getUserBookings();
    
    // Create mock bookings if none exist
    if (bookings.length === 0) {
      // Create some mock bookings for demonstration
      if (conversationState.currentSearch?.from && conversationState.currentSearch?.to) {
        // If we have a current search, create a mock booking based on that
        const mockFlight: Flight = {
          flight_date: new Date().toISOString().split('T')[0],
          flight_status: 'scheduled',
          departure: {
            airport: `${conversationState.currentSearch.from} Airport`,
            timezone: 'UTC',
            iata: conversationState.currentSearch.from.substring(0, 3).toUpperCase(),
            icao: 'K' + conversationState.currentSearch.from.substring(0, 3).toUpperCase(),
            scheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          },
          arrival: {
            airport: `${conversationState.currentSearch.to} Airport`,
            timezone: 'UTC',
            iata: conversationState.currentSearch.to.substring(0, 3).toUpperCase(),
            icao: 'K' + conversationState.currentSearch.to.substring(0, 3).toUpperCase(),
            scheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString() // 7 days + 3 hours
          },
          airline: {
            name: 'Demo Airlines',
            iata: 'DA',
            icao: 'DAL'
          },
          flight: {
            number: '123',
            iata: 'DA123',
            icao: 'DAL123'
          },
          price: 450
        };
        
        const mockBooking = createMockBooking(mockFlight);
        bookings.push(mockBooking);
        
        // Add another mock booking with different dates
        const mockFlight2: Flight = {
          ...mockFlight,
          flight_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          departure: {
            ...mockFlight.departure,
            scheduled: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          arrival: {
            ...mockFlight.arrival,
            scheduled: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString()
          },
          flight: {
            number: '456',
            iata: 'DA456',
            icao: 'DAL456'
          },
          price: 520
        };
        
        const mockBooking2 = createMockBooking(mockFlight2);
        bookings.push(mockBooking2);
      } else {
        // Create a generic mock booking
        const mockFlight: Flight = {
          flight_date: new Date().toISOString().split('T')[0],
          flight_status: 'scheduled',
          departure: {
            airport: 'New York JFK Airport',
            timezone: 'America/New_York',
            iata: 'JFK',
            icao: 'KJFK',
            scheduled: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          arrival: {
            airport: 'London Heathrow Airport',
            timezone: 'Europe/London',
            iata: 'LHR',
            icao: 'EGLL',
            scheduled: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString()
          },
          airline: {
            name: 'British Airways',
            iata: 'BA',
            icao: 'BAW'
          },
          flight: {
            number: '178',
            iata: 'BA178',
            icao: 'BAW178'
          },
          price: 850
        };
        
        const mockBooking = createMockBooking(mockFlight);
        bookings.push(mockBooking);
      }
    }
    
    // Update conversation state with bookings
    setConversationState(prev => ({
      ...prev,
      bookingHistory: bookings
    }));
    
    // Format bookings for display
    let responseText = '';
    
    if (bookings.length === 0) {
      responseText = "You don't have any bookings yet. Would you like to search for flights?";
    } else {
      responseText = `You have ${bookings.length} booking${bookings.length > 1 ? 's' : ''}:\n\n`;
      bookings.forEach((booking, index) => {
        responseText += formatBookingForDisplay(booking);
        if (index < bookings.length - 1) {
          responseText += '\n\n---\n\n';
        }
      });
      responseText += '\n\nYou can say "Cancel my booking" followed by the confirmation code to cancel a booking.';
    }
    
    // Translate response if needed
    if (detectedLanguage !== 'en') {
      responseText = translateFromEnglish(responseText, detectedLanguage);
    }
    
    const bookingsMessage: Message = {
      id: Date.now().toString(),
      text: responseText,
      isBot: true,
      bookings: bookings,
      language: detectedLanguage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, bookingsMessage]);
    setIsLoading(false);
  };
  
  // Handle canceling a booking
  const handleCancelBooking = async (message: string) => {
    // Extract confirmation code from message
    const codeMatch = message.match(/[A-Z0-9]{6}/);
    let confirmationCode = codeMatch ? codeMatch[0] : '';
    
    // If no confirmation code found, check if we have bookings to cancel
    if (!confirmationCode) {
      const bookings = getUserBookings();
      
      if (bookings.length === 1) {
        // If only one booking, use that one
        confirmationCode = bookings[0].confirmationCode;
      } else if (bookings.length > 1) {
        // If multiple bookings, ask user to specify which one
        let responseText = "You have multiple bookings. Please specify which one you'd like to cancel by including the confirmation code. Your bookings are:\n\n";
        
        bookings.forEach((booking, index) => {
          responseText += `${index + 1}. ${booking.confirmationCode} - ${booking.flight.departure?.iata} to ${booking.flight.arrival?.iata} on ${new Date(booking.flight.departure?.scheduled || '').toLocaleDateString()}\n`;
        });
        
        // Translate response if needed
        if (detectedLanguage !== 'en') {
          responseText = translateFromEnglish(responseText, detectedLanguage);
        }
        
        const bookingsMessage: Message = {
          id: Date.now().toString(),
          text: responseText,
          isBot: true,
          bookings: bookings,
          language: detectedLanguage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, bookingsMessage]);
        setIsLoading(false);
        return;
      } else {
        // No bookings found
        let responseText = "You don't have any bookings to cancel. Would you like to search for flights?";
        
        // Translate response if needed
        if (detectedLanguage !== 'en') {
          responseText = translateFromEnglish(responseText, detectedLanguage);
        }
        
        const noBookingsMessage: Message = {
          id: Date.now().toString(),
          text: responseText,
          isBot: true,
          language: detectedLanguage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, noBookingsMessage]);
        setIsLoading(false);
        return;
      }
    }
    
    // Get all bookings
    const bookings = getUserBookings();
    
    // Find the booking to cancel
    const bookingToCancel = bookings.find(b => b.confirmationCode === confirmationCode);
    
    if (bookingToCancel) {
      // Cancel the booking
      const cancelledBooking = cancelBooking(bookingToCancel.id);
      
      // Update conversation state
      setConversationState(prev => ({
        ...prev,
        bookingHistory: prev.bookingHistory.map(b => 
          b.id === cancelledBooking.id ? cancelledBooking : b
        )
      }));
      
      // Prepare response message
      let responseText = `✅ Your booking with confirmation code ${confirmationCode} has been cancelled.\n\nDetails:\n✈️ Flight: ${bookingToCancel.flight.airline?.name} ${bookingToCancel.flight.flight?.iata}\n📍 Route: ${bookingToCancel.flight.departure?.iata} → ${bookingToCancel.flight.arrival?.iata}\n📅 Date: ${new Date(bookingToCancel.flight.departure?.scheduled || '').toLocaleDateString()}\n\nA refund of $${bookingToCancel.totalPrice} will be processed within 5-7 business days.`;
      
      // Translate response if needed
      if (detectedLanguage !== 'en') {
        responseText = translateFromEnglish(responseText, detectedLanguage);
      }
      
      const cancellationMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        isBot: true,
        booking: cancelledBooking,
        language: detectedLanguage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, cancellationMessage]);
      
      toast({
        title: "Booking Cancelled",
        description: `Your booking ${confirmationCode} has been cancelled.`,
      });
    } else {
      // Booking not found
      let responseText = `I couldn't find a booking with confirmation code ${confirmationCode}. Please check the code and try again.`;
      
      // Translate response if needed
      if (detectedLanguage !== 'en') {
        responseText = translateFromEnglish(responseText, detectedLanguage);
      }
      
      const notFoundMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        isBot: true,
        language: detectedLanguage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, notFoundMessage]);
    }
    
    setIsLoading(false);
  };
  
  // Handle filtering flight results
  const handleFilterRequest = async (message: string, flights: Flight[]) => {
    // Extract filter options from message
    const directOnlyMatch = /\b(direct|nonstop|non-stop|no stops|no layovers)\b/i.test(message);
    
    // Extract airline preference
    const airlineMatch = message.match(/\b(?:on|with|via|using|by|through|airline[:]?)\s+([a-zA-Z\s]{2,}?)(?:\s+airlines?)?\b/i);
    const airline = airlineMatch ? airlineMatch[1].trim() : '';
    
    // Extract price limit
    const priceMatch = message.match(/\bunder\s+\$?(\d+[,\d]*)|\bless\s+than\s+\$?(\d+[,\d]*)|\bmaximum\s+(?:price|cost)[:]?\s+\$?(\d+[,\d]*)|\bmax\s+(?:price|cost)[:]?\s+\$?(\d+[,\d]*)|\bprice[:]?\s+\$?(\d+[,\d]*)|\$(\d+[,\d]*)/i);
    const priceStr = priceMatch ? (priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4] || priceMatch[5] || priceMatch[6]) : '';
    const maxPrice = priceStr ? parseFloat(priceStr.replace(/,/g, '')) : 0;
    
    // Extract class preference
    const classMatch = message.match(/\b(economy|business|first)(?:\s+class)?\b/i);
    const travelClass = classMatch ? classMatch[1].toLowerCase() as 'economy' | 'business' | 'first' : '';
    
    // Extract sort preference
    const sortByPrice = /\b(?:sort|order)\s+by\s+price|\bcheapest|\blowest\s+price\b/i.test(message);
    const sortByDuration = /\b(?:sort|order)\s+by\s+(?:duration|length|time)|\bshortest|\bquickest\b/i.test(message);
    const sortByDeparture = /\b(?:sort|order)\s+by\s+(?:departure|leaving)\s+time|\bearliest\s+departure\b/i.test(message);
    const sortByArrival = /\b(?:sort|order)\s+by\s+(?:arrival|landing)\s+time|\bearliest\s+arrival\b/i.test(message);
    
    let sortBy: 'price' | 'duration' | 'departure' | 'arrival' = 'price'; // Default
    if (sortByDuration) sortBy = 'duration';
    if (sortByDeparture) sortBy = 'departure';
    if (sortByArrival) sortBy = 'arrival';
    if (sortByPrice) sortBy = 'price';
    
    // Update filter options in conversation state
    const newFilterOptions: FilterOptions = {
      directOnly: directOnlyMatch || conversationState.filterOptions.directOnly,
      airline: airline || conversationState.filterOptions.airline,
      maxPrice: maxPrice || conversationState.filterOptions.maxPrice,
      class: travelClass || conversationState.filterOptions.class as 'economy' | 'business' | 'first' | '',
      sortBy: sortBy
    };
    
    setConversationState(prev => ({
      ...prev,
      filterOptions: newFilterOptions
    }));
    
    // Apply filters
    let filteredFlights = filterFlights(flights, {
      directOnly: newFilterOptions.directOnly,
      airline: newFilterOptions.airline,
      maxPrice: newFilterOptions.maxPrice,
      class: newFilterOptions.class as 'economy' | 'business' | 'first' | undefined,
    });
    
    // Sort flights
    filteredFlights = sortFlights(filteredFlights, newFilterOptions.sortBy);
    
    // Generate response text
    let filterDescription = [];
    if (newFilterOptions.directOnly) filterDescription.push('direct flights only');
    if (newFilterOptions.airline) filterDescription.push(`${newFilterOptions.airline} flights`);
    if (newFilterOptions.maxPrice) filterDescription.push(`maximum price $${newFilterOptions.maxPrice}`);
    if (newFilterOptions.class) filterDescription.push(`${newFilterOptions.class} class`);
    
    let sortDescription = '';
    switch (newFilterOptions.sortBy) {
      case 'price': sortDescription = 'lowest price'; break;
      case 'duration': sortDescription = 'shortest duration'; break;
      case 'departure': sortDescription = 'earliest departure'; break;
      case 'arrival': sortDescription = 'earliest arrival'; break;
    }
    
    let responseText = '';
    
    if (filterDescription.length > 0 || sortDescription) {
      responseText = `Showing ${filteredFlights.length} flights with `;
      if (filterDescription.length > 0) {
        responseText += filterDescription.join(', ');
      }
      if (sortDescription) {
        responseText += `${filterDescription.length > 0 ? ', sorted by ' : 'sorted by '}${sortDescription}`;
      }
      responseText += '.';
    } else {
      responseText = `Showing all ${filteredFlights.length} flights.`;
    }
    
    // Add price comparison if available
    const priceComparison = compareFlightPrices(filteredFlights);
    if (priceComparison.length > 0) {
      responseText += '\n\nPrice comparison by airline:';
      priceComparison.forEach(airline => {
        responseText += `\n• ${airline.airline}: $${airline.minPrice} - $${airline.maxPrice} (avg: $${Math.round(airline.avgPrice)})`;
      });
    }
    
    // Translate response if needed
    if (detectedLanguage !== 'en') {
      responseText = translateFromEnglish(responseText, detectedLanguage);
    }
    
    // Send response with filtered flights
    const filteredResultsMessage: Message = {
      id: Date.now().toString(),
      text: responseText,
      isBot: true,
      flights: filteredFlights.slice(0, 5), // Show top 5 flights
      priceComparison,
      showFilters: true,
      filterOptions: newFilterOptions,
      language: detectedLanguage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, filteredResultsMessage]);
    setIsLoading(false);
  };

  // Handle showing live flights
  const handleShowLiveFlights = async () => {
    setLoadingLiveFlights(true);
    
    // Add a message to indicate we're fetching live flights
    let loadingText = "Fetching real-time flight data...";
    
    // Translate if needed
    if (detectedLanguage !== 'en') {
      loadingText = translateFromEnglish(loadingText, detectedLanguage);
    }
    
    const loadingMessage: Message = {
      id: Date.now().toString(),
      text: loadingText,
      isBot: true,
      language: detectedLanguage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      // Fetch live flights from AviationStack API
      const liveFlights = await getLiveFlights();
      
      // Prepare response message
      let responseText = `I found ${liveFlights.length} flights currently in the air.\n\nHere are some of the active flights:`;
      
      // Add flight details to the message
      liveFlights.slice(0, 5).forEach((flight, index) => {
        responseText += `\n\n${index + 1}. ${flight.airline?.name} flight ${flight.flight?.iata} from ${flight.departure?.airport} (${flight.departure?.iata}) to ${flight.arrival?.airport} (${flight.arrival?.iata})`;
        
        if (flight.live) {
          responseText += `\n   Current position: ${flight.live.latitude.toFixed(2)}°, ${flight.live.longitude.toFixed(2)}°`;
          responseText += `\n   Altitude: ${Math.round(flight.live.altitude)} feet`;
          responseText += `\n   Speed: ${Math.round(flight.live.speed_horizontal)} knots`;
        }
      });
      
      // Translate if needed
      if (detectedLanguage !== 'en') {
        responseText = translateFromEnglish(responseText, detectedLanguage);
      }
      
      const liveFlightsMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        isBot: true,
        flights: liveFlights.slice(0, 5),
        language: detectedLanguage,
        timestamp: new Date()
      };
      
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingMessage.id), // Remove loading message
        liveFlightsMessage
      ]);
      
      toast({
        title: "Live Flights Loaded",
        description: `Found ${liveFlights.length} flights currently in the air`,
      });
    } catch (error) {
      console.error('Error fetching live flights:', error);
      
      // Prepare error message
      let errorText = "I'm sorry, I couldn't fetch real-time flight data. Please try again later.";
      
      // Translate if needed
      if (detectedLanguage !== 'en') {
        errorText = translateFromEnglish(errorText, detectedLanguage);
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: errorText,
        isBot: true,
        language: detectedLanguage,
        timestamp: new Date()
      };
      
      setMessages(prev => [
        ...prev.filter(m => m.id !== loadingMessage.id), // Remove loading message
        errorMessage
      ]);
      
      toast({
        title: "Error",
        description: "Failed to fetch live flight data",
        variant: "destructive"
      });
    } finally {
      setLoadingLiveFlights(false);
    }
  };

  const handleBookingConfirmation = (selectedFlight: { flight: Flight; price: number }) => {
    // Create a booking for the selected flight
    const passenger: Passenger = {
      firstName: 'John', // In a real app, this would come from user input
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    };
    
    const booking = createBooking(selectedFlight.flight, [passenger]);
    
    // Process payment (in a real app, this would integrate with a payment gateway)
    processPayment(booking.id, 'credit_card');
    
    // Update conversation state
    setConversationState(prev => ({
      ...prev,
      currentBooking: booking,
      bookingHistory: [...prev.bookingHistory, booking]
    }));
    
    // Prepare confirmation message
    let responseText = `🎉 Booking Confirmed!\n\nYour flight has been successfully booked:\n\n✈️ Flight: ${selectedFlight.flight.airline?.name} ${selectedFlight.flight.flight?.iata}\n📍 Route: ${selectedFlight.flight.departure?.iata} → ${selectedFlight.flight.arrival?.iata}\n💰 Total: $${selectedFlight.price}\n📧 Confirmation sent to your email\n\nBooking Reference: ${booking.confirmationCode}\n\nThank you for choosing our service! Have a great trip! ✈️`;
    
    // Translate response if needed
    if (detectedLanguage !== 'en') {
      responseText = translateFromEnglish(responseText, detectedLanguage);
    }

    const confirmationMessage: Message = {
      id: Date.now().toString(),
      text: responseText,
      isBot: true,
      booking: booking,
      language: detectedLanguage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmationMessage]);
    
    toast({
      title: "Booking Confirmed! ✈️",
      description: "Your flight has been successfully booked!",
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Detect language of the input
    const inputLanguage = detectLanguage(inputValue);
    setDetectedLanguage(inputLanguage);
    
    // Update conversation state with the detected language
    setConversationState(prev => ({
      ...prev,
      language: inputLanguage
    }));

    // Create user message with detected language
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      language: inputLanguage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Translate input to English if needed for processing
    const translatedInput = inputLanguage !== 'en' ? 
      translateToEnglish(currentInput, inputLanguage) : currentInput;

    try {
      // Check for live flight tracking requests
      if (/live\s+flights|real[\s-]time\s+flights|flights?\s+in\s+(?:the\s+)?air|track\s+flights|current\s+flights/i.test(translatedInput)) {
        await handleShowLiveFlights();
        return;
      }
      
      // Check for booking management commands
      if (/show\s+(?:my\s+)?bookings|my\s+(?:trips|flights|itineraries)/i.test(translatedInput)) {
        await handleShowBookings();
        return;
      }
      
      // Check for booking cancellation
      if (/cancel\s+(?:my\s+)?(?:booking|flight|trip|reservation)/i.test(translatedInput)) {
        await handleCancelBooking(translatedInput);
        return;
      }

      // Check if user wants to book a selected flight
      const lastBotMessage = messages.filter(m => m.isBot).pop();
      if (lastBotMessage?.selectedFlight && 
          (translatedInput.toLowerCase().includes('book') || 
           translatedInput.toLowerCase().includes('confirm') ||
           translatedInput.toLowerCase().includes('yes'))) {
        
        setTimeout(() => {
          handleBookingConfirmation(lastBotMessage.selectedFlight!);
          setIsLoading(false);
        }, 1500);
        return;
      }

      // Check if user wants to filter results
      if (lastBotMessage?.flights && 
          (/filter|only|show|sort/i.test(translatedInput) || 
           /direct|nonstop|airline|under|cheaper|class/i.test(translatedInput))) {
        await handleFilterRequest(translatedInput, lastBotMessage.flights);
        return;
      }

      // Check if the message is a flight search request
      if (isFlightSearchRequest(translatedInput)) {
        // Extract flight details using both services for better accuracy
        const aiFlightDetails = extractFlightDetails(translatedInput);
        const nlpFlightDetails = extractFlightDetailsNLP(translatedInput);
        
        // Merge results, preferring NLP results when available
        const flightDetails: FlightSearchDetails = {
          from: nlpFlightDetails.from || aiFlightDetails.from || '',
          to: nlpFlightDetails.to || aiFlightDetails.to || '',
          date: nlpFlightDetails.date || aiFlightDetails.date,
          returnDate: nlpFlightDetails.returnDate || aiFlightDetails.returnDate,
          travelers: nlpFlightDetails.travelers || aiFlightDetails.travelers || 1,
          class: nlpFlightDetails.class || aiFlightDetails.class,
          directOnly: nlpFlightDetails.directOnly || aiFlightDetails.directOnly,
          airline: nlpFlightDetails.airline || aiFlightDetails.airline,
          maxPrice: nlpFlightDetails.maxPrice || aiFlightDetails.maxPrice
        };
        
        // Update conversation state with current search
        setConversationState(prev => ({
          ...prev,
          currentSearch: flightDetails,
          searchHistory: [...prev.searchHistory, flightDetails]
        }));
        
        // If we have both origin and destination, search for flights
        if (flightDetails.from && flightDetails.to) {
          // Add a response message in the user's language
          let responseText = generateFlightSearchResponse(flightDetails);
          
          // Translate response if needed
          if (inputLanguage !== 'en') {
            responseText = translateFromEnglish(responseText, inputLanguage);
          }
          
          const botResponseMessage: Message = {
            id: Date.now().toString(),
            text: responseText,
            isBot: true,
            language: inputLanguage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botResponseMessage]);
          
          // Search for flights
          const searchOptions: FlightSearchOptions = {
            departure: flightDetails.from,
            arrival: flightDetails.to,
            date: flightDetails.date,
            returnDate: flightDetails.returnDate,
            travelers: flightDetails.travelers,
            class: flightDetails.class,
            directOnly: flightDetails.directOnly,
            airline: flightDetails.airline,
            maxPrice: flightDetails.maxPrice
          };
          
          const flights = await searchFlights(searchOptions);
          
          // Compare prices across airlines
          const priceComparison = compareFlightPrices(flights);
          
          // Prepare results message text
          let resultsText = `I found ${flights.length} flights from ${flightDetails.from} to ${flightDetails.to}${flightDetails.date ? ` on ${flightDetails.date}` : ''}.`;
          
          // Add price comparison info
          if (priceComparison.length > 0) {
            resultsText += '\n\nPrice comparison by airline:';
            priceComparison.forEach(airline => {
              resultsText += `\n• ${airline.airline}: $${airline.minPrice} - $${airline.maxPrice} (avg: $${Math.round(airline.avgPrice)})`;
            });
          }
          
          resultsText += '\n\nHere are the best options:';
          
          // Translate results if needed
          if (inputLanguage !== 'en') {
            resultsText = translateFromEnglish(resultsText, inputLanguage);
          }
          
          // Add flight results message with filter options
          const flightResultsMessage: Message = {
            id: Date.now().toString(),
            text: resultsText,
            isBot: true,
            flights: sortFlights(flights, 'price').slice(0, 5), // Show top 5 flights sorted by price
            priceComparison,
            showFilters: true,
            filterOptions: conversationState.filterOptions,
            language: inputLanguage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, flightResultsMessage]);
        } else {
          // We need more information
          const missingInfo = [];
          if (!flightDetails.from) missingInfo.push('departure city');
          if (!flightDetails.to) missingInfo.push('destination city');
          
          let responseText = `I need a bit more information to search for flights. Could you please provide the ${missingInfo.join(' and ')}?`;
          
          // Translate response if needed
          if (inputLanguage !== 'en') {
            responseText = translateFromEnglish(responseText, inputLanguage);
          }
          
          const botResponseMessage: Message = {
            id: Date.now().toString(),
            text: responseText,
            isBot: true,
            language: inputLanguage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botResponseMessage]);
        }
      } else {
        // Not a flight search request, provide a general response
        let responseText = "I'm your flight booking assistant. You can ask me to find flights between cities, compare prices, or book tickets. For example, try saying 'Find flights from New York to London' or 'Book a flight from LAX to JFK'.";
        
        // Translate response if needed
        if (inputLanguage !== 'en') {
          responseText = translateFromEnglish(responseText, inputLanguage);
        }
        
        const botResponseMessage: Message = {
          id: Date.now().toString(),
          text: responseText,
          isBot: true,
          language: inputLanguage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponseMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      let errorText = "I'm sorry, I encountered an error while processing your request. Please try again.";
      
      // Translate error message if needed
      if (inputLanguage !== 'en') {
        errorText = translateFromEnglish(errorText, inputLanguage);
      }
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: errorText,
        isBot: true,
        language: inputLanguage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Get logout function from auth context
  const { logout } = useAuth();
  
  // Handle logout
  const handleLogout = () => {
    logout();
    // Redirect will happen automatically due to ProtectedRoute in App.tsx
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <Card className="h-[650px] flex flex-col shadow-xl border-0 bg-gradient-to-b from-white to-gray-50 rounded-xl overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjE1Ij48cGF0aCBkPSJNMzAgMGMxNi41NjkgMCAzMCAxMy40MzEgMzAgMzAgMCAxNi41NjktMTMuNDMxIDMwLTMwIDMwQzEzLjQzMSA2MCAwIDQ2LjU2OSAwIDMwIDAgMTMuNDMxIDEzLjQzMSAwIDMwIDB6bTAgNGMxNC4zNiAwIDI2IDExLjY0IDI2IDI2UzQ0LjM2IDU2IDMwIDU2IDQgNDQuMzYgNCAzMCAxNS42NCA0IDMwIDR6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-full">
              <Plane className="h-6 w-6" />
            </div>
            <h2 className="font-bold text-xl tracking-tight">Flight Navigator</h2>
            <div className="ml-auto flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 rounded-full p-1 px-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs opacity-80">{languageNames[user.preferredLanguage as SupportedLanguage || 'en']}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-3 text-white hover:bg-white/20 rounded-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-1" /> Logout
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-1 bg-white/10 rounded-full py-1 px-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] ${message.isBot ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start gap-3 ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    message.isBot 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                  }`}>
                    {message.isBot ? 
                      (message.selectedFlight ? <CreditCard className="h-5 w-5" /> : 
                       message.text.includes('Confirmed') ? <CheckCircle className="h-5 w-5" /> :
                       <Bot className="h-5 w-5" />) : 
                      <User className="h-5 w-5" />}
                  </div>
                  <div className={`rounded-2xl px-5 py-3 max-w-full shadow-sm ${
                    message.isBot 
                      ? 'bg-white border border-gray-100 text-gray-800' 
                      : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white'
                  }`}>
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.text}</p>
                    <div className="text-xs opacity-70 mt-1.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                {/* Flight Results */}
                {message.flights && message.flights.length > 0 && (
                  <div className="mt-5 grid gap-4">
                    {message.flights.map((flight, index) => (
                      <FlightCard 
                        key={`${message.id}-flight-${index}`} 
                        flight={flight} 
                        onSelectFlight={handleFlightSelection}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white p-5 rounded-b-xl">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (e.g., 'Find flights from LAX to JFK')"
              className="flex-1 border-gray-200 bg-gray-50 focus:border-blue-400 focus:ring-blue-400 h-12 text-[15px] rounded-xl shadow-sm"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 hover:from-indigo-700 hover:via-blue-700 hover:to-sky-600 transition-all duration-200 h-12 w-12 rounded-xl shadow-sm"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-flex items-center gap-1">
              <Plane className="h-3 w-3" /> Try: "Find flights from New York to London"
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1 inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Try: "Book a flight from Surat to Dubai"
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlightBot;
