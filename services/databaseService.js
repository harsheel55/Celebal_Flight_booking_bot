const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Create connection pool
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'flight_booking_db',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true
            });

            // Test connection
            const connection = await this.pool.getConnection();
            console.log('Database connected successfully');
            connection.release();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            
            // If database doesn't exist, try to create it
            if (error.code === 'ER_BAD_DB_ERROR') {
                await this.createDatabase();
                return await this.initialize();
            }
            
            throw error;
        }
    }

    async createDatabase() {
        try {
            const tempPool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || '',
                waitForConnections: true,
                connectionLimit: 1
            });

            const connection = await tempPool.getConnection();
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'flight_booking_db'}`);
            connection.release();
            await tempPool.end();
            
            console.log('Database created successfully');
        } catch (error) {
            console.error('Failed to create database:', error.message);
            throw error;
        }
    }

    async executeQuery(query, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error.message);
            console.error('Query:', query);
            console.error('Params:', params);
            throw error;
        }
    }

    // User operations
    async createUser(userId, conversationId, name = null, email = null, phone = null) {
        const query = `
            INSERT INTO users (user_id, conversation_id, name, email, phone) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                conversation_id = VALUES(conversation_id),
                name = COALESCE(VALUES(name), name),
                email = COALESCE(VALUES(email), email),
                phone = COALESCE(VALUES(phone), phone),
                updated_at = CURRENT_TIMESTAMP
        `;
        
        return await this.executeQuery(query, [userId, conversationId, name, email, phone]);
    }

    async getUser(userId) {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        const result = await this.executeQuery(query, [userId]);
        return result[0] || null;
    }

    async updateUser(userId, userData) {
        const { name, email, phone } = userData;
        const query = `
            UPDATE users 
            SET name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                phone = COALESCE(?, phone),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        
        return await this.executeQuery(query, [name, email, phone, userId]);
    }

    // Flight search operations
    async searchFlights(searchParams) {
        const { departure, arrival, departureDate, passengers = 1 } = searchParams;
        
        const query = `
            SELECT 
                fs.id as schedule_id,
                f.flight_number,
                a.name as airline_name,
                a.code as airline_code,
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
                (dep_airport.city LIKE ? OR dep_airport.code LIKE ?)
                AND (arr_airport.city LIKE ? OR arr_airport.code LIKE ?)
                AND fs.flight_date = ?
                AND fs.available_seats >= ?
                AND fs.status = 'scheduled'
            ORDER BY fs.price ASC, fs.departure_time ASC
            LIMIT 10
        `;
        
        const departurePattern = `%${departure}%`;
        const arrivalPattern = `%${arrival}%`;
        
        return await this.executeQuery(query, [
            departurePattern, departurePattern,
            arrivalPattern, arrivalPattern,
            departureDate,
            passengers
        ]);
    }

    async getFlightById(scheduleId) {
        const query = `
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
            WHERE fs.id = ?
        `;
        
        const result = await this.executeQuery(query, [scheduleId]);
        return result[0] || null;
    }

    // Booking operations
    async createBooking(bookingData) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const bookingReference = this.generateBookingReference();
            
            // Create booking
            const bookingQuery = `
                INSERT INTO bookings (
                    booking_reference, user_id, flight_schedule_id, 
                    passenger_count, total_price, status
                ) VALUES (?, ?, ?, ?, ?, 'pending')
            `;
            
            const [bookingResult] = await connection.execute(bookingQuery, [
                bookingReference,
                bookingData.userId,
                bookingData.flightScheduleId,
                bookingData.passengerCount,
                bookingData.totalPrice
            ]);
            
            const bookingId = bookingResult.insertId;
            
            // Update available seats
            const updateSeatsQuery = `
                UPDATE flight_schedules 
                SET available_seats = available_seats - ?
                WHERE id = ? AND available_seats >= ?
            `;
            
            const [updateResult] = await connection.execute(updateSeatsQuery, [
                bookingData.passengerCount,
                bookingData.flightScheduleId,
                bookingData.passengerCount
            ]);
            
            if (updateResult.affectedRows === 0) {
                throw new Error('Not enough seats available');
            }
            
            await connection.commit();
            
            return {
                bookingId,
                bookingReference,
                status: 'success'
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getBooking(bookingReference) {
        const query = `
            SELECT 
                b.*,
                f.flight_number,
                a.name as airline_name,
                dep_airport.city as departure_city,
                arr_airport.city as arrival_city,
                dep_airport.code as departure_code,
                arr_airport.code as arrival_code,
                fs.flight_date,
                fs.departure_time,
                fs.arrival_time
            FROM bookings b
            JOIN flight_schedules fs ON b.flight_schedule_id = fs.id
            JOIN flights f ON fs.flight_id = f.id
            JOIN airlines a ON f.airline_id = a.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE b.booking_reference = ?
        `;
        
        const result = await this.executeQuery(query, [bookingReference]);
        return result[0] || null;
    }

    async getUserBookings(userId, limit = 10) {
        const query = `
            SELECT 
                b.*,
                f.flight_number,
                a.name as airline_name,
                dep_airport.city as departure_city,
                arr_airport.city as arrival_city,
                fs.flight_date,
                fs.departure_time,
                fs.arrival_time
            FROM bookings b
            JOIN flight_schedules fs ON b.flight_schedule_id = fs.id
            JOIN flights f ON fs.flight_id = f.id
            JOIN airlines a ON f.airline_id = a.id
            JOIN airports dep_airport ON f.departure_airport_id = dep_airport.id
            JOIN airports arr_airport ON f.arrival_airport_id = arr_airport.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC
            LIMIT ?
        `;
        
        return await this.executeQuery(query, [userId, limit]);
    }

    async updateBookingStatus(bookingId, status) {
        const query = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        return await this.executeQuery(query, [status, bookingId]);
    }

    async updatePaymentStatus(bookingId, paymentStatus, transactionId = null) {
        const query = `
            UPDATE bookings 
            SET payment_status = ?, 
                payment_transaction_id = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        return await this.executeQuery(query, [paymentStatus, transactionId, bookingId]);
    }

    // Passenger operations
    async addPassenger(bookingId, passengerData) {
        const query = `
            INSERT INTO passengers (
                booking_id, first_name, last_name, date_of_birth, 
                gender, passport_number, nationality
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        return await this.executeQuery(query, [
            bookingId,
            passengerData.firstName,
            passengerData.lastName,
            passengerData.dateOfBirth,
            passengerData.gender,
            passengerData.passportNumber,
            passengerData.nationality
        ]);
    }

    async getPassengers(bookingId) {
        const query = 'SELECT * FROM passengers WHERE booking_id = ?';
        return await this.executeQuery(query, [bookingId]);
    }

    // Payment operations
    async createPaymentRecord(paymentData) {
        const query = `
            INSERT INTO payment_history (
                booking_id, transaction_id, amount, payment_method, 
                payment_status, payment_gateway, gateway_transaction_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        return await this.executeQuery(query, [
            paymentData.bookingId,
            paymentData.transactionId,
            paymentData.amount,
            paymentData.paymentMethod,
            paymentData.paymentStatus,
            paymentData.paymentGateway,
            paymentData.gatewayTransactionId
        ]);
    }

    async updatePaymentRecord(transactionId, status, failureReason = null) {
        const query = `
            UPDATE payment_history 
            SET payment_status = ?, failure_reason = ?, payment_date = CURRENT_TIMESTAMP
            WHERE transaction_id = ?
        `;
        return await this.executeQuery(query, [status, failureReason, transactionId]);
    }

    // Conversation state operations
    async saveConversationState(userId, conversationId, dialogState) {
        const query = `
            INSERT INTO conversation_state (user_id, conversation_id, dialog_state)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                dialog_state = VALUES(dialog_state),
                last_activity = CURRENT_TIMESTAMP
        `;
        
        return await this.executeQuery(query, [
            userId, 
            conversationId, 
            JSON.stringify(dialogState)
        ]);
    }

    async getConversationState(userId, conversationId) {
        const query = `
            SELECT dialog_state 
            FROM conversation_state 
            WHERE user_id = ? AND conversation_id = ?
        `;
        
        const result = await this.executeQuery(query, [userId, conversationId]);
        return result[0] ? JSON.parse(result[0].dialog_state) : null;
    }

    async clearConversationState(userId, conversationId) {
        const query = 'DELETE FROM conversation_state WHERE user_id = ? AND conversation_id = ?';
        return await this.executeQuery(query, [userId, conversationId]);
    }

    // Utility methods
    generateBookingReference() {
        return 'FL' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isInitialized = false;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.executeQuery('SELECT 1 as health');
            return result.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Database setup methods
    async setupTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE NOT NULL,
                conversation_id VARCHAR(255),
                name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id)
            )`,
            
            // Airlines table
            `CREATE TABLE IF NOT EXISTS airlines (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Airports table
            `CREATE TABLE IF NOT EXISTS airports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(10) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(255) NOT NULL,
                country VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_city (city)
            )`,
            
            // Flights table
            `CREATE TABLE IF NOT EXISTS flights (
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (airline_id) REFERENCES airlines(id),
                FOREIGN KEY (departure_airport_id) REFERENCES airports(id),
                FOREIGN KEY (arrival_airport_id) REFERENCES airports(id)
            )`,
            
            // Flight schedules table
            `CREATE TABLE IF NOT EXISTS flight_schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                flight_id INT NOT NULL,
                flight_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                arrival_time TIME NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                available_seats INT DEFAULT 0,
                status ENUM('scheduled', 'delayed', 'cancelled') DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (flight_id) REFERENCES flights(id),
                UNIQUE KEY unique_flight_date (flight_id, flight_date)
            )`,
            
            // Bookings table
            `CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_reference VARCHAR(20) UNIQUE NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                flight_schedule_id INT NOT NULL,
                passenger_count INT NOT NULL DEFAULT 1,
                total_price DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
                payment_transaction_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedules(id)
            )`,
            
            // Passengers table
            `CREATE TABLE IF NOT EXISTS passengers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                passport_number VARCHAR(50),
                nationality VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )`,
            
            // Payment history table
            `CREATE TABLE IF NOT EXISTS payment_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method ENUM('credit_card', 'debit_card') NOT NULL,
                payment_status ENUM('pending', 'completed', 'failed') NOT NULL,
                payment_gateway VARCHAR(100),
                gateway_transaction_id VARCHAR(255),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                failure_reason TEXT,
                FOREIGN KEY (booking_id) REFERENCES bookings(id)
            )`,
            
            // Conversation state table
            `CREATE TABLE IF NOT EXISTS conversation_state (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                conversation_id VARCHAR(255) NOT NULL,
                dialog_state JSON,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_conversation (user_id, conversation_id)
            )`
        ];

        for (const table of tables) {
            await this.executeQuery(table);
        }

        console.log('Database tables created successfully');
    }

    async insertSampleData() {
        try {
            // Insert airlines
            const airlines = [
                ['AA', 'American Airlines'],
                ['UA', 'United Airlines'],
                ['DL', 'Delta Air Lines'],
                ['WN', 'Southwest Airlines']
            ];

            for (const [code, name] of airlines) {
                await this.executeQuery(
                    'INSERT IGNORE INTO airlines (code, name) VALUES (?, ?)',
                    [code, name]
                );
            }

            // Insert airports
            const airports = [
                ['JFK', 'John F. Kennedy International Airport', 'New York', 'United States'],
                ['LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States'],
                ['ORD', 'Chicago O\'Hare International Airport', 'Chicago', 'United States'],
                ['MIA', 'Miami International Airport', 'Miami', 'United States']
            ];

            for (const [code, name, city, country] of airports) {
                await this.executeQuery(
                    'INSERT IGNORE INTO airports (code, name, city, country) VALUES (?, ?, ?, ?)',
                    [code, name, city, country]
                );
            }

            console.log('Sample data inserted successfully');
        } catch (error) {
            console.error('Error inserting sample data:', error.message);
        }
    }
}

module.exports = new DatabaseService();