import { Flight } from './flightService';

// Define the FlightSearchDetails interface for more comprehensive search details
export interface FlightSearchDetails {
  from: string;
  to: string;
  date?: string;
  returnDate?: string;
  travelers?: number;
  class?: 'economy' | 'business' | 'first';
  directOnly?: boolean;
  airline?: string;
  maxPrice?: number;
}

/**
 * AI Service for Flight Chat Navigator
 * This service handles the AI understanding and processing of user queries
 * related to flight searches and bookings.
 */

// Function call definition for flight search
export interface SearchFlightsFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      from: { type: string; description: string };
      to: { type: string; description: string };
      date: { type: string; description: string };
      returnDate: { type: string; description: string };
      travelers: { type: string; description: string };
      class: { type: string; description: string };
      directOnly: { type: string; description: string };
      airline: { type: string; description: string };
      maxPrice: { type: string; description: string };
    };
    required: string[];
  };
}

// Define the searchFlights function call schema
export const searchFlightsFunction: SearchFlightsFunction = {
  name: "searchFlights",
  description: "Search flights between two cities",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string", description: "Departure city or airport" },
      to: { type: "string", description: "Arrival city or airport" },
      date: { type: "string", description: "Travel date (e.g., 2025-06-05, tomorrow, June 5)" },
      returnDate: { type: "string", description: "Return date for round trip (e.g., 2025-06-12, next week)" },
      travelers: { type: "string", description: "Number of passengers (e.g., 2 people, 1 adult)" },
      class: { type: "string", description: "Travel class (economy, business, first)" },
      directOnly: { type: "string", description: "Whether to show only direct flights (true/false)" },
      airline: { type: "string", description: "Preferred airline (e.g., Emirates, Air India)" },
      maxPrice: { type: "string", description: "Maximum price willing to pay (e.g., $500, 30000 rupees)" }
    },
    required: ["from", "to"]
  }
};

// System prompt for improved flight search understanding
export const flightSearchSystemPrompt = `
You are a helpful assistant that can extract flight search details from user inputs. 
Your job is to recognize clear instructions like "Find flights from New York to London" and respond accordingly.

- Do not ask for information the user has already provided.
- If the user provides the origin and destination, start the flight search immediately.
- Extract and confirm cities, airports, and optional dates.
- Respond in a conversational tone, acknowledging the user's request.
- Only ask follow-up questions if necessary details are missing.

Examples:

User: "Find flights from New York to London"
You: "Got it! Searching for flights from New York to London..."

User: "Book a flight from LAX to JFK"
You: "Sure! Booking a flight from LAX to JFK. Would you like to specify a date?"
`;

/**
 * Extracts comprehensive flight details from a user message using improved pattern matching
 * @param message The user's message text
 * @returns Object containing flight search details
 */
