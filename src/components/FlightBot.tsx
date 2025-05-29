
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Plane, CreditCard, CheckCircle } from 'lucide-react';
import FlightCard from './FlightCard';
import { searchFlights, Flight } from '@/services/flightService';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  flights?: Flight[];
  selectedFlight?: { flight: Flight; price: number };
  timestamp: Date;
}

const FlightBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your flight booking assistant. I can help you search for flights, compare prices, and book tickets directly through our chat. Just tell me where you want to go and when!\n\nTry saying: 'Find flights from New York to London' or 'Book a flight from LAX to JFK'",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractFlightDetails = (message: string) => {
    console.log('Original message:', message);
    
    let from = '';
    let to = '';
    let date = '';

    // Enhanced patterns for better extraction
    const fromPatterns = [
      /(?:from|leaving|departing)\s+([a-zA-Z\s]{2,}?)(?:\s+to\s|\s+going\s|\s+arriving\s|\s+$)/i,
      /\b([A-Z]{3})\s+to\s+/i
    ];

    const toPatterns = [
      /(?:to|going|arriving|destination)\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$|\s+tomorrow|\s+today)/i,
      /\s+to\s+([A-Z]{3})\b/i
    ];

    // Extract from location
    for (const pattern of fromPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        from = match[1].trim();
        break;
      }
    }

    // Extract to location  
    for (const pattern of toPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        to = match[1].trim();
        break;
      }
    }

    // Clean up extracted locations
    from = from.replace(/\b(flights?|flight|plane|airplane)\b/gi, '').trim();
    to = to.replace(/\b(flights?|flight|plane|airplane)\b/gi, '').trim();

    // Extract date
    const dateMatch = message.match(/(?:on|for)\s+([0-9-\/]+)/i) || message.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
    
    const result = { from, to, date };
    console.log('Extracted flight details:', result);
    return result;
  };

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

  const handleBookingConfirmation = (selectedFlight: { flight: Flight; price: number }) => {
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      text: `🎉 Booking Confirmed!\n\nYour flight has been successfully booked:\n\n✈️ Flight: ${selectedFlight.flight.airline?.name} ${selectedFlight.flight.flight?.iata}\n📍 Route: ${selectedFlight.flight.departure?.iata} → ${selectedFlight.flight.arrival?.iata}\n💰 Total: $${selectedFlight.price}\n📧 Confirmation sent to your email\n\nBooking Reference: FB${Math.random().toString(36).substring(2, 8).toUpperCase()}\n\nThank you for choosing our service! Have a great trip! ✈️`,
      isBot: true,
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

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Check if user wants to book a selected flight
    const lastBotMessage = messages.filter(m => m.isBot).pop();
    if (lastBotMessage?.selectedFlight && 
        (currentInput.toLowerCase().includes('book') || 
         currentInput.toLowerCase().includes('confirm') ||
         currentInput.toLowerCase().includes('yes'))) {
      
      setTimeout(() => {
        handleBookingConfirmation(lastBotMessage.selectedFlight!);
        setIsLoading(false);
      }, 1500);
      return;
    }

    // Extract flight details from message
    const flightDetails = extractFlightDetails(currentInput.toLowerCase());
    
    console.log('Processing flight search with details:', flightDetails);

    if (flightDetails.from && flightDetails.to) {
      try {
        console.log('Searching flights...');
        const flights = await searchFlights(flightDetails.from, flightDetails.to, flightDetails.date);
        
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I found ${flights.length} flights from ${flightDetails.from} to ${flightDetails.to}${flightDetails.date ? ` for ${flightDetails.date}` : ''}. Here are the available options:\n\nClick "Select Flight" on any option to proceed with booking!`,
          isBot: true,
          flights: flights,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botResponse]);
        
        if (flights.length === 0) {
          toast({
            title: "No flights found",
            description: "Try different airports or dates",
          });
        }
      } catch (error) {
        console.error('Flight search error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I couldn't find any flights for that route. Please try different airports or check your spelling. You can use airport codes like LAX, JFK, LHR for better results.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Search Error",
          description: "Unable to search flights. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.log('Missing flight details, showing help message');
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'd be happy to help you find and book flights! Please tell me:\n\n• Where are you flying from?\n• Where do you want to go?\n• What date? (optional)\n\nFor example:\n- 'Find flights from New York to London'\n- 'Book a flight from LAX to JFK'\n- 'Search flights from Surat to Dubai'",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 text-white p-4 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Plane className="h-6 w-6" />
            <h2 className="font-semibold text-lg">Flight Booking Assistant</h2>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] ${message.isBot ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-start gap-2 ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isBot ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {message.isBot ? 
                      (message.selectedFlight ? <CreditCard className="h-4 w-4 text-blue-600" /> : 
                       message.text.includes('Confirmed') ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                       <Bot className="h-4 w-4 text-blue-600" />) : 
                      <User className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 max-w-full ${
                    message.isBot 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-gradient-to-r from-blue-600 to-sky-500 text-white'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                
                {/* Flight Results */}
                {message.flights && message.flights.length > 0 && (
                  <div className="mt-4 grid gap-3">
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-gray-50 p-4 rounded-b-lg">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (e.g., 'Find flights from LAX to JFK' or 'Book this flight')"
              className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Try: "Find flights from New York to London" or "Book a flight from Surat to Dubai"
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FlightBot;
