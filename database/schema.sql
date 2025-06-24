-- Flight Booking Bot Database Schema
-- This schema supports the flight booking bot with tables for flights, bookings, and users

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS flight_booking_db;
USE flight_booking_db;

-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Bot framework user ID
    conversation_id VARCHAR(255), -- Bot framework conversation ID
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_conversation_id (conversation_id)
);

-- Airlines table
CREATE TABLE IF NOT EXISTS airlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airports table
CREATE TABLE IF NOT EXISTS airports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_city (city),
    INDEX idx_code (code)
);

-- Flights table
CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    airline_id INT NOT NULL,
    departure_airport_id INT NOT NULL,
    arrival_airport_id INT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    available_seats INT DEFAULT 0,
    aircraft_type VARCHAR(100),
    status ENUM('scheduled', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (airline_id) REFERENCES airlines(id),
    FOREIGN KEY (departure_airport_id) REFERENCES airports(id),
    FOREIGN KEY (arrival_airport_id) REFERENCES airports(id),
    
    INDEX idx_flight_number (flight_number),
    INDEX idx_departure_airport (departure_airport_id),
    INDEX idx_arrival_airport (arrival_airport_id),
    INDEX idx_departure_time (departure_time),
    INDEX idx_status (status)
);

-- Flight schedules table (for recurring flights)
CREATE TABLE IF NOT EXISTS flight_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    flight_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INT DEFAULT 0,
    status ENUM('scheduled', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    UNIQUE KEY unique_flight_date (flight_id, flight_date),
    
    INDEX idx_flight_date (flight_date),
    INDEX idx_departure_time (departure_time),
    INDEX idx_price (price)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    flight_schedule_id INT NOT NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_transaction_id VARCHAR(255),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedules(id),
    
    INDEX idx_booking_reference (booking_reference),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_date (booking_date)
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    passport_number VARCHAR(50),
    nationality VARCHAR(100),
    seat_number VARCHAR(10),
    meal_preference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_passport_number (passport_number)
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL,
    payment_gateway VARCHAR(100),
    gateway_transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failure_reason TEXT,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_date (payment_date)
);

-- Bot conversation state table
CREATE TABLE IF NOT EXISTS conversation_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    dialog_state JSON,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_conversation (user_id, conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
);

-- Insert sample airlines
INSERT INTO airlines (code, name) VALUES
('AA', 'American Airlines'),
('UA', 'United Airlines'),
('DL', 'Delta Air Lines'),
('WN', 'Southwest Airlines'),
('B6', 'JetBlue Airways'),
('AS', 'Alaska Airlines'),
('F9', 'Frontier Airlines'),
('NK', 'Spirit Airlines');

