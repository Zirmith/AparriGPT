const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
require('dotenv').config();

const app = express();
const client = new Client();

let guilds = [];
let messages = [];

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// API route for bot status
app.get('/api/status', (req, res) => {
  res.json({
    status: `${client.user ? client.user.username : 'AparriGPT'} is online!`,
    username: client.user ? client.user.username : 'Loading...',
    id: client.user ? client.user.id : null,  // Send user ID to the front-end
    avatar: client.user ? client.user.avatar : null,
    guilds: guilds,
    recentMessages: messages.slice(-10) // Show last 10 messages
  });
});

// Handle incoming chat message events
client.on('messageCreate', (message) => {
  if (message.author.id === client.user.id) return;  // Ignore bot's own messages

  // Store recent messages
  messages.push({
    author: message.author.username,
    content: message.content,
    timestamp: message.createdAt
  });

  // Keep only the last 50 messages to prevent memory overflow
  if (messages.length > 50) messages.shift();
});

// On bot ready, fetch guild info and start the Express server
client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  // Fetch and store guild info
  guilds = client.guilds.cache.map(guild => ({
    name: guild.name,
    memberCount: guild.memberCount,
    id: guild.id // Include guild ID if needed
  }));

  // Start the Express server
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
});

// Log in the bot using the token from environment variables
client.login(process.env.beta);