export const extractFlightDetails = (message: string): FlightSearchDetails => {
  console.log('Processing message with improved AI understanding:', message);
  
  let from = '';
  let to = '';
  let date = '';
  let returnDate = '';
  let travelers = 0;
  let travelClass: 'economy' | 'business' | 'first' | undefined;
  let directOnly = false;
  let airline = '';
  let maxPrice = 0;

  // First check: Simple city-to-city format (e.g., "Surat to Dubai")
  const simpleCityToCity = /^\s*([a-zA-Z\s]{2,})\s+to\s+([a-zA-Z\s]{2,})\s*$/i;
  const simpleCityMatch = message.match(simpleCityToCity);
  if (simpleCityMatch && simpleCityMatch.length >= 3) {
    from = simpleCityMatch[1].trim();
    to = simpleCityMatch[2].trim();
  } else {
    // Enhanced patterns for better extraction
    const fromPatterns = [
      /(?:from|leaving|departing|departure|origin)\s+([a-zA-Z\s]{2,}?)(?:\s+to\s|\s+going\s|\s+arriving\s|\s+$)/i,
      /\b([A-Z]{3})\s+to\s+/i,
      /^([a-zA-Z\s]{2,}?)\s+to\s+/i,  // Matches cases where message starts with city name
      /(?:flight|fight)(?:s|ing)?\s+(?:from|to)?\s+([a-zA-Z\s]{2,}?)\s+to/i  // Handles typos like "fight from X to Y"
    ];

    const toPatterns = [
      /(?:to|going|arriving|destination|arrival)\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$|\s+tomorrow|\s+today|\s+for\s|\s+with\s)/i,
      /\s+to\s+([A-Z]{3})\b/i,
      /\s+to\s+([a-zA-Z\s]{2,}?)(?:\s+on\s|\s+$|\s+tomorrow|\s+today|\s+for\s|\s+with\s)/i,
      /(?:flight|fight)(?:s|ing)?\s+(?:from|to)?\s+[a-zA-Z\s]{2,}?\s+to\s+([a-zA-Z\s]{2,})/i  // Handles typos like "fight from X to Y"
    ];

    // Extract from location with improved patterns
    for (const pattern of fromPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        from = match[1].trim();
        break;
      }
    }

    // Extract to location with improved patterns
    for (const pattern of toPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        to = match[1].trim();
        break;
      }
    }
  }

  // Clean up extracted locations
  from = from.replace(/\b(flights?|flight|plane|airplane|fight|book|that)\b/gi, '').trim();
  to = to.replace(/\b(flights?|flight|plane|airplane|fight|book|that)\b/gi, '').trim();

  // Extract date with improved patterns
  const datePatterns = [
    /(?:on|for)\s+([a-zA-Z0-9\s,\-\/]+?)(?:\s+(?:and|with|returning|to|for|class)|$)/i,
    /([0-9]{4}-[0-9]{2}-[0-9]{2})/,
    /\b(tomorrow|today|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?)\b/i
  ];

  for (const pattern of datePatterns) {
    const dateMatch = message.match(pattern);
    if (dateMatch) {
      date = dateMatch[1] ? dateMatch[1].trim() : dateMatch[0].trim(); // Use the capture group if available, otherwise full match
      break;
    }
  }
  
  // Extract return date for round trips
  const returnDatePatterns = [
    /(?:return(?:ing)?)\s+(?:on|by|at)?\s+([a-zA-Z0-9\s,\-\/]+?)(?:\s+(?:with|for|class)|$)/i,
    /(?:come|coming)\s+back\s+(?:on|by|at)?\s+([a-zA-Z0-9\s,\-\/]+?)(?:\s+(?:with|for|class)|$)/i,
    /round\s+trip\s+(?:from|between)\s+.+?\s+(?:to|and)\s+.+?\s+(?:on|from)\s+.+?\s+(?:to|until|and)\s+([a-zA-Z0-9\s,\-\/]+?)(?:\s+(?:with|for|class)|$)/i
  ];

  for (const pattern of returnDatePatterns) {
    const returnMatch = message.match(pattern);
    if (returnMatch && returnMatch[1]) {
      returnDate = returnMatch[1].trim();
      break;
    }
  }

  // Extract number of travelers
  const travelerPatterns = [
    /(?:for|with)\s+(\d+)\s+(?:people|person|passenger|travell?ers?|adults?|guests?)/i,
    /(\d+)\s+(?:people|person|passenger|travell?ers?|adults?|guests?)/i,
    /(?:book|get)\s+(?:a|the)?\s+(?:tickets?|flights?)\s+(?:for|with)\s+(\d+)\s+(?:people|person|passenger|travell?ers?|adults?|guests?)/i
  ];

  for (const pattern of travelerPatterns) {
    const travelerMatch = message.match(pattern);
    if (travelerMatch && travelerMatch[1]) {
      travelers = parseInt(travelerMatch[1], 10);
      break;
    }
  }

  // Default to 1 traveler if not specified
  if (travelers === 0) {
    travelers = 1;
  }

  // Extract travel class
  if (message.match(/\b(?:business\s+class|in\s+business)\b/i)) {
    travelClass = 'business';
  } else if (message.match(/\b(?:first\s+class|in\s+first)\b/i)) {
    travelClass = 'first';
  } else if (message.match(/\b(?:economy\s+class|in\s+economy)\b/i)) {
    travelClass = 'economy';
  }

  // Extract direct flight preference
  if (message.match(/\b(?:direct\s+(?:flights?|only)|non\s*stop|no\s+(?:stops?|layovers?|connections?))\b/i)) {
    directOnly = true;
  }

  // Extract airline preference
  const airlinePatterns = [
    /\b(?:on|with|by|using|via|through|prefer(?:ring)?)\s+([a-zA-Z\s]{2,}?)\s+(?:airlines?|airways?)\b/i,
    /\b([a-zA-Z\s]{2,}?)\s+(?:airlines?|airways?)\b/i
  ];

  for (const pattern of airlinePatterns) {
    const airlineMatch = message.match(pattern);
    if (airlineMatch && airlineMatch[1]) {
      airline = airlineMatch[1].trim();
      break;
    }
  }

  // Extract max price
  const pricePatterns = [
    /\bunder\s+(?:USD\s*)?[$₹€£]?\s*(\d[\d,.]*)\s*(?:dollars?|USD|rupees?|INR|EUR|GBP)?\b/i,
    /\bless\s+than\s+(?:USD\s*)?[$₹€£]?\s*(\d[\d,.]*)\s*(?:dollars?|USD|rupees?|INR|EUR|GBP)?\b/i,
    /\bmax(?:imum)?\s+(?:price|budget)\s+(?:of\s+)?(?:USD\s*)?[$₹€£]?\s*(\d[\d,.]*)\s*(?:dollars?|USD|rupees?|INR|EUR|GBP)?\b/i,
    /\b(?:USD\s*)?[$₹€£]?\s*(\d[\d,.]*)\s*(?:dollars?|USD|rupees?|INR|EUR|GBP)?\s+(?:or\s+less|maximum|max|budget)\b/i
  ];

  for (const pattern of pricePatterns) {
    const priceMatch = message.match(pattern);
    if (priceMatch && priceMatch[1]) {
      // Remove commas and convert to number
      maxPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      break;
    }
  }
  
  const result: FlightSearchDetails = { 
    from, 
    to, 
    date: date || undefined,
    returnDate: returnDate || undefined,
    travelers: travelers || undefined,
    class: travelClass,
    directOnly: directOnly || undefined,
    airline: airline || undefined,
    maxPrice: maxPrice || undefined
  };
  
  console.log('Extracted comprehensive flight details:', result);
  return result;
};