-- Insert sample airports
INSERT INTO airports (code, name, city, country, timezone) VALUES
('JFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'America/New_York'),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'America/Los_Angeles'),
('ORD', 'Chicago O\'Hare International Airport', 'Chicago', 'United States', 'America/Chicago'),
('MIA', 'Miami International Airport', 'Miami', 'United States', 'America/New_York'),
('DFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'United States', 'America/Chicago'),
('DEN', 'Denver International Airport', 'Denver', 'United States', 'America/Denver'),
('SEA', 'Seattle-Tacoma International Airport', 'Seattle', 'United States', 'America/Los_Angeles'),
('ATL', 'Hartsfield-Jackson Atlanta International Airport', 'Atlanta', 'United States', 'America/New_York'),
('BOS', 'Logan International Airport', 'Boston', 'United States', 'America/New_York'),
('SFO', 'San Francisco International Airport', 'San Francisco', 'United States', 'America/Los_Angeles');

-- Insert sample flights
INSERT INTO flights (flight_number, airline_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, duration_minutes, base_price, available_seats, aircraft_type) VALUES
('AA101', 1, 1, 2, '08:00:00', '11:30:00', 330, 299.99, 150, 'Boeing 737-800'),
('UA202', 2, 2, 1, '14:00:00', '22:15:00', 315, 279.99, 180, 'Airbus A320'),
('DL303', 3, 3, 4, '10:30:00', '14:45:00', 255, 189.99, 120, 'Boeing 737-900'),
('WN404', 4, 4, 5, '16:00:00', '18:30:00', 150, 159.99, 143, 'Boeing 737-700'),
('B6505', 5, 5, 6, '09:15:00', '11:45:00', 150, 149.99, 162, 'Airbus A320'),
('AS606', 6, 6, 7, '13:30:00', '16:00:00', 150, 169.99, 76, 'Boeing 737-800'),
('F9707', 7, 7, 8, '07:45:00', '12:30:00', 285, 129.99, 186, 'Airbus A320neo'),
('NK808', 8, 8, 9, '19:00:00', '21:45:00', 165, 99.99, 178, 'Airbus A319');

-- Create stored procedures for common operations

DELIMITER //

-- Procedure to search flights
CREATE PROCEDURE SearchFlights(
    IN p_departure_city VARCHAR(255),
    IN p_arrival_city VARCHAR(255),
    IN p_flight_date DATE,
    IN p_passenger_count INT
)
BEGIN
    SELECT 
        fs.id as schedule_id,
        f.flight_number,
        a.name as airline_name,
        dep_airport.city as departure_city,
        arr_airport.city as arrival_city,
        dep_airport.code as departure_code,
        arr_airport.code as arrival_code,
        fs.flight_date,
        fs.departure_time,
        fs.arrival_time,
        fs.price,
        fs.available_seats,
        f.duration_minutes,
        f.aircraft_type
    FROM flight_schedules fs
    JOIN flights f ON fs.flight_id = f.id
    JOIN airlines a ON f.airline_id = a.id
    JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
    JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
    WHERE 
        dep_airport.city LIKE CONCAT('%', p_departure_city, '%')
        AND arr_airport.city LIKE CONCAT('%', p_arrival_city, '%')
        AND fs.flight_date = p_flight_date
        AND fs.available_seats >= p_passenger_count
        AND fs.status = 'scheduled'
    ORDER BY fs.price ASC, fs.departure_time ASC;
END //

-- Procedure to create a booking
CREATE PROCEDURE CreateBooking(
    IN p_booking_reference VARCHAR(20),
    IN p_user_id VARCHAR(255),
    IN p_flight_schedule_id INT,
    IN p_passenger_count INT,
    IN p_total_price DECIMAL(10, 2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO bookings (
        booking_reference, 
        user_id, 
        flight_schedule_id, 
        passenger_count, 
        total_price
    ) VALUES (
        p_booking_reference, 
        p_user_id, 
        p_flight_schedule_id, 
        p_passenger_count, 
        p_total_price
    );
    
    UPDATE flight_schedules 
    SET available_seats = available_seats - p_passenger_count
    WHERE id = p_flight_schedule_id;
    
    COMMIT;
    
    SELECT LAST_INSERT_ID() as booking_id;
END //

DELIMITER ;

-- Create views for common queries

-- View for flight search results
CREATE VIEW flight_search_view AS
SELECT 
    fs.id as schedule_id,
    f.flight_number,
    a.name as airline_name,
    a.code as airline_code,
    dep_airport.city as departure_city,
    arr_airport.city as arrival_city,
    dep_airport.code as departure_code,
    arr_airport.code as arrival_code,
    dep_airport.name as departure_airport,
    arr_airport.name as arrival_airport,
    fs.flight_date,
    fs.departure_time,
    fs.arrival_time,
    fs.price,
    fs.available_seats,
    f.duration_minutes,
    f.aircraft_type,
    fs.status
FROM flight_schedules fs
JOIN flights f ON fs.flight_id = f.id
JOIN airlines a ON f.airline_id = a.id
JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id;

-- View for booking details
CREATE VIEW booking_details_view AS
SELECT 
    b.id as booking_id,
    b.booking_reference,
    b.user_id,
    b.passenger_count,
    b.total_price,
    b.status as booking_status,
    b.payment_status,
    b.booking_date,
    f.flight_number,
    a.name as airline_name,
    dep_airport.city as departure_city,
    arr_airport.city as arrival_city,
    dep_airport.code as departure_code,
    arr_airport.code as arrival_code,
    fs.flight_date,
    fs.departure_time,
    fs.arrival_time,
    f.aircraft_type
FROM bookings b
JOIN flight_schedules fs ON b.flight_schedule_id = fs.id
JOIN flights f ON fs.flight_id = f.id
JOIN airlines a ON f.airline_id = a.id
JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id;

-- Indexes for better performance
CREATE INDEX idx_flight_schedules_date_status ON flight_schedules(flight_date, status);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_passengers_booking ON passengers(booking_id);
CREATE INDEX idx_payment_history_booking ON payment_history(booking_id);

-- Sample flight schedules for the next 30 days
INSERT INTO flight_schedules (flight_id, flight_date, departure_time, arrival_time, price, available_seats)
SELECT 
    f.id,
    CURDATE() + INTERVAL seq.seq DAY,
    f.departure_time,
    f.arrival_time,
    f.base_price + (RAND() * 100 - 50), -- Add some price variation
    f.available_seats
FROM flights f
CROSS JOIN (
    SELECT 0 as seq UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
    SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION
    SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION
    SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION
    SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION
    SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
) seq;

-- Create triggers for audit trail
DELIMITER //

CREATE TRIGGER booking_status_update
    AFTER UPDATE ON bookings
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO booking_audit (
            booking_id, 
            old_status, 
            new_status, 
            changed_at
        ) VALUES (
            NEW.id, 
            OLD.status, 
            NEW.status, 
            NOW()
        );
    END IF;
END //

DELIMITER ;

-- Audit table for booking changes
CREATE TABLE IF NOT EXISTS booking_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_changed_at (changed_at)
);