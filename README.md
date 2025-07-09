# Flight Ticket Booking Bot 🛫

An intelligent conversational bot that streamlines the flight booking process, allowing users to search for flights, compare prices, and book tickets directly through a natural language chat interface. Built using Microsoft Bot Framework and tested locally with Bot Framework Emulator.

**Internship Project - Celebal Technologies**

## 🏢 About This Project

This project was developed during my internship at **Celebal Technologies**, a leading technology company specializing in data analytics, artificial intelligence, and digital transformation solutions. The flight booking bot represents a practical application of conversational AI in the travel industry, demonstrating modern bot development practices using Microsoft's enterprise-grade Bot Framework.

## 📚 Internship Learning Journey

This flight booking bot project is the culmination of an intensive 8-week Node.js learning program at Celebal Technologies. Each week built upon the previous, creating a comprehensive foundation for enterprise-level application development:

### Week 1: Node.js Fundamentals
- **What is Node.js?** - Understanding the runtime environment
- **Installation and Setup** - Environment configuration
- **Your First Node.js Application** - Basic application structure
- **Node.js Architecture** - Event-driven, non-blocking I/O
- **The Node.js Ecosystem** - NPM and package management
- **Node.js REPL** - Interactive development environment
- **Modules in Node.js** - CommonJS and ES6 modules
- **Creating a Simple Server** - HTTP server basics
- **Understanding package.json** - Project configuration

### Week 2: Core Modules & Package Management
- **File System Module** - File operations and management
- **HTTP Module** - Building HTTP servers and clients
- **Events Module** - Event-driven programming
- **Util Module** - Utility functions and debugging
- **Path Module** - File path manipulation
- **NPM Basics and Installing Packages** - Package management
- **Creating a Package** - Module development
- **Version Management** - Semantic versioning
- **NPM Scripts** - Automation and build processes

### Week 3: Asynchronous Programming
- **Callback Functions** - Handling asynchronous operations
- **Handling Errors in Callbacks** - Error-first callback pattern
- **Promises** - Promise-based asynchronous programming
- **Async/Await** - Modern asynchronous syntax
- **Event Loop** - Understanding Node.js concurrency
- **Handling Asynchronous Operations** - Best practices
- **File System with Promises** - Promise-based file operations
- **Promise Chaining** - Sequential asynchronous operations
- **Error Handling in Async/Await** - Try-catch patterns

### Week 4: Express.js Framework
- **What is Express.js?** - Web application framework
- **Setting Up an Express Server** - Server configuration
- **Routing and Express Router** - URL routing patterns
- **Middleware** - Request processing pipeline
- **Handling Requests and Responses** - HTTP request lifecycle
- **Query Parameters and URL Parameters** - Parameter handling
- **Static Files** - Serving static assets
- **Template Engines** - Dynamic content rendering
- **Express Router** - Modular routing

### Week 5: Database Integration
- **Introduction to Databases** - Database fundamentals
- **Using MongoDB with Node.js and CRUD Operations** - NoSQL database operations
- **Relational Databases and Node.js** - SQL database integration
- **Database Schema Design** - Data modeling
- **Data Validation and Sanitization** - Input validation
- **Connecting to a Database** - Database connectivity
- **Migrations and Seeding** - Database versioning
- **Advanced Query Techniques** - Complex queries and optimization

### Week 6: RESTful API Development
- **Introduction to REST** - REST architectural principles
- **Setting Up a REST API** - API structure and design
- **Middleware for REST APIs** - API-specific middleware
- **Authentication in APIs** - API security
- **Error Handling in APIs** - Structured error responses
- **Documenting APIs** - API documentation practices
- **Testing APIs** - API testing strategies
- **Versioning APIs** - API version management

### Week 7: Authentication & Security
- **User Authentication** - User login systems
- **Hashing and Salting Passwords** - Password security
- **JSON Web Tokens (JWT)** - Token-based authentication
- **OAuth and Social Login** - Third-party authentication
- **Session Management** - User session handling
- **HTTPS and SSL/TLS** - Secure communication
- **Security Best Practices** - Application security
- **Preventing Common Attacks** - Security vulnerabilities
- **Rate Limiting and Throttling** - API protection
- **Dependency Security** - Package security

### Week 8: Advanced Express.js
- **Advanced Routing** - Complex routing patterns
- **Error Handling in Express** - Centralized error handling
- **Performance Optimization** - Application performance
- **Middleware Stacks** - Middleware composition
- **Express and WebSocket Integration** - Real-time communication
- **File Uploads** - Handling file uploads
- **Server** - Server configuration
- **Express App Structure** - Application architecture

