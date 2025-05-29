export interface Flight {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared?: any;
  };
  aircraft?: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
    model?: string;
  };
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
  // Added fields for enhanced functionality
  price?: number;
  duration?: number; // in minutes
  stops?: number;
  layovers?: {
    airport: string;
    duration: number; // in minutes
  }[];
  class?: 'economy' | 'business' | 'first';
  seatsAvailable?: number;
  refundable?: boolean;
}

interface FlightSearchResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: Flight[];
}

export interface FlightSearchOptions {
  departure: string;
  arrival: string;
  date?: string;
  returnDate?: string;
  travelers?: number;
  class?: 'economy' | 'business' | 'first';
  directOnly?: boolean;
  airline?: string;
  maxPrice?: number;
}

export interface PriceComparisonResult {
  airline: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  flights: Flight[];
}

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY;
const BASE_URL = 'https://api.aviationstack.com/v1';

export const searchFlights = async (options: FlightSearchOptions): Promise<Flight[]> => {
  // Note: Aviationstack API has CORS restrictions for browser requests
  // In production, this should be called from a backend server
  console.log('Searching flights with options:', options);
  
  try {
    // Build query parameters
    const params = new URLSearchParams({
      access_key: API_KEY,
      limit: '20' // Increased limit to get more results for filtering
    });

    // Add departure airport (try to match IATA codes or airport names)
    if (options.departure.length === 3) {
      params.append('dep_iata', options.departure.toUpperCase());
    } else {
      // For city/airport names, we'll search by the first matching IATA code
      const depCode = getAirportCode(options.departure);
      if (depCode) {
        params.append('dep_iata', depCode);
      }
    }

    // Add arrival airport
    if (options.arrival.length === 3) {
      params.append('arr_iata', options.arrival.toUpperCase());
    } else {
      const arrCode = getAirportCode(options.arrival);
      if (arrCode) {
        params.append('arr_iata', arrCode);
      }
    }

    // Add flight date if provided
    if (options.date) {
      // Try to convert natural language dates to YYYY-MM-DD format
      const formattedDate = formatDateForAPI(options.date);
      if (formattedDate) {
        params.append('flight_date', formattedDate);
      }
    }

    // Add airline filter if provided
    if (options.airline) {
      const airlineCode = getAirlineCode(options.airline);
      if (airlineCode) {
        params.append('airline_iata', airlineCode);
      }
    }

    console.log('API request URL:', `${BASE_URL}/flights?${params.toString()}`);

    const response = await fetch(`${BASE_URL}/flights?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FlightSearchResponse = await response.json();
    console.log('API response:', data);

    if (data.data && Array.isArray(data.data)) {
      let flights = data.data;
      
      // Apply additional filters that can't be done via API
      if (options.directOnly) {
        flights = flights.filter(flight => !flight.stops || flight.stops === 0);
      }
      
      if (options.maxPrice) {
        flights = flights.filter(flight => !flight.price || flight.price <= options.maxPrice!);
      }
      
      if (options.class) {
        flights = flights.filter(flight => !flight.class || flight.class === options.class);
      }
      
      return flights;
    } else {
      console.log('No flight data in response');
      return getMockFlights(options);
    }
  } catch (error) {
    console.error('Error fetching flights (expected due to CORS):', error);
    console.log('Falling back to mock data for demonstration...');
    
    // Return mock data for demonstration since browser requests to Aviationstack are blocked by CORS
    return getMockFlights(options);
  }
};

// Helper function to format dates for the API
const formatDateForAPI = (dateString: string): string | null => {
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  try {
    // Handle natural language dates
    if (dateString.toLowerCase() === 'today') {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    
    if (dateString.toLowerCase() === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Try to parse the date string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If we can't parse it, return null
    return null;
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Get airline IATA code
const getAirlineCode = (airlineName: string): string | null => {
  const airlineCodes: { [key: string]: string } = {
    'american': 'AA',
    'american airlines': 'AA',
    'delta': 'DL',
    'delta air lines': 'DL',
    'united': 'UA',
    'united airlines': 'UA',
    'british airways': 'BA',
    'lufthansa': 'LH',
    'emirates': 'EK',
    'qatar': 'QR',
    'qatar airways': 'QR',
    'singapore airlines': 'SQ',
    'air india': 'AI',
    'indigo': '6E',
    'spicejet': 'SG',
    'vistara': 'UK',
    'air asia': 'AK',
    'etihad': 'EY',
    'etihad airways': 'EY',
    'southwest': 'WN',
    'southwest airlines': 'WN',
    'jetblue': 'B6',
    'jetblue airways': 'B6',
    'air canada': 'AC',
    'air france': 'AF',
    'klm': 'KL',
    'turkish airlines': 'TK',
    'cathay pacific': 'CX',
  };

  return airlineCodes[airlineName.toLowerCase()] || null;
};

// Compare prices across airlines
export const compareFlightPrices = (flights: Flight[]): PriceComparisonResult[] => {
  // Group flights by airline
  const airlineGroups: { [key: string]: Flight[] } = {};
  
  flights.forEach(flight => {
    const airlineName = flight.airline.name;
    if (!airlineGroups[airlineName]) {
      airlineGroups[airlineName] = [];
    }
    airlineGroups[airlineName].push(flight);
  });
  
  // Calculate price statistics for each airline
  const results: PriceComparisonResult[] = [];
  
  Object.entries(airlineGroups).forEach(([airline, airlineFlights]) => {
    // Filter flights with prices
    const flightsWithPrices = airlineFlights.filter(f => f.price !== undefined);
    
    if (flightsWithPrices.length > 0) {
      const prices = flightsWithPrices.map(f => f.price!);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      results.push({
        airline,
        minPrice,
        maxPrice,
        avgPrice,
        flights: airlineFlights
      });
    }
  });
  
  // Sort by minimum price
  return results.sort((a, b) => a.minPrice - b.minPrice);
};

// Helper function to get airport codes for common cities/airports
const getAirportCode = (location: string): string | null => {
  const airportCodes: { [key: string]: string } = {
    'new york': 'JFK',
    'london': 'LHR',
    'paris': 'CDG',
    'tokyo': 'NRT',
    'los angeles': 'LAX',
    'chicago': 'ORD',
    'miami': 'MIA',
    'san francisco': 'SFO',
    'boston': 'BOS',
    'washington': 'DCA',
    'atlanta': 'ATL',
    'denver': 'DEN',
    'seattle': 'SEA',
    'las vegas': 'LAS',
    'orlando': 'MCO',
    'phoenix': 'PHX',
    'dallas': 'DFW',
    'houston': 'IAH',
    'detroit': 'DTW',
    'minneapolis': 'MSP',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'madrid': 'MAD',
    'rome': 'FCO',
    'barcelona': 'BCN',
    'dubai': 'DXB',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'toronto': 'YYZ',
    'vancouver': 'YVR',
    'mumbai': 'BOM',
    'delhi': 'DEL',
    'bangkok': 'BKK',
    'jakarta': 'CGK',
    'kuala lumpur': 'KUL',
    'surat': 'STV'
  };

  return airportCodes[location.toLowerCase()] || null;
};

// Enhanced mock flights with more realistic data for demonstration
const getMockFlights = (options: FlightSearchOptions): Flight[] => {
  const airlines = [
    { name: 'American Airlines', iata: 'AA', icao: 'AAL' },
    { name: 'Delta Air Lines', iata: 'DL', icao: 'DAL' },
    { name: 'United Airlines', iata: 'UA', icao: 'UAL' },
    { name: 'British Airways', iata: 'BA', icao: 'BAW' },
    { name: 'Lufthansa', iata: 'LH', icao: 'DLH' },
    { name: 'Emirates', iata: 'EK', icao: 'UAE' },
    { name: 'Air India', iata: 'AI', icao: 'AIC' },
    { name: 'Qatar Airways', iata: 'QR', icao: 'QTR' },
    { name: 'Singapore Airlines', iata: 'SQ', icao: 'SIA' },
    { name: 'Etihad Airways', iata: 'EY', icao: 'ETD' }
  ];

  // Filter airlines if specified
  let filteredAirlines = airlines;
  if (options.airline) {
    filteredAirlines = airlines.filter(a => 
      a.name.toLowerCase().includes(options.airline!.toLowerCase()) || 
      a.iata.toLowerCase() === options.airline!.toLowerCase()
    );
    
    // If no match found, use all airlines
    if (filteredAirlines.length === 0) {
      filteredAirlines = airlines;
    }
  }

  const mockFlights: Flight[] = [];
  const numFlights = 10; // Generate more flights for better filtering
  
  for (let i = 0; i < numFlights; i++) {
    const airline = filteredAirlines[i % filteredAirlines.length];
    const flightNumber = `${airline.iata}${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Generate departure time based on date if provided
    const departureTime = new Date();
    if (options.date) {
      try {
        const dateObj = new Date(options.date);
        if (!isNaN(dateObj.getTime())) {
          departureTime.setFullYear(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        }
      } catch (e) {
        // If date parsing fails, use current date
      }
    }
    
    departureTime.setHours(6 + i % 18, Math.floor(Math.random() * 60)); // Spread flights throughout the day
    
    // Calculate flight duration (2-14 hours)
    const flightDurationMinutes = 120 + Math.floor(Math.random() * 720);
    
    const arrivalTime = new Date(departureTime);
    arrivalTime.setMinutes(arrivalTime.getMinutes() + flightDurationMinutes);

    const depCode = options.departure.length === 3 ? options.departure.toUpperCase() : getAirportCode(options.departure) || options.departure.substring(0, 3).toUpperCase();
    const arrCode = options.arrival.length === 3 ? options.arrival.toUpperCase() : getAirportCode(options.arrival) || options.arrival.substring(0, 3).toUpperCase();

    // Generate random price based on distance and class
    const basePrice = 100 + Math.floor(Math.random() * 400);
    let price = basePrice;
    
    // Add price multiplier based on class
    const flightClass = options.class || (Math.random() > 0.7 ? (Math.random() > 0.5 ? 'business' : 'first') : 'economy');
    if (flightClass === 'business') {
      price *= 2.5;
    } else if (flightClass === 'first') {
      price *= 4;
    }
    
    // Determine if this is a direct flight or has stops
    const isDirectFlight = options.directOnly || Math.random() > 0.3;
    const numStops = isDirectFlight ? 0 : (Math.random() > 0.7 ? 2 : 1);
    
    // Generate layover information if there are stops
    const layovers: { airport: string; duration: number }[] = [];
    if (numStops > 0) {
      const layoverAirports = ['JFK', 'LHR', 'DXB', 'SIN', 'FRA', 'AMS', 'CDG', 'DOH'];
      
      for (let j = 0; j < numStops; j++) {
        const layoverAirport = layoverAirports[Math.floor(Math.random() * layoverAirports.length)];
        const layoverDuration = 45 + Math.floor(Math.random() * 180); // 45 minutes to 3 hours
        layovers.push({
          airport: layoverAirport,
          duration: layoverDuration
        });
      }
      
      // Add layover time to arrival time
      const totalLayoverTime = layovers.reduce((sum, layover) => sum + layover.duration, 0);
      arrivalTime.setMinutes(arrivalTime.getMinutes() + totalLayoverTime);
      
      // Non-direct flights are usually cheaper
      price = Math.floor(price * 0.85);
    }
    
    // Apply max price filter if specified
    if (options.maxPrice && price > options.maxPrice) {
      price = options.maxPrice - Math.floor(Math.random() * 50); // Just under the max price
    }

    mockFlights.push({
      flight_date: departureTime.toISOString().split('T')[0],
      flight_status: Math.random() > 0.8 ? 'active' : 'scheduled',
      departure: {
        airport: `${options.departure} Airport`,
        timezone: 'UTC',
        iata: depCode,
        icao: 'K' + depCode,
        scheduled: departureTime.toISOString(),
        terminal: `${Math.floor(Math.random() * 5) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
      },
      arrival: {
        airport: `${options.arrival} Airport`,
        timezone: 'UTC',
        iata: arrCode,
        icao: 'K' + arrCode,
        scheduled: arrivalTime.toISOString(),
        terminal: `${Math.floor(Math.random() * 5) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
      },
      airline,
      flight: {
        number: flightNumber,
        iata: flightNumber,
        icao: `${airline.icao}${Math.floor(Math.random() * 9000) + 1000}`
      },
      aircraft: {
        registration: `N${Math.floor(Math.random() * 90000) + 10000}`,
        iata: '73G',
        icao: 'B737',
        icao24: Math.random().toString(16).substring(2, 8).toUpperCase(),
        model: 'Boeing 737-800'
      },
      // Additional fields for enhanced functionality
      price,
      duration: flightDurationMinutes + (numStops > 0 ? layovers.reduce((sum, l) => sum + l.duration, 0) : 0),
      stops: numStops,
      layovers: numStops > 0 ? layovers : undefined,
      class: flightClass as 'economy' | 'business' | 'first',
      seatsAvailable: Math.floor(Math.random() * 30) + 1,
      refundable: Math.random() > 0.7
    });
  }

  return mockFlights;
};

// Filter flights based on user preferences
export const filterFlights = (flights: Flight[], options: {
  directOnly?: boolean;
  airline?: string;
  maxPrice?: number;
  class?: 'economy' | 'business' | 'first';
  minSeats?: number;
}): Flight[] => {
  let filteredFlights = [...flights];
  
  if (options.directOnly) {
    filteredFlights = filteredFlights.filter(flight => !flight.stops || flight.stops === 0);
  }
  
  if (options.airline) {
    filteredFlights = filteredFlights.filter(flight => 
      flight.airline.name.toLowerCase().includes(options.airline!.toLowerCase()) ||
      flight.airline.iata.toLowerCase() === options.airline!.toLowerCase()
    );
  }
  
  if (options.maxPrice) {
    filteredFlights = filteredFlights.filter(flight => 
      flight.price !== undefined && flight.price <= options.maxPrice!
    );
  }
  
  if (options.class) {
    filteredFlights = filteredFlights.filter(flight => 
      flight.class === options.class
    );
  }
  
  if (options.minSeats) {
    filteredFlights = filteredFlights.filter(flight => 
      flight.seatsAvailable !== undefined && flight.seatsAvailable >= options.minSeats!
    );
  }
  
  return filteredFlights;
};

// Get flights sorted by different criteria
export const sortFlights = (flights: Flight[], sortBy: 'price' | 'duration' | 'departure' | 'arrival'): Flight[] => {
  const sortedFlights = [...flights];
  
  switch (sortBy) {
    case 'price':
      return sortedFlights.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    
    case 'duration':
      return sortedFlights.sort((a, b) => (a.duration || Infinity) - (b.duration || Infinity));
    
    case 'departure':
      return sortedFlights.sort((a, b) => {
        const dateA = new Date(a.departure.scheduled).getTime();
        const dateB = new Date(b.departure.scheduled).getTime();
        return dateA - dateB;
      });
    
    case 'arrival':
      return sortedFlights.sort((a, b) => {
        const dateA = new Date(a.arrival.scheduled).getTime();
        const dateB = new Date(b.arrival.scheduled).getTime();
        return dateA - dateB;
      });
    
    default:
      return sortedFlights;
  }
};

/**
 * Get real-time flight data from AviationStack API
 * This function fetches live flight data and returns flights that are currently in the air
 * @returns Promise<Flight[]> A list of flights currently in the air
 */
export const getLiveFlights = async (): Promise<Flight[]> => {
  try {
    console.log('Fetching live flight data...');
    
    const params = {
      access_key: API_KEY,
      limit: '100', // Increase this to get more results
      flight_status: 'active' // Only get active flights
    };
    
    // Using fetch API for browser compatibility
    const response = await fetch(`${BASE_URL}/flights?${new URLSearchParams(params).toString()}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('AviationStack API error:', data.error);
      throw new Error(data.error.message || 'Error fetching live flights');
    }
    
    // Filter flights that are in the air
    const liveFlights = data.data.filter((flight: Flight) => 
      flight.live && !flight.live.is_ground
    );
    
    console.log(`Found ${liveFlights.length} flights currently in the air`);
    return liveFlights;
  } catch (error) {
    console.error('Error fetching live flights:', error);
    // Return mock data in case of error
    return getMockLiveFlights();
  }
};

/**
 * Generate mock live flight data for testing or when the API fails
 * @returns Flight[] A list of mock flights
 */
const getMockLiveFlights = (): Flight[] => {
  const mockFlights: Flight[] = [];
  const airlines = [
    { name: 'Emirates', iata: 'EK', icao: 'UAE' },
    { name: 'British Airways', iata: 'BA', icao: 'BAW' },
    { name: 'Lufthansa', iata: 'LH', icao: 'DLH' },
    { name: 'Air India', iata: 'AI', icao: 'AIC' },
    { name: 'Singapore Airlines', iata: 'SQ', icao: 'SIA' }
  ];
  
  const routes = [
    { dep: 'JFK', arr: 'LHR', depName: 'New York JFK', arrName: 'London Heathrow' },
    { dep: 'DXB', arr: 'BOM', depName: 'Dubai International', arrName: 'Mumbai Chhatrapati Shivaji' },
    { dep: 'SIN', arr: 'SYD', depName: 'Singapore Changi', arrName: 'Sydney Kingsford Smith' },
    { dep: 'LAX', arr: 'NRT', depName: 'Los Angeles International', arrName: 'Tokyo Narita' },
    { dep: 'DEL', arr: 'FRA', depName: 'Delhi Indira Gandhi', arrName: 'Frankfurt International' }
  ];
  
  // Generate 10 mock flights
  for (let i = 0; i < 10; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const route = routes[Math.floor(Math.random() * routes.length)];
    const flightNumber = Math.floor(Math.random() * 1000) + 100;
    
    // Calculate random coordinates for live tracking
    const latitude = (Math.random() * 180) - 90; // -90 to 90
    const longitude = (Math.random() * 360) - 180; // -180 to 180
    const altitude = Math.floor(Math.random() * 40000) + 30000; // 30,000 to 70,000 feet
    const speed = Math.floor(Math.random() * 300) + 500; // 500 to 800 knots
    
    // Calculate departure and arrival times
    const now = new Date();
    const departureTime = new Date(now.getTime() - (Math.random() * 5 * 60 * 60 * 1000)); // 0-5 hours ago
    const flightDuration = Math.floor(Math.random() * 10 * 60) + 120; // 2-12 hours in minutes
    const arrivalTime = new Date(departureTime.getTime() + (flightDuration * 60 * 1000));
    
    mockFlights.push({
      flight_date: departureTime.toISOString().split('T')[0],
      flight_status: 'active',
      departure: {
        airport: route.depName,
        timezone: 'UTC',
        iata: route.dep,
        icao: 'K' + route.dep,
        scheduled: departureTime.toISOString(),
        terminal: `${Math.floor(Math.random() * 5) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
      },
      arrival: {
        airport: route.arrName,
        timezone: 'UTC',
        iata: route.arr,
        icao: 'K' + route.arr,
        scheduled: arrivalTime.toISOString(),
        terminal: `${Math.floor(Math.random() * 5) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
      },
      airline: {
        name: airline.name,
        iata: airline.iata,
        icao: airline.icao
      },
      flight: {
        number: flightNumber.toString(),
        iata: `${airline.iata}${flightNumber}`,
        icao: `${airline.icao}${flightNumber}`
      },
      aircraft: {
        registration: `N${Math.floor(Math.random() * 90000) + 10000}`,
        iata: '73G',
        icao: 'B737',
        icao24: Math.random().toString(16).substring(2, 8).toUpperCase(),
        model: 'Boeing 737-800'
      },
      live: {
        updated: new Date().toISOString(),
        latitude,
        longitude,
        altitude,
        direction: Math.floor(Math.random() * 360),
        speed_horizontal: speed,
        speed_vertical: 0,
        is_ground: false
      },
      price: Math.floor(Math.random() * 1000) + 500,
      duration: flightDuration,
      stops: 0
    });
  }
  
  return mockFlights;
};
