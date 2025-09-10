const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const rateLimit = require('express-rate-limit');

// Create variables to store the current invite and its creation timestamp.
let currentInvite = null;
let inviteCreationTime = 0;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const app = express();
const port = process.env.PORT || 3000;

// Set up the rate limiter middleware to protect against DDoS
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per `windowMs`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: "Too many requests from this IP, please try again after a minute."
    }
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Apply the rate limiter to the invite endpoint
app.get('/invite', apiLimiter, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Check if a valid invite exists and is less than 10 seconds old (10,000 milliseconds)
    const now = Date.now();
    if (currentInvite && (now - inviteCreationTime < 10000)) {
        // If the invite is still valid, send the cached URL
        return res.status(200).json({ invite_url: currentInvite.url });
    }

    const channel = client.channels.cache.find(c => c.type === 0 && c.guild.id === process.env.GUILD_ID && c.permissionsFor(client.user).has('CREATE_INSTANT_INVITE'));

    if (!channel) {
        return res.status(500).json({ error: 'Could not find a channel to create an invite in.' });
    }

    try {
        const invite = await channel.createInvite({
            maxUses: 1, // Only allows one use
            unique: true,
            reason: "Website-generated invite."
        });

        // Cache the newly created invite and the current time
        currentInvite = invite;
        inviteCreationTime = now;

        res.status(200).json({ invite_url: invite.url });
    } catch (error) {
        console.error('Error creating invite:', error);
        res.status(500).json({ error: 'I was unable to create an invite link.' });
    }
});

client.login(process.env.DISCORD_TOKEN);
app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});

// A simple command to get the invite link for the server
client.on('messageCreate', async (message) => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;
    if (message.content === '!invite') {
        if (!message.channel.permissionsFor(client.user).has('CREATE_INSTANT_INVITE')) {
            return message.reply("I don't have the permission to create invite links in this channel!");
        }

        try {
            const invite = await message.channel.createInvite({
                maxUses: 1,
                unique: true
            });

            message.channel.send(`Here's your one-time invite link: ${invite.url}`);
        } catch (error) {
            console.error('Error creating invite:', error);
            message.channel.send('I was unable to create an invite link.');
        }
    }
});
