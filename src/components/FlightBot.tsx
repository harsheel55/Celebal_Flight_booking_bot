import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Plane } from 'lucide-react';
import FlightCard from './FlightCard';
import { searchFlights, Flight } from '@/services/flightService';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  flights?: Flight[];
  timestamp: Date;
}

const FlightBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your flight booking assistant. I can help you search for flights, compare prices, and find the best deals. Just tell me where you want to go and when!",
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
    
    // More flexible pattern matching for flight search
    let from = '';
    let to = '';
    let date = '';

    // Try multiple patterns for "from" location
    const fromPatterns = [
      /from\s+([a-zA-Z\s]{2,}?)(?:\s+to\s|\s+$)/i,
      /leaving\s+([a-zA-Z\s]{2,}?)(?:\s+to\s|\s+going\s|\s+$)/i,
      /departing\s+([a-zA-Z\s]{2,}?)(?:\s+to\s|\s+$)/i
    ];

    // Try multiple patterns for "to" location  
    const toPatterns = [
      /to\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$)/i,
      /going\s+to\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$)/i,
      /destination\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$)/i
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

    // If the above patterns didn't work, try a different approach
    if (!from || !to) {
      // Look for airport codes (3 letters)
      const airportCodes = message.match(/\b[A-Z]{3}\b/g);
      if (airportCodes && airportCodes.length >= 2) {
        from = from || airportCodes[0];
        to = to || airportCodes[1];
      }
      
      // Try simpler patterns
      if (!from || !to) {
        const simpleFromMatch = message.match(/(?:from|leaving)\s+([a-zA-Z\s]+)/i);
        const simpleToMatch = message.match(/(?:to|going)\s+([a-zA-Z\s]+)/i);
        
        if (simpleFromMatch) from = from || simpleFromMatch[1].trim();
        if (simpleToMatch) to = to || simpleToMatch[1].trim();
      }
    }

    // Clean up extracted locations (remove common words)
    from = from.replace(/\b(flights?|flight|plane|airplane)\b/gi, '').trim();
    to = to.replace(/\b(flights?|flight|plane|airplane)\b/gi, '').trim();

    // Extract date
    const dateMatch = message.match(/on\s+([0-9-\/]+)/i) || message.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
    
    const result = { from, to, date };
    console.log('Extracted flight details:', result);
    return result;
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
    setInputValue('');
    setIsLoading(true);

    // Extract flight details from message
    const flightDetails = extractFlightDetails(inputValue.toLowerCase());
    
    console.log('Processing flight search with details:', flightDetails);

    if (flightDetails.from && flightDetails.to) {
      try {
        console.log('Searching flights...');
        const flights = await searchFlights(flightDetails.from, flightDetails.to, flightDetails.date);
        
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I found ${flights.length} flights from ${flightDetails.from} to ${flightDetails.to}. Here are the available options:`,
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
        text: "I'd be happy to help you find flights! Please tell me:\n\n• Where are you flying from?\n• Where do you want to go?\n• What date? (optional)\n\nFor example: 'I want to fly from New York to London' or 'Find flights from LAX to JFK'",
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
            <h2 className="font-semibold text-lg">Flight Search Assistant</h2>
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
                    {message.isBot ? <Bot className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-gray-600" />}
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
                      <FlightCard key={`${message.id}-flight-${index}`} flight={flight} />
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
              placeholder="Type your message... (e.g., 'Find flights from LAX to JFK')"
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
            Try: "Find flights from New York to London" or "Search LAX to JFK flights"
          </p>
        </div>
      </Card>
    </div>
  );
};

export default FlightBot;
