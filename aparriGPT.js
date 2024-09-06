require('dotenv').config();
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const client = new Client();
const app = express();
const PORT = process.env.PORT || 3000;

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
});

// Define a route to get bot status and stats
app.get('/status', (req, res) => {
  try {
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const dmCount = client.channels.cache.filter(c => c.type === 'DM').size;

    // Create a response object with the stats
    const stats = {
      username: client.user.username,
      status: client.presence.status,
      guilds: guildCount,
      users: userCount,
      dms: dmCount,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

client.login(process.env.beta);