## 🎯 How This Learning Journey Applies to the Flight Booking Bot

This comprehensive learning path directly contributed to the flight booking bot's architecture and features:

- **Weeks 1-2**: Foundation for the bot's Node.js server and core module usage
- **Week 3**: Asynchronous flight API calls and promise-based operations
- **Week 4**: Express.js server setup for bot webhook endpoints
- **Week 5**: MySQL database integration for storing user data and bookings
- **Week 6**: RESTful API structure for flight search and booking operations
- **Week 7**: JWT authentication and security implementation
- **Week 8**: Advanced Express features for bot performance and file handling

## 🚀 Project Overview

This intelligent bot transforms the flight booking experience by enabling users to interact in natural language to specify their travel needs. Simply tell the bot your desired travel dates and destinations, and it presents you with the best options from various airlines, complete with real-time pricing and availability.

## ✨ Key Features

### 🗣️ Conversational Search
- **Natural Language Processing**: Interact with the bot in a conversational way to specify travel needs
- **Intelligent Intent Recognition**: Understands origin, destination, dates, number of travelers, and preferences
- **Context-Aware Responses**: Maintains conversation context throughout the booking process

### 🔍 Real-time Flight Search
- **Live Flight Data**: Access up-to-date flight information from multiple airlines
- **Real-time Pricing**: Get current prices and availability across different carriers
- **Multi-airline Integration**: Search across various airline APIs simultaneously

### 💰 Price Comparison & Filtering
- **Fare Comparison**: Compare prices across different airlines and travel classes
- **Advanced Filtering**: Filter results by price, airline, travel duration, layovers, and preferences
- **Best Value Recommendations**: AI-powered suggestions for optimal value propositions

### 🔒 Secure Booking & Management
- **Direct Booking**: Complete flight reservations directly through the chat interface
- **Secure Payment Gateway**: PCI-compliant payment processing
- **Instant Confirmation**: Receive booking confirmations and e-tickets immediately
- **Itinerary Management**: View and manage bookings within the chat interface

### 🌐 Multilingual Support
- **Multiple Languages**: Support for various languages for global accessibility
- **Localized Experience**: Region-specific formatting and currency support

## 🛠️ Technologies & Framework

### Core Technologies
- **Microsoft Bot Framework SDK**: Enterprise-grade conversational AI platform
- **Node.js**: Backend runtime environment with Express.js framework
- **MySQL**: Relational database for storing booking data and user information
- **Bot Framework Emulator**: Local testing and development environment

### Development Stack
- **Backend**: Node.js with Express.js framework
- **Database**: MySQL for data persistence
- **Bot Framework**: Microsoft Bot Framework SDK
- **Testing**: Microsoft Bot Framework Emulator (local development)
- **APIs**: Flight booking and airline integration APIs

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **Microsoft Bot Framework Emulator** (latest version)
- **Amadeus API** keys (for comprehensive flight data)
- **AviationStack API** key (for additional flight information)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/harsheel55/Celebal_Flight_booking_bot.git
cd Celebal_Flight_booking_bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```sql
-- Create MySQL database
CREATE DATABASE flight_booking_bot;

-- Use the database
USE flight_booking_bot;

-- Create necessary tables (add your table schemas here)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    flight_details JSON,
    booking_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3978
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=flight_booking_bot

# Flight API Keys
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
AVIATIONSTACK_API_KEY=your_aviationstack_api_key

# Bot Framework Configuration
BOT_ID=your_bot_id
BOT_PASSWORD=your_bot_password
```

### 5. Start the Bot
```bash
npm start
```

## 🧪 Testing with Bot Framework Emulator

### 1. Download Bot Framework Emulator
- Download from: https://github.com/Microsoft/BotFramework-Emulator/releases
- Install the latest version for your operating system

### 2. Connect to Your Bot
1. Open Bot Framework Emulator
2. Click "Open Bot"
3. Enter your bot URL: `http://localhost:3978/api/messages`
4. Enter your Bot ID and Password (if configured)
5. Click "Connect"

### 3. Test Conversations
Try these sample conversations:

```
User: "Hi, I want to book a flight"
Bot: "Hello! I'd be happy to help you book a flight. Where would you like to fly from?"

User: "I want to go from Mumbai to Delhi"
Bot: "Great! When would you like to travel from Mumbai to Delhi?"

User: "Tomorrow morning"
Bot: "Perfect! How many passengers will be traveling?"

User: "2 passengers"
Bot: "Searching for flights from Mumbai to Delhi for 2 passengers departing tomorrow morning..."
```

