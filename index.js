const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignore messages from the bot itself
    if (message.author.bot) return;

    // A simple command to get the invite link for the server
    if (message.content === '!invite') {
        // Check if the bot has the 'Create Instant Invite' permission in the channel
        if (!message.channel.permissionsFor(client.user).has('CREATE_INSTANT_INVITE')) {
            return message.reply("I don't have the permission to create invite links in this channel!");
        }

        try {
            // Create a one-time, temporary invite link
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

// Use the environment variable for your token
client.login(process.env.DISCORD_TOKEN);
