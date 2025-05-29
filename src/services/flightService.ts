
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

const API_KEY = '46c2986fe833ea22f05a4d8a972b627d';
const BASE_URL = 'http://api.aviationstack.com/v1';

export const searchFlights = async (
  departure: string, 
  arrival: string, 
  date?: string
): Promise<Flight[]> => {
  try {
    console.log('Searching flights:', { departure, arrival, date });
    
    // Build query parameters
    const params = new URLSearchParams({
      access_key: API_KEY,
      limit: '10'
    });

    // Add departure airport (try to match IATA codes or airport names)
    if (departure.length === 3) {
      params.append('dep_iata', departure.toUpperCase());
    } else {
      // For city/airport names, we'll search by the first matching IATA code
      const depCode = getAirportCode(departure);
      if (depCode) {
        params.append('dep_iata', depCode);
      }
    }

    // Add arrival airport
    if (arrival.length === 3) {
      params.append('arr_iata', arrival.toUpperCase());
    } else {
      const arrCode = getAirportCode(arrival);
      if (arrCode) {
        params.append('arr_iata', arrCode);
      }
    }

    // Add flight date if provided
    if (date) {
      params.append('flight_date', date);
    }

    console.log('API request URL:', `${BASE_URL}/flights?${params.toString()}`);

    const response = await fetch(`${BASE_URL}/flights?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FlightSearchResponse = await response.json();
    console.log('API response:', data);

    if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      console.log('No flight data in response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching flights:', error);
    
    // Return mock data for demonstration if API fails
    return getMockFlights(departure, arrival);
  }
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
    'kuala lumpur': 'KUL'
  };

  return airportCodes[location.toLowerCase()] || null;
};

// Mock flights for demonstration
const getMockFlights = (departure: string, arrival: string): Flight[] => {
  const airlines = [
    { name: 'American Airlines', iata: 'AA', icao: 'AAL' },
    { name: 'Delta Air Lines', iata: 'DL', icao: 'DAL' },
    { name: 'United Airlines', iata: 'UA', icao: 'UAL' },
    { name: 'British Airways', iata: 'BA', icao: 'BAW' },
    { name: 'Lufthansa', iata: 'LH', icao: 'DLH' }
  ];

  const mockFlights: Flight[] = [];
  
  for (let i = 0; i < 3; i++) {
    const airline = airlines[i % airlines.length];
    const flightNumber = `${airline.iata}${Math.floor(Math.random() * 9000) + 1000}`;
    const departureTime = new Date();
    departureTime.setHours(8 + i * 3, Math.floor(Math.random() * 60));
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + 3 + Math.floor(Math.random() * 5));

    mockFlights.push({
      flight_date: departureTime.toISOString().split('T')[0],
      flight_status: 'scheduled',
      departure: {
        airport: departure.length === 3 ? departure.toUpperCase() : getAirportCode(departure) || departure.toUpperCase(),
        timezone: 'America/New_York',
        iata: departure.length === 3 ? departure.toUpperCase() : getAirportCode(departure) || departure.substring(0, 3).toUpperCase(),
        icao: 'K' + (departure.length === 3 ? departure.toUpperCase() : getAirportCode(departure) || departure.substring(0, 3).toUpperCase()),
        scheduled: departureTime.toISOString(),
        terminal: `${Math.floor(Math.random() * 5) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 20) + 1}`
      },
      arrival: {
        airport: arrival.length === 3 ? arrival.toUpperCase() : getAirportCode(arrival) || arrival.toUpperCase(),
        timezone: 'America/Los_Angeles',
        iata: arrival.length === 3 ? arrival.toUpperCase() : getAirportCode(arrival) || arrival.substring(0, 3).toUpperCase(),
        icao: 'K' + (arrival.length === 3 ? arrival.toUpperCase() : getAirportCode(arrival) || arrival.substring(0, 3).toUpperCase()),
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
      }
    });
  }

  return mockFlights;
};
