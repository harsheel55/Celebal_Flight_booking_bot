const moment = require('moment');

class Booking {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.userId || data.user_id || null;
        this.fromCity = data.fromCity || data.from_city || null;
        this.toCity = data.toCity || data.to_city || null;
        this.departureDate = data.departureDate || data.departure_date || null;
        this.returnDate = data.returnDate || data.return_date || null;
        this.passengers = data.passengers || 1;
        this.flightClass = data.flightClass || data.flight_class || 'economy';
        this.flightNumber = data.flightNumber || data.flight_number || null;
        this.price = data.price || 0;
        this.status = data.status || 'pending';
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    // Validation methods
    isValid() {
        const errors = this.validate();
        return errors.length === 0;
    }

    validate() {
        const errors = [];

        // Required fields validation
        if (!this.userId) {
            errors.push('User ID is required');
        }

        if (!this.fromCity || this.fromCity.trim().length < 2) {
            errors.push('Valid departure city is required');
        }

        if (!this.toCity || this.toCity.trim().length < 2) {
            errors.push('Valid destination city is required');
        }

        if (this.fromCity && this.toCity && this.fromCity.toLowerCase() === this.toCity.toLowerCase()) {
            errors.push('Departure and destination cities cannot be the same');
        }

        if (!this.departureDate) {
            errors.push('Departure date is required');
        } else if (!this.isValidDate(this.departureDate)) {
            errors.push('Invalid departure date format');
        } else if (this.isPastDate(this.departureDate)) {
            errors.push('Departure date cannot be in the past');
        }

        if (this.returnDate) {
            if (!this.isValidDate(this.returnDate)) {
                errors.push('Invalid return date format');
            } else if (this.isPastDate(this.returnDate)) {
                errors.push('Return date cannot be in the past');
            } else if (this.departureDate && moment(this.returnDate).isBefore(moment(this.departureDate))) {
                errors.push('Return date cannot be before departure date');
            }
        }

        if (!this.passengers || this.passengers < 1 || this.passengers > 9) {
            errors.push('Number of passengers must be between 1 and 9');
        }

        if (!this.isValidFlightClass(this.flightClass)) {
            errors.push('Invalid flight class');
        }

        return errors;
    }

    // Helper validation methods
    isValidDate(dateStr) {
        return moment(dateStr, 'YYYY-MM-DD', true).isValid();
    }

    isPastDate(dateStr) {
        return moment(dateStr).isBefore(moment(), 'day');
    }

    isValidFlightClass(flightClass) {
        const validClasses = ['economy', 'premium', 'business', 'first'];
        return validClasses.includes(flightClass.toLowerCase());
    }

    // Utility methods
    isRoundTrip() {
        return this.returnDate !== null && this.returnDate !== undefined;
    }

    getTripType() {
        return this.isRoundTrip() ? 'round-trip' : 'one-way';
    }

    getDuration() {
        if (!this.isRoundTrip()) {
            return null;
        }

        const departure = moment(this.departureDate);
        const returnDate = moment(this.returnDate);
        return returnDate.diff(departure, 'days');
    }

    getFormattedDepartureDate() {
        return moment(this.departureDate).format('MMMM Do, YYYY');
    }

    getFormattedReturnDate() {
        if (!this.returnDate) return null;
        return moment(this.returnDate).format('MMMM Do, YYYY');
    }

    // Status methods
    isPending() {
        return this.status === 'pending';
    }

    isConfirmed() {
        return this.status === 'confirmed';
    }

    isCancelled() {
        return this.status === 'cancelled';
    }

    isCompleted() {
        return this.status === 'completed';
    }

    // Convert to database format
    toDatabase() {
        return {
            id: this.id,
            user_id: this.userId,
            from_city: this.fromCity,
            to_city: this.toCity,
            departure_date: this.departureDate,
            return_date: this.returnDate,
            passengers: this.passengers,
            flight_class: this.flightClass,
            flight_number: this.flightNumber,
            price: this.price,
            status: this.status,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    // Convert to API response format
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            fromCity: this.fromCity,
            toCity: this.toCity,
            departureDate: this.departureDate,
            returnDate: this.returnDate,
            passengers: this.passengers,
            flightClass: this.flightClass,
            flightNumber: this.flightNumber,
            price: this.price,
            status: this.status,
            tripType: this.getTripType(),
            duration: this.getDuration(),
            formattedDepartureDate: this.getFormattedDepartureDate(),
            formattedReturnDate: this.getFormattedReturnDate(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create booking summary for display
    getSummary() {
        let summary = `${this.fromCity} → ${this.toCity}`;
        summary += `\n📅 ${this.getFormattedDepartureDate()}`;
        
        if (this.isRoundTrip()) {
            summary += ` - ${this.getFormattedReturnDate()}`;
        }

        summary += `\n👥 ${this.passengers} passenger${this.passengers > 1 ? 's' : ''}`;
        summary += `\n✈️ ${this.flightClass.charAt(0).toUpperCase() + this.flightClass.slice(1)} class`;
        
        if (this.price > 0) {
            summary += `\n💰 $${this.price.toFixed(2)}`;
        }

        if (this.flightNumber) {
            summary += `\n🎫 Flight: ${this.flightNumber}`;
        }

        summary += `\n📋 Status: ${this.status.charAt(0).toUpperCase() + this.status.slice(1)}`;

        return summary;
    }

    // Calculate estimated price based on distance and class
    estimatePrice() {
        // This is a simplified pricing model
        const basePrice = 100;
        const classMultipliers = {
            'economy': 1,
            'premium': 1.5,
            'business': 2.5,
            'first': 4
        };

        // Simulate distance-based pricing (in real world, you'd use actual distance)
        const distance = this.getEstimatedDistance();
        const distancePrice = distance * 0.1; // $0.10 per km

        const classMultiplier = classMultipliers[this.flightClass.toLowerCase()] || 1;
        const passengerMultiplier = this.passengers;

        let totalPrice = (basePrice + distancePrice) * classMultiplier * passengerMultiplier;

        // Add return trip cost
        if (this.isRoundTrip()) {
            totalPrice *= 1.8; // Slightly less than double for round trip discount
        }

        return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
    }

    // Estimate distance between cities (mock implementation)
    getEstimatedDistance() {
        // This is a very simplified mock - in reality you'd use a proper distance calculation
        const cityDistances = {
            'new york-los angeles': 4000,
            'london-paris': 350,
            'mumbai-delhi': 1150,
            'tokyo-osaka': 400,
            'sydney-melbourne': 700
        };

        const route = `${this.fromCity.toLowerCase()}-${this.toCity.toLowerCase()}`;
        const reverseRoute = `${this.toCity.toLowerCase()}-${this.fromCity.toLowerCase()}`;

        return cityDistances[route] || cityDistances[reverseRoute] || 1000; // Default 1000km
    }

    // Static factory methods
    static fromDatabaseRow(row) {
        return new Booking(row);
    }

    static createEmpty(userId) {
        return new Booking({ userId });
    }
}

module.exports = Booking;