
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, MapPin, DollarSign } from 'lucide-react';
import { Flight } from '@/services/flightService';
import { useToast } from '@/hooks/use-toast';

interface FlightCardProps {
  flight: Flight;
  onSelectFlight?: (flight: Flight, price: number) => void;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelectFlight }) => {
  const { toast } = useToast();

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Calculate realistic pricing based on route and airline
  const calculatePrice = () => {
    const basePrice = 200;
    const airlineMultiplier = getAirlineMultiplier(flight.airline?.name || '');
    const routeMultiplier = getRouteMultiplier(flight.departure?.iata || '', flight.arrival?.iata || '');
    return Math.floor((basePrice + Math.random() * 800) * airlineMultiplier * routeMultiplier);
  };

  const getAirlineMultiplier = (airlineName: string) => {
    const premiumAirlines = ['Emirates', 'Singapore Airlines', 'Lufthansa', 'British Airways'];
    const budgetAirlines = ['IndiGo', 'Air India Express', 'JetBlue'];
    
    if (premiumAirlines.some(airline => airlineName.includes(airline))) return 1.5;
    if (budgetAirlines.some(airline => airlineName.includes(airline))) return 0.8;
    return 1.0;
  };

  const getRouteMultiplier = (from: string, to: string) => {
    const longHaulRoutes = ['JFK-LHR', 'LAX-NRT', 'SYD-LAX', 'DXB-JFK'];
    const route = `${from}-${to}`;
    if (longHaulRoutes.includes(route) || longHaulRoutes.includes(`${to}-${from}`)) return 1.8;
    return 1.0;
  };

  const price = calculatePrice();

  const handleSelectFlight = () => {
    if (onSelectFlight) {
      onSelectFlight(flight, price);
    } else {
      toast({
        title: "Flight Selected!",
        description: `You selected ${flight.airline?.name} flight ${flight.flight?.iata} for $${price}. Proceeding to booking...`,
      });
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Flight Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-lg">{flight.airline?.name || 'Unknown Airline'}</span>
            </div>
            {flight.flight_status && (
              <Badge 
                variant={flight.flight_status === 'active' ? 'default' : 'secondary'}
                className={flight.flight_status === 'active' ? 'bg-green-100 text-green-800' : ''}
              >
                {flight.flight_status}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Departure */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">From</span>
              </div>
              <div className="font-semibold text-lg">{flight.departure?.airport || 'N/A'}</div>
              <div className="text-sm text-gray-600">{flight.departure?.iata || ''}</div>
              <div className="text-sm text-gray-500">
                {formatDate(flight.departure?.scheduled)} at {formatTime(flight.departure?.scheduled)}
              </div>
            </div>

            {/* Flight Duration/Info */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Flight</span>
              </div>
              <div className="font-semibold">{flight.flight?.iata || flight.flight?.icao || 'N/A'}</div>
              <div className="w-full h-px bg-gray-300 my-2 relative">
                <Plane className="h-4 w-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
              </div>
            </div>

            {/* Arrival */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">To</span>
              </div>
              <div className="font-semibold text-lg">{flight.arrival?.airport || 'N/A'}</div>
              <div className="text-sm text-gray-600">{flight.arrival?.iata || ''}</div>
              <div className="text-sm text-gray-500">
                {formatDate(flight.arrival?.scheduled)} at {formatTime(flight.arrival?.scheduled)}
              </div>
            </div>
          </div>
        </div>

        {/* Price and Booking */}
        <div className="flex flex-col items-center gap-3 md:border-l md:pl-6">
          <div className="text-center">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">Price from</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              ${price}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
          
          <Button 
            onClick={handleSelectFlight}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 transition-all duration-200"
          >
            Select Flight
          </Button>
        </div>
      </div>

      {/* Additional Info */}
      {(flight.aircraft?.model || flight.airline?.iata) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {flight.aircraft?.model && (
              <span>Aircraft: {flight.aircraft.model}</span>
            )}
            {flight.airline?.iata && (
              <span>Airline Code: {flight.airline.iata}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default FlightCard;