/**
 * Simulates function calling with the AI model
 * In a real implementation, this would call an actual LLM API with function calling
 * @param userMessage The user's message
 * @returns The extracted parameters for flight search
 */
export const simulateFunctionCalling = (userMessage: string) => {
  // This is a simplified simulation of what would happen with a real LLM API
  const details = extractFlightDetails(userMessage);
  
  // Only return values that were actually extracted
  const functionParams: Record<string, string> = {};
  if (details.from) functionParams.from = details.from;
  if (details.to) functionParams.to = details.to;
  if (details.date) functionParams.date = details.date;
  
  return {
    function_call: {
      name: "searchFlights",
      parameters: functionParams
    }
  };
};

/**
 * Generates a response based on the extracted flight details
 * @param details The extracted flight details
 * @returns A natural language response acknowledging the user's request
 */
export const generateFlightSearchResponse = (details: FlightSearchDetails) => {
  if (!details.from || !details.to) {
    return "I need both a departure and arrival location to search for flights. Could you please provide both?";
  }
  
  let response = `Great! I'll search for flights from ${details.from} to ${details.to}`;
  
  if (details.date) {
    response += ` on ${details.date}`;
  }
  
  if (details.returnDate) {
    response += ` with a return on ${details.returnDate}`;
  }
  
  if (details.travelers && details.travelers > 1) {
    response += ` for ${details.travelers} travelers`;
  }
  
  if (details.class) {
    response += ` in ${details.class} class`;
  }
  
  if (details.directOnly) {
    response += ", showing direct flights only";
  }
  
  if (details.airline) {
    response += ` with ${details.airline}`;
  }
  
  if (details.maxPrice) {
    response += ` under $${details.maxPrice}`;
  }
  
  response += ".";
  
  return response;
};

/**
 * Determines if a message is a flight search request
 * @param message The user's message
 * @returns True if the message appears to be a flight search request
 */
export const isFlightSearchRequest = (message: string): boolean => {
  const searchTerms = [
    'flight', 'flights', 'fly', 'book', 'travel', 'ticket', 'tickets',
    'from', 'to', 'search', 'find', 'look', 'show', 'trip', 'journey'
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // First check: Simple city-to-city format (e.g., "Surat to Dubai")
  // This pattern catches "X to Y" without requiring flight-specific terms
  const cityToCityPattern = /^\s*([a-zA-Z\s]{2,})\s+to\s+([a-zA-Z\s]{2,})\s*$/i;
  if (cityToCityPattern.test(lowerMessage)) {
    return true;
  }
  
  // Second check: Contains flight-related terms
  const containsFlightTerms = searchTerms.some(term => lowerMessage.includes(term));
  
  // Third check: Matches common flight search patterns
  const matchesPattern = Boolean(
    lowerMessage.match(/from .+ to .+/i) ||
    lowerMessage.match(/to .+ from .+/i) ||
    lowerMessage.match(/.+ to .+/i) ||
    lowerMessage.match(/flights? (?:from|to|between) .+/i) ||
    lowerMessage.match(/(?:book|find|search|show) (?:a |for )?(?:flights?|tickets?)/i)
  );
  
  // If it contains flight terms AND matches a pattern, OR if it's a simple "X to Y" format
  return (containsFlightTerms && matchesPattern);
};
