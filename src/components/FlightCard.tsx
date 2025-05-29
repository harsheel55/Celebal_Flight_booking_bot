
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, MapPin, DollarSign, Briefcase, ArrowRight, AlertCircle, Check } from 'lucide-react';
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

  // Use the price from the flight object if available, otherwise calculate it
  const calculatePrice = () => {
    if (flight.price !== undefined) {
      return flight.price;
    }
    
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

  // Calculate flight duration in hours and minutes
  const calculateDuration = () => {
    if (flight.duration) {
      const hours = Math.floor(flight.duration / 60);
      const minutes = flight.duration % 60;
      return `${hours}h ${minutes}m`;
    }
    
    try {
      const departureTime = new Date(flight.departure?.scheduled || '').getTime();
      const arrivalTime = new Date(flight.arrival?.scheduled || '').getTime();
      if (!isNaN(departureTime) && !isNaN(arrivalTime)) {
        const durationMs = arrivalTime - departureTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      }
    } catch (e) {
      console.error('Error calculating duration:', e);
    }
    
    return 'N/A';
  };

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
  
  // Get CSS class for flight class
  const getClassBadgeStyle = () => {
    switch (flight.class) {
      case 'first':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'business':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="p-0 hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-xl overflow-hidden shadow-md group">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        {/* Flight Info */}
        <div className="flex-1 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-sm border border-gray-100">
                <Plane className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <span className="font-bold text-lg text-gray-900">{flight.airline?.name || 'Unknown Airline'}</span>
                <div className="text-sm text-gray-500">{flight.flight?.iata || flight.flight?.icao || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              {flight.flight_status && (
                <Badge 
                  variant="outline"
                  className={flight.flight_status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                >
                  {flight.flight_status === 'active' ? 'Active' : flight.flight_status}
                </Badge>
              )}
              {flight.class && (
                <Badge className={`${getClassBadgeStyle()} font-medium`}>
                  <Briefcase className="h-3 w-3 mr-1" />
                  {flight.class.charAt(0).toUpperCase() + flight.class.slice(1)}
                </Badge>
              )}
              {flight.stops !== undefined && (
                <Badge 
                  className={flight.stops === 0 
                    ? 'bg-green-50 text-green-700 border-green-200 font-medium' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 font-medium'}
                >
                  {flight.stops === 0 ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Direct
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {flight.stops} {flight.stops === 1 ? 'Stop' : 'Stops'}
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center mt-2">
            {/* Departure */}
            <div className="flex flex-col md:col-span-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-indigo-600">Departure</span>
              </div>
              <div className="font-bold text-lg text-gray-900">{flight.departure?.airport || 'N/A'}</div>
              <div className="text-sm font-medium text-gray-700">{flight.departure?.iata || ''}</div>
              <div className="text-sm text-gray-600 mt-1">
                {formatDate(flight.departure?.scheduled)} · {formatTime(flight.departure?.scheduled)}
              </div>
              {flight.departure?.terminal && (
                <div className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-full px-2 py-0.5 inline-block">Terminal {flight.departure.terminal}</div>
              )}
            </div>

            {/* Flight Duration/Info */}
            <div className="flex flex-col items-center md:col-span-1">
              <div className="w-full h-0.5 bg-gradient-to-r from-indigo-500 to-sky-500 relative">
                {flight.stops && flight.stops > 0 ? (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 border border-gray-100 rounded-full shadow-sm">
                    <div className="text-xs font-medium text-amber-600">{flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}</div>
                  </div>
                ) : (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-sky-500 text-white p-1 rounded-full shadow-sm">
                    <Plane className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="text-sm font-bold text-indigo-600 mt-2">{calculateDuration()}</div>
            </div>

            {/* Arrival */}
            <div className="flex flex-col md:col-span-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center">
                  <MapPin className="h-3 w-3 text-sky-600" />
                </div>
                <span className="text-sm font-medium text-sky-600">Arrival</span>
              </div>
              <div className="font-bold text-lg text-gray-900">{flight.arrival?.airport || 'N/A'}</div>
              <div className="text-sm font-medium text-gray-700">{flight.arrival?.iata || ''}</div>
              <div className="text-sm text-gray-600 mt-1">
                {formatDate(flight.arrival?.scheduled)} · {formatTime(flight.arrival?.scheduled)}
              </div>
              {flight.arrival?.terminal && (
                <div className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-full px-2 py-0.5 inline-block">Terminal {flight.arrival.terminal}</div>
              )}
            </div>
          </div>
          
          {/* Layover Information */}
          {flight.layovers && flight.layovers.length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-2">Layovers:</div>
              <div className="flex flex-wrap gap-2">
                {flight.layovers.map((layover, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-gray-50 border-gray-200 py-1.5">
                    <ArrowRight className="h-3 w-3 mr-1 text-indigo-500" />
                    {layover.airport} ({Math.floor(layover.duration / 60)}h {layover.duration % 60}m)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price and Booking */}
        <div className="flex flex-col items-center gap-4 p-5 md:border-l border-gray-100 bg-gradient-to-b from-gray-50 to-white md:min-w-[200px]">
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Price</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              ${price}
            </div>
            <div className="text-xs text-gray-500 mt-1">per person</div>
            
            <div className="mt-3 space-y-1.5">
              {flight.seatsAvailable !== undefined && (
                <div className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-3 py-1 inline-block">
                  {flight.seatsAvailable} seats left
                </div>
              )}
              {flight.refundable !== undefined && (
                <div className="text-xs font-medium text-gray-600 bg-gray-50 rounded-full px-3 py-1 inline-block">
                  {flight.refundable ? '✓ Refundable' : '✗ Non-refundable'}
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleSelectFlight}
            className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 hover:from-indigo-700 hover:via-blue-700 hover:to-sky-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium py-6 group-hover:scale-105"
          >
            Select Flight
          </Button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-600">
        {flight.aircraft?.model && (
          <span className="bg-white rounded-full px-3 py-1 border border-gray-100 shadow-sm">Aircraft: {flight.aircraft.model}</span>
        )}
        {flight.airline?.iata && (
          <span className="bg-white rounded-full px-3 py-1 border border-gray-100 shadow-sm">Airline: {flight.airline.iata}</span>
        )}
        {flight.flight?.number && (
          <span className="bg-white rounded-full px-3 py-1 border border-gray-100 shadow-sm">Flight: {flight.flight.number}</span>
        )}
        {flight.departure?.gate && (
          <span className="bg-white rounded-full px-3 py-1 border border-gray-100 shadow-sm">Gate: {flight.departure.gate}</span>
        )}
      </div>
    </Card>
  );
};

export default FlightCard;
