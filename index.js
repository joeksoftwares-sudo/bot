const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

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

// Use an environment variable for the port, as provided by Render
const app = express();
const port = process.env.PORT || 3000;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// The web endpoint that the website can call to get an invite
app.get('/invite', async (req, res) => {
    // Check if a valid invite exists and is less than 10 minutes old (600,000 milliseconds)
    const now = Date.now();
    if (currentInvite && (now - inviteCreationTime < 600000)) {
        // If the invite is still valid, send the cached URL
        return res.status(200).json({ invite_url: currentInvite.url });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

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

        // Use the same caching logic for the command
        const now = Date.now();
        if (currentInvite && (now - inviteCreationTime < 600000)) {
            return message.channel.send(`Here's your one-time invite link: ${currentInvite.url}`);
        }

        try {
            const invite = await message.channel.createInvite({
                maxUses: 1,
                unique: true
            });

            currentInvite = invite;
            inviteCreationTime = now;

            message.channel.send(`Here's your one-time invite link: ${invite.url}`);
        } catch (error) {
            console.error('Error creating invite:', error);
            message.channel.send('I was unable to create an invite link.');
        }
    }
});
