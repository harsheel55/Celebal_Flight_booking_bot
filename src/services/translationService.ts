/**
 * Translation Service for Flight Chat Navigator
 * This service handles language detection and translation for multilingual support
 * In a production environment, this would use a real translation API
 */

// Supported languages
export type SupportedLanguage = 'en' | 'es' | 'hi' | 'fr' | 'de';

// Language names for display
export const languageNames: Record<SupportedLanguage, string> = {
  'en': 'English',
  'es': 'Spanish',
  'hi': 'Hindi',
  'fr': 'French',
  'de': 'German'
};

// Common phrases in different languages for basic responses
export const commonPhrases: Record<string, Record<SupportedLanguage, string>> = {
  'greeting': {
    'en': 'Hello! I\'m your flight booking assistant.',
    'es': '¡Hola! Soy tu asistente de reserva de vuelos.',
    'hi': 'नमस्ते! मैं आपका उड़ान बुकिंग सहायक हूं।',
    'fr': 'Bonjour! Je suis votre assistant de réservation de vol.',
    'de': 'Hallo! Ich bin Ihr Flugbuchungsassistent.'
  },
  'flight_search': {
    'en': 'Searching for flights...',
    'es': 'Buscando vuelos...',
    'hi': 'उड़ानों की खोज कर रहा हूं...',
    'fr': 'Recherche de vols...',
    'de': 'Suche nach Flügen...'
  },
  'booking_confirmed': {
    'en': 'Your booking is confirmed!',
    'es': '¡Tu reserva está confirmada!',
    'hi': 'आपकी बुकिंग की पुष्टि हो गई है!',
    'fr': 'Votre réservation est confirmée!',
    'de': 'Ihre Buchung ist bestätigt!'
  },
  'booking_cancelled': {
    'en': 'Your booking has been cancelled.',
    'es': 'Tu reserva ha sido cancelada.',
    'hi': 'आपकी बुकिंग रद्द कर दी गई है।',
    'fr': 'Votre réservation a été annulée.',
    'de': 'Ihre Buchung wurde storniert.'
  },
  'ask_destination': {
    'en': 'Where would you like to fly to?',
    'es': '¿A dónde te gustaría volar?',
    'hi': 'आप कहां उड़ान भरना चाहेंगे?',
    'fr': 'Où aimeriez-vous voler?',
    'de': 'Wohin möchten Sie fliegen?'
  },
  'ask_origin': {
    'en': 'Where will you be flying from?',
    'es': '¿Desde dónde volarás?',
    'hi': 'आप कहां से उड़ान भरेंगे?',
    'fr': 'D\'où partirez-vous?',
    'de': 'Von wo werden Sie abfliegen?'
  },
  'ask_date': {
    'en': 'When would you like to travel?',
    'es': '¿Cuándo te gustaría viajar?',
    'hi': 'आप कब यात्रा करना चाहेंगे?',
    'fr': 'Quand souhaitez-vous voyager?',
    'de': 'Wann möchten Sie reisen?'
  },
  'ask_passengers': {
    'en': 'How many passengers will be traveling?',
    'es': '¿Cuántos pasajeros viajarán?',
    'hi': 'कितने यात्री यात्रा करेंगे?',
    'fr': 'Combien de passagers voyageront?',
    'de': 'Wie viele Passagiere werden reisen?'
  }
};

/**
 * Detects the language of a message
 * In a production environment, this would use a language detection API
 * @param message The user's message
 * @returns The detected language code
 */
export const detectLanguage = (message: string): SupportedLanguage => {
  // This is a simplified implementation
  // In a real app, you would use a language detection API like Google Cloud Translation or Azure Cognitive Services
  
  // Common words in different languages
  const languagePatterns: Record<SupportedLanguage, RegExp[]> = {
    'en': [/\b(hello|flight|book|from|to|search|find)\b/i],
    'es': [/\b(hola|vuelo|reservar|desde|hasta|buscar|encontrar)\b/i],
    'hi': [/\b(नमस्ते|उड़ान|बुक|से|तक|खोज|ढूंढना)\b/i],
    'fr': [/\b(bonjour|vol|réserver|de|à|chercher|trouver)\b/i],
    'de': [/\b(hallo|flug|buchen|von|nach|suchen|finden)\b/i]
  };
  
  // Count matches for each language
  const matches: Record<SupportedLanguage, number> = {
    'en': 0,
    'es': 0,
    'hi': 0,
    'fr': 0,
    'de': 0
  };
  
  for (const [lang, patterns] of Object.entries(languagePatterns) as [SupportedLanguage, RegExp[]][]) {
    for (const pattern of patterns) {
      const matchCount = (message.match(pattern) || []).length;
      matches[lang] += matchCount;
    }
  }
  
  // Find the language with the most matches
  let detectedLang: SupportedLanguage = 'en'; // Default to English
  let maxMatches = 0;
  
  for (const [lang, count] of Object.entries(matches) as [SupportedLanguage, number][]) {
    if (count > maxMatches) {
      maxMatches = count;
      detectedLang = lang;
    }
  }
  
  console.log(`Detected language: ${detectedLang} (${languageNames[detectedLang]})`);
  return detectedLang;
};

/**
 * Translates a message to English
 * In a production environment, this would use a translation API
 * @param message The message to translate
 * @param sourceLanguage The source language code
 * @returns The translated message
 */
export const translateToEnglish = (message: string, sourceLanguage: SupportedLanguage): string => {
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
export const translateFromEnglish = (message: string, targetLanguage: SupportedLanguage): string => {
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

/**
 * Gets a common phrase in the specified language
 * @param phraseKey The key of the phrase to get
 * @param language The target language
 * @returns The phrase in the specified language
 */
export const getPhrase = (phraseKey: string, language: SupportedLanguage = 'en'): string => {
  if (commonPhrases[phraseKey] && commonPhrases[phraseKey][language]) {
    return commonPhrases[phraseKey][language];
  }
  
  // Fall back to English if the phrase or language is not found
  return commonPhrases[phraseKey]?.['en'] || phraseKey;
};
