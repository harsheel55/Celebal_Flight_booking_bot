const restify = require('restify');
const { 
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConfigurationBotFrameworkAuthentication,
    TurnContext
} = require('botbuilder');
const { FlightBot } = require('./bot/flightBot');
const corsMiddleware = require('restify-cors-middleware');

require('dotenv').config();

// Create HTTP server
const server = restify.createServer();

// Configure CORS
const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['*'],
    exposeHeaders: ['*']
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

// Create adapter
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
    {},
    credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Error handling middleware
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    console.error(error);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug. Please try again later.');
};

// Initialize database
const databaseService = require('./services/databaseService');

// Create the bot
const bot = new FlightBot();

// Initialize database connection
async function initializeDatabase() {
    try {
        await databaseService.initialize();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Listen for incoming requests
server.post('/api/messages', async (req, res) => {
    try {
        await adapter.process(req, res, (context) => bot.run(context));
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Health check endpoint
server.get('/health', (req, res, next) => {
    res.send({ status: 'healthy', timestamp: new Date().toISOString() });
    return next();
});

// Start server
const port = process.env.Port || process.env.PORT || 3978;

server.listen(port, async () => {
    console.log(`\n${server.name} listening on port ${port}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo test your bot in Bot Framework Emulator, paste this URL into the endpoint URL field:');
    console.log(`http://localhost:${port}/api/messages`);
    
    // Initialize database
    await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await databaseService.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await databaseService.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});