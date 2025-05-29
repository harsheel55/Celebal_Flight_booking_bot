import { FlightSearchDetails } from './aiService';

// NLP Service for Flight Chat Navigator
// This service handles natural language processing for flight search queries

/**
 * Extracts flight search details from a user message using NLP techniques
 * This is an enhanced version that can handle more complex queries
 * @param message The user's message text
 * @returns Object containing flight search details
 */
export const extractFlightDetails = (message: string): FlightSearchDetails => {
  console.log('Processing message with enhanced NLP:', message);
  
  let from = '';
  let to = '';
  let date = '';
  let returnDate = '';
  let travelers = 1; // Default to 1 traveler
  let travelClass: 'economy' | 'business' | 'first' | undefined;
  let directOnly = false;
  let airline = '';
  let maxPrice = 0;

  // City/Airport extraction patterns
  // 1. "from X to Y" pattern
  const fromToPattern = /(?:from|departing from|leaving from|flying from)\s+([a-zA-Z\s.',-]+)(?:\s+to|\s+and\s+(?:going|flying|traveling)\s+to)\s+([a-zA-Z\s.',-]+)/i;
  const fromToMatch = message.match(fromToPattern);
  
  // 2. "X to Y" pattern (simpler form)
  const simpleFromToPattern = /\b([a-zA-Z\s.',-]{2,})\s+to\s+([a-zA-Z\s.',-]{2,})\b/i;
  const simpleFromToMatch = message.match(simpleFromToPattern);
  
  // 3. "to Y from X" pattern (reverse order)
  const toFromPattern = /(?:to|arriving at|going to)\s+([a-zA-Z\s.',-]+)(?:\s+from|\s+departing\s+from)\s+([a-zA-Z\s.',-]+)/i;
  const toFromMatch = message.match(toFromPattern);

  // Extract origin and destination
  if (fromToMatch && fromToMatch[1] && fromToMatch[2]) {
    from = fromToMatch[1].trim();
    to = fromToMatch[2].trim();
  } else if (toFromMatch && toFromMatch[1] && toFromMatch[2]) {
    to = toFromMatch[1].trim();
    from = toFromMatch[2].trim();
  } else if (simpleFromToMatch && simpleFromToMatch[1] && simpleFromToMatch[2]) {
    // Only use simple pattern if the others didn't match
    from = simpleFromToMatch[1].trim();
    to = simpleFromToMatch[2].trim();
  }

  // Date extraction patterns
  // 1. Specific date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
  const specificDatePattern = /\b(on|for|date[:]?)\s+(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})\b/i;
  const specificDateMatch = message.match(specificDatePattern);
  
  // 2. Month and day format (June 5, June 5th, 5th June, etc.)
  const monthDayPattern = /\b(on|for|date[:]?)\s+(?:(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-zA-Z]+)|([a-zA-Z]+)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?)\b/i;
  const monthDayMatch = message.match(monthDayPattern);
  
  // 3. Relative dates (tomorrow, next week, etc.)
  const relativeDatePattern = /\b(on|for|date[:]?)\s+(today|tomorrow|(?:next|this)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month))\b/i;
  const relativeDateMatch = message.match(relativeDatePattern);

  // Extract date
  if (specificDateMatch && specificDateMatch[2]) {
    date = specificDateMatch[2];
  } else if (monthDayMatch) {
    if (monthDayMatch[2] && monthDayMatch[3]) {
      // Format: "5th June"
      date = `${monthDayMatch[3]} ${monthDayMatch[2]}`;
    } else if (monthDayMatch[4] && monthDayMatch[5]) {
      // Format: "June 5th"
      date = `${monthDayMatch[4]} ${monthDayMatch[5]}`;
    }
  } else if (relativeDateMatch && relativeDateMatch[2]) {
    date = relativeDateMatch[2];
  }

  // Number of travelers extraction
  const travelersPatterns = [
    /\b(\d+)\s+(?:person|people|passenger|passengers|travell?ers?|adults?|seniors?|children|child|infant|infants)\b/i,
    /\bfor\s+(\d+)\s+(?:person|people|passenger|passengers|travell?ers?)\b/i,
    /\b(?:person|people|passenger|passengers|travell?ers?)[:]?\s+(\d+)\b/i
  ];

  for (const pattern of travelersPatterns) {
    const travelersMatch = message.match(pattern);
    if (travelersMatch && travelersMatch[1]) {
      travelers = parseInt(travelersMatch[1], 10);
      break;
    }
  }

  // Travel class extraction
  const classPatterns = [
    /\b(economy|business|first)(?:\s+class)?\b/i,
    /\bclass[:]?\s+(economy|business|first)\b/i
  ];

  for (const pattern of classPatterns) {
    const classMatch = message.match(pattern);
    if (classMatch && classMatch[1]) {
      const classLower = classMatch[1].toLowerCase();
      if (classLower === 'economy' || classLower === 'business' || classLower === 'first') {
        travelClass = classLower as 'economy' | 'business' | 'first';
      }
      break;
    }
  }

  // Direct flights preference
  const directFlightPatterns = [
    /\b(direct|non-stop|nonstop)(?:\s+flights?)?\b/i,
    /\bno\s+(?:stops|layovers|connections)\b/i,
    /\bwithout\s+(?:stops|layovers|connections)\b/i
  ];

  for (const pattern of directFlightPatterns) {
    if (pattern.test(message)) {
      directOnly = true;
      break;
    }
  }

  // Airline preference
  const airlinePatterns = [
    /\b(?:on|with|via|using|by|through|airline[:]?)\s+([a-zA-Z\s]{2,}?)(?:\s+airlines?)?\b/i,
    /\b([a-zA-Z\s]{2,}?)(?:\s+airlines?)\b/i
  ];

  for (const pattern of airlinePatterns) {
    const airlineMatch = message.match(pattern);
    if (airlineMatch && airlineMatch[1]) {
      const potentialAirline = airlineMatch[1].trim();
      // Avoid matching common phrases that aren't airlines
      const nonAirlineTerms = ['flight', 'book', 'find', 'search', 'the', 'a', 'an', 'any', 'some', 'direct'];
      if (!nonAirlineTerms.includes(potentialAirline.toLowerCase())) {
        airline = potentialAirline;
        break;
      }
    }
  }

  // Price limit extraction
  const pricePatterns = [
    /\bunder\s+\$?(\d+[,\d]*)/i,
    /\bless\s+than\s+\$?(\d+[,\d]*)/i,
    /\bmaximum\s+(?:price|cost)[:]?\s+\$?(\d+[,\d]*)/i,
    /\bmax\s+(?:price|cost)[:]?\s+\$?(\d+[,\d]*)/i,
    /\bprice[:]?\s+\$?(\d+[,\d]*)/i,
    /\$(\d+[,\d]*)/i
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
  
  console.log('Extracted flight details with enhanced NLP:', result);
  return result;
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

/**
 * Detects the language of a message
 * In a production environment, this would use a language detection API
 * @param message The user's message
 * @returns The detected language code
 */
export const detectLanguage = (message: string): string => {
  // This is a simplified implementation
  // In a real app, you would use a language detection API
  
  // Common words in different languages
  const languagePatterns: Record<string, RegExp[]> = {
    'en': [/\b(hello|flight|book|from|to|search|find)\b/i],
    'es': [/\b(hola|vuelo|reservar|desde|hasta|buscar|encontrar)\b/i],
    'hi': [/\b(नमस्ते|उड़ान|बुक|से|तक|खोज|ढूंढना)\b/i],
    'fr': [/\b(bonjour|vol|réserver|de|à|chercher|trouver)\b/i],
    'de': [/\b(hallo|flug|buchen|von|nach|suchen|finden)\b/i]
  };
  
  // Count matches for each language
  const matches: Record<string, number> = {};
  
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    matches[lang] = 0;
    for (const pattern of patterns) {
      const matchCount = (message.match(pattern) || []).length;
      matches[lang] += matchCount;
    }
  }
  
  // Find the language with the most matches
  let detectedLang = 'en'; // Default to English
  let maxMatches = 0;
  
  for (const [lang, count] of Object.entries(matches)) {
    if (count > maxMatches) {
      maxMatches = count;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
};

/**
 * Translates a message to English
 * In a production environment, this would use a translation API
 * @param message The message to translate
 * @param sourceLanguage The source language code
 * @returns The translated message
 */
export const translateToEnglish = (message: string, sourceLanguage: string): string => {
  // This is a simplified implementation
  // In a real app, you would use a translation API like Google Translate or Azure Translator
  
  if (sourceLanguage === 'en') {
    return message; // Already in English
  }
  
  console.log(`[Translation] Would translate from ${sourceLanguage} to English: "${message}"`);
  
  // For demo purposes, we'll just return the original message
  // In a real implementation, you would call a translation API here
  return message;
};

/**
 * Translates a message from English to another language
 * In a production environment, this would use a translation API
 * @param message The message to translate
 * @param targetLanguage The target language code
 * @returns The translated message
 */
export const translateFromEnglish = (message: string, targetLanguage: string): string => {
  // This is a simplified implementation
  // In a real app, you would use a translation API
  
  if (targetLanguage === 'en') {
    return message; // Already in English
  }
  
  console.log(`[Translation] Would translate from English to ${targetLanguage}: "${message}"`);
  
  // For demo purposes, we'll just return the original message
  // In a real implementation, you would call a translation API here
  return message;
};