## 🏗️ Project Structure

```
Celebal_Flight_booking_bot/
├── src/
│   ├── bots/
│   │   └── flightBookingBot.js
│   ├── dialogs/
│   │   ├── bookingDialog.js
│   │   ├── searchDialog.js
│   │   └── mainDialog.js
│   ├── services/
│   │   ├── flightService.js
│   │   └── databaseService.js
│   ├── models/
│   │   ├── booking.js
│   │   └── user.js
│   └── utils/
│       └── helpers.js
├── database/
│   └── schema.sql
├── config/
│   └── database.js
├── tests/
├── .env
├── package.json
├── server.js
└── README.md
```

## 🔌 API Integration

### API Integration

### Amadeus Flight API
```javascript
// Example Amadeus API integration
const amadeus = require('amadeus');

const client = amadeus({
    clientId: process.env.AMADEUS_API_KEY,
    clientSecret: process.env.AMADEUS_API_SECRET
});

const searchFlights = async (origin, destination, departureDate, passengers) => {
    try {
        const response = await client.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: passengers
        });
        return response.data;
    } catch (error) {
        console.error('Amadeus API Error:', error);
        throw error;
    }
};
```

### AviationStack API
```javascript
// Example AviationStack API integration
const axios = require('axios');

const getFlightStatus = async (flightNumber) => {
    try {
        const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
            params: {
                access_key: process.env.AVIATIONSTACK_API_KEY,
                flight_iata: flightNumber
            }
        });
        return response.data;
    } catch (error) {
        console.error('AviationStack API Error:', error);
        throw error;
    }
};
```

### Database Operations
```javascript
// MySQL integration example
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});
```

## 📊 Bot Conversation Flow

1. **Greeting**: Bot welcomes user and asks for assistance
2. **Travel Details**: Collects origin, destination, dates, passengers
3. **Flight Search**: Searches and displays available flights
4. **Filtering**: Allows users to filter results by preferences
5. **Selection**: User selects preferred flight option
6. **Booking**: Processes booking with payment details
7. **Confirmation**: Provides booking confirmation and e-ticket

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing
```bash
npm test
```

## 🛡️ Security Features

- Input validation and sanitization
- SQL injection prevention
- Secure payment processing
- User authentication and authorization
- Data encryption for sensitive information

## 📱 Supported Platforms

- **Local Development**: Bot Framework Emulator
- **Web Chat**: Can be integrated into websites
- **Microsoft Teams**: Ready for Teams integration
- **Slack**: Can be deployed to Slack workspaces
- **Facebook Messenger**: Supports Messenger integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources & Documentation

### Official Documentation
- [Microsoft Bot Framework SDK](https://github.com/microsoft/botframework-sdk)
- [MySQL Documentation](https://www.w3schools.com/MySQL/default.asp)
- [Node.js API Documentation](https://nodejs.org/docs/latest/api)
- [Express.js Tutorial](https://www.tutorialspoint.com/nodejs/nodejs_express_framework.htm)

### Tools
- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases)

## 🐛 Troubleshooting

### Common Issues
1. **Bot not responding**: Check if the bot server is running on the correct port
2. **Database connection errors**: Verify MySQL credentials and database existence
3. **API integration issues**: Ensure flight API keys are valid and configured

### Support
- Create an issue on GitHub for bugs
- Check the Bot Framework documentation for framework-specific issues
- Review MySQL connection settings for database-related problems

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Harsheel**
- GitHub: [@harsheel55](https://github.com/harsheel55)
- LinkedIn: [[Harsheel Kasodariya](https://www.linkedin.com/in/harsheel-kasodariya-22a31b253/)]

## 🙏 Acknowledgments

- **Celebal Technologies** for providing this internship opportunity and comprehensive project requirements
- **Microsoft** for the Bot Framework SDK and Emulator tools
- **Amadeus** and **AviationStack** for reliable flight data APIs
- **Open source community** for Node.js and MySQL support
- **Mentors and colleagues** at Celebal Technologies for guidance and support

## 🏢 About Celebal Technologies

Celebal Technologies is a leading technology company that specializes in data analytics, artificial intelligence, and digital transformation solutions. This internship project demonstrates their commitment to practical learning and real-world application development in emerging technologies.

---

**Internship Project - Celebal Technologies**  
**Built with ❤️ using Microsoft Bot Framework**
