// Load environment variables from the .env file
require('dotenv').config();

// Import necessary classes from discord.js
const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance with the required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Log a message to the console when the bot is ready
client.once('ready', () => {
    console.log('Your bot is online!');
});

// Respond to messages
client.on('messageCreate', message => {
    // Ignore messages from the bot itself to prevent loops
    if (message.author.bot) return;

    // Check if the message content is exactly "!ping"
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
