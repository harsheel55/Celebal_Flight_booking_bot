// services/flightService.js
const axios = require('axios');
require('dotenv').config();

class FlightService {
    constructor() {
        // Amadeus API credentials
        this.clientId = process.env.AMADEUS_API_KEY;
        this.clientSecret = process.env.AMADEUS_API_SECRET;
        this.baseURL = 'https://test.api.amadeus.com'; // Use test environment
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Alternative API for flight status
        this.aviationStackKey = process.env.AVIATIONSTACK_API_KEY;
    }

    // Get OAuth token for Amadeus API
    async getAccessToken() {
        try {
            // Check if token is still valid
            if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.accessToken;
            }

            const response = await axios.post(`${this.baseURL}/v1/security/oauth2/token`, 
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            // Set expiry time (usually 30 minutes for Amadeus)
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('Error getting access token:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with flight API');
        }
    }

    async searchFlights(origin, destination, departureDate, returnDate = null, passengers = 1) {
        try {
            // Convert city names to airport codes
            const originCode = this.getAirportCode(origin);
            const destinationCode = this.getAirportCode(destination);
            
            console.log(`Converting: ${origin} -> ${originCode}, ${destination} -> ${destinationCode}`);
            
            // Check if API credentials are available
            if (!this.clientId || !this.clientSecret) {
                console.log('API credentials not found, returning mock data');
                const mockResult = this.getMockFlightData(originCode, destinationCode, departureDate);
                console.log('Returning mock data:', mockResult);
                return mockResult;
            }

            const token = await this.getAccessToken();
            
            const params = {
                originLocationCode: originCode,
                destinationLocationCode: destinationCode,
                departureDate: departureDate,
                adults: passengers,
                max: 10
            };

            if (returnDate) {
                params.returnDate = returnDate;
            }

            console.log('API request params:', params);

            const response = await axios.get(`${this.baseURL}/v2/shopping/flight-offers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: params
            });

            console.log('API Response Status:', response.status);
            console.log('API Response Data Structure:', {
                hasData: !!response.data,
                hasDataArray: !!response.data?.data,
                dataLength: response.data?.data?.length || 0,
                responseKeys: Object.keys(response.data || {})
            });

            // Log first few characters of response for debugging
            console.log('API Response Sample:', JSON.stringify(response.data).substring(0, 500));

            const formattedResult = this.formatFlightResults(response.data);
            console.log('Final Formatted Result being returned:', JSON.stringify(formattedResult, null, 2));

            // If no flights found in API response, fallback to mock data
            if (!formattedResult.flights || formattedResult.flights.length === 0) {
                console.log('No flights in API response, falling back to mock data');
                const mockResult = this.getMockFlightData(originCode, destinationCode, departureDate);
                console.log('Returning mock fallback:', mockResult);
                return mockResult;
            }

            // Ensure we're returning the correct structure
            console.log('Successfully returning API result with', formattedResult.flights.length, 'flights');
            return formattedResult;

        } catch (error) {
            console.error('Flight search error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    params: error.config?.params
                }
            });
            
            // Fallback to mock data if API fails
            console.log('API failed, returning mock data');
            const originCode = this.getAirportCode(origin);
            const destinationCode = this.getAirportCode(destination);
            const mockResult = this.getMockFlightData(originCode, destinationCode, departureDate);
            console.log('Returning error fallback mock data:', mockResult);
            return mockResult;
        }
    }

    async getFlightStatus(flightNumber) {
        try {
            // Use AviationStack API for flight status
            if (this.aviationStackKey) {
                const response = await axios.get('http://api.aviationstack.com/v1/flights', {
                    params: {
                        access_key: this.aviationStackKey,
                        flight_iata: flightNumber,
                        limit: 1
                    }
                });

                if (response.data.data && response.data.data.length > 0) {
                    const flight = response.data.data[0];
                    return {
                        flightNumber: flight.flight.iata,
                        status: flight.flight_status,
                        departure: {
                            airport: flight.departure.airport,
                            scheduled: flight.departure.scheduled,
                            estimated: flight.departure.estimated || flight.departure.scheduled
                        },
                        arrival: {
                            airport: flight.arrival.airport,
                            scheduled: flight.arrival.scheduled,
                            estimated: flight.arrival.estimated || flight.arrival.scheduled
                        }
                    };
                }
            }

            // Fallback to mock data
            return this.getMockFlightStatus(flightNumber);
        } catch (error) {
            console.error('Flight status error:', error.message);
            return this.getMockFlightStatus(flightNumber);
        }
    }

    formatFlightResults(data) {
        console.log('formatFlightResults called with:', {
            hasData: !!data,
            hasDataProperty: !!data?.data,
            dataType: typeof data?.data,
            dataLength: Array.isArray(data?.data) ? data.data.length : 'not array',
            keys: data ? Object.keys(data) : 'no data'
        });

        // Handle case where data is null or undefined
        if (!data) {
            console.log('No data provided to formatFlightResults');
            return { message: 'No flight data received from API.' };
        }

        // Handle case where data.data doesn't exist or is not an array
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            console.log('No flights array found in API response');
            return { message: 'No flights found for your search criteria.' };
        }

        console.log('Processing', data.data.length, 'flight offers');

        try {
            const flights = data.data.slice(0, 5).map((offer, index) => {
                console.log(`Processing flight offer ${index + 1}:`, {
                    id: offer.id,
                    hasItineraries: !!offer.itineraries,
                    itinerariesLength: offer.itineraries?.length,
                    hasPrice: !!offer.price
                });

                const itinerary = offer.itineraries[0];
                const segment = itinerary.segments[0];
                
                const flightData = {
                    id: offer.id,
                    airline: segment.carrierCode,
                    flightNumber: `${segment.carrierCode}${segment.number}`,
                    departure: {
                        airport: segment.departure.iataCode,
                        time: new Date(segment.departure.at).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        date: new Date(segment.departure.at).toLocaleDateString('en-IN')
                    },
                    arrival: {
                        airport: segment.arrival.iataCode,
                        time: new Date(segment.arrival.at).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        date: new Date(segment.arrival.at).toLocaleDateString('en-IN')
                    },
                    duration: this.formatDuration(itinerary.duration),
                    price: `₹${Math.round(parseFloat(offer.price.total) * 83)}` // Convert to INR approximately
                };

                console.log(`Flight ${index + 1} processed:`, flightData);
                return flightData;
            });

            console.log('Successfully formatted', flights.length, 'flights');
            return { flights };

        } catch (formatError) {
            console.error('Error formatting flight results:', formatError);
            console.log('Falling back due to formatting error - returning empty flights array');
            return { 
                flights: [],
                message: 'Error processing flight data. Please try again.' 
            };
        }
    }

    // Mock data for when API is not available
    getMockFlightData(origin, destination, departureDate) {
        const mockFlights = [
            {
                id: 'mock-1',
                airline: 'AI',
                flightNumber: 'AI101',
                departure: {
                    airport: origin,
                    time: '10:30 AM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                arrival: {
                    airport: destination,
                    time: '1:45 PM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                duration: '3h 15m',
                price: '₹4,500'
            },
            {
                id: 'mock-2',
                airline: '6E',
                flightNumber: '6E234',
                departure: {
                    airport: origin,
                    time: '2:15 PM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                arrival: {
                    airport: destination,
                    time: '5:30 PM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                duration: '3h 15m',
                price: '₹3,800'
            },
            {
                id: 'mock-3',
                airline: 'SG',
                flightNumber: 'SG456',
                departure: {
                    airport: origin,
                    time: '6:00 PM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                arrival: {
                    airport: destination,
                    time: '9:15 PM',
                    date: new Date(departureDate).toLocaleDateString('en-IN')
                },
                duration: '3h 15m',
                price: '₹5,200'
            }
        ];

        return { flights: mockFlights };
    }

    getMockFlightStatus(flightNumber) {
        const mockStatuses = ['active', 'scheduled', 'landed', 'cancelled', 'delayed'];
        const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
        
        return {
            flightNumber: flightNumber,
            status: randomStatus,
            departure: {
                airport: 'Chhatrapati Shivaji International Airport (BOM)',
                scheduled: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                estimated: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            },
            arrival: {
                airport: 'Indira Gandhi International Airport (DEL)',
                scheduled: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
                estimated: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
            }
        };
    }

    formatDuration(isoDuration) {
        // Convert ISO 8601 duration (PT3H15M) to readable format (3h 15m)
        const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
        let formatted = '';
        
        if (match[1]) {
            formatted += match[1].replace('H', 'h ');
        }
        if (match[2]) {
            formatted += match[2].replace('M', 'm');
        }
        
        return formatted.trim() || isoDuration;
    }

    // Helper method to get airport codes - EXPANDED WITH MORE CITIES
    getAirportCode(cityName) {
        const airportCodes = {
            // Major Indian cities
            'mumbai': 'BOM',
            'delhi': 'DEL',
            'new delhi': 'DEL',
            'bangalore': 'BLR',
            'bengaluru': 'BLR',
            'chennai': 'MAA',
            'kolkata': 'CCU',
            'hyderabad': 'HYD',
            'pune': 'PNQ',
            'goa': 'GOI',
            'panaji': 'GOI',
            'ahmedabad': 'AMD',
            'cochin': 'COK',
            'kochi': 'COK',
            'jaipur': 'JAI',
            'lucknow': 'LKO',
            'bhubaneswar': 'BBI',
            'thiruvananthapuram': 'TRV',
            'trivandrum': 'TRV',
            'surat': 'STV',
            'vadodara': 'BDQ',
            'indore': 'IDR',
            'nagpur': 'NAG',
            'coimbatore': 'CJB',
            'vizag': 'VTZ',
            'visakhapatnam': 'VTZ',
            'patna': 'PAT',
            'bhopal': 'BHO',
            'chandigarh': 'IXC',
            'amritsar': 'ATQ',
            'guwahati': 'GAU',
            'imphal': 'IMF',
            'agartala': 'IXA',
            'raipur': 'RPR',
            'ranchi': 'IXR',
            'jammu': 'IXJ',
            'srinagar': 'SXR',
            'leh': 'IXL',
            'port blair': 'IXZ',
            
            // International cities (common destinations)
            'london': 'LHR',
            'new york': 'JFK',
            'dubai': 'DXB',
            'singapore': 'SIN',
            'bangkok': 'BKK',
            'tokyo': 'NRT',
            'paris': 'CDG',
            'amsterdam': 'AMS',
            'frankfurt': 'FRA',
            'zurich': 'ZUR',
            'hong kong': 'HKG',
            'kuala lumpur': 'KUL',
            'sydney': 'SYD',
            'melbourne': 'MEL',
            'toronto': 'YYZ',
            'vancouver': 'YVR'
        };
        
        const input = cityName.toLowerCase().trim();
        
        // First, check if it's already a valid 3-letter airport code
        if (cityName.length === 3 && /^[A-Z]{3}$/i.test(cityName)) {
            const upperCode = cityName.toUpperCase();
            console.log(`Input is already airport code: ${cityName} -> ${upperCode}`);
            return upperCode;
        }
        
        // Then check if it matches a city name in our mapping
        const code = airportCodes[input];
        if (code) {
            console.log(`Found airport code: ${cityName} -> ${code}`);
            return code;
        }
        
        // If no match found, return the original input in uppercase
        console.log(`Airport code not found for: ${cityName}, using as-is`);
        return cityName.toUpperCase();
    }
}

module.exports = { FlightService };