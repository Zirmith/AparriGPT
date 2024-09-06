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
    status: 'AparriGPT is online!',
    username: client.user ? client.user.username : 'Loading...',
    id: client.user ? client.user.id : null,
    avatar: client.user ? client.user.avatar : null,
    guilds: guilds,
    recentMessages: messages.slice(-10) // Show last 10 messages
  });
});

// Handle chat message interactions
client.on('messageCreate', (message) => {
  if (message.author.id === client.user.id) {
    return; // Ignore selfbot messages
  }

  // Store recent messages
  messages.push({
    author: message.author.username,
    content: message.content,
    timestamp: message.createdAt
  });

  // Keep only the last 50 messages to prevent memory overflow
  if (messages.length > 50) messages.shift();
});

// On bot ready, fetch guild info and start Express server
client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  // Fetch and store guild info
  guilds = client.guilds.cache.map(guild => ({
    name: guild.name,
    memberCount: guild.memberCount,
    id: guild.id
  }));

  // Start Express server
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
});

client.login(process.env.beta);
