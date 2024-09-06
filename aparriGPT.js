require('dotenv').config();
const express = require('express');
const { Client, Intents } = require('discord.js-selfbot-v13');
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

// Store interactions
let totalMessages = 0;
let totalCommandsProcessed = 0;

// Store DM transcripts
const dmTranscripts = new Map();

// Bot is ready
client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
});

// Track messages
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  // Increment total message count
  totalMessages++;

  // Log DM messages
  if (message.channel.type === 'DM') {
    const userId = message.channel.recipient.id;
    if (!dmTranscripts.has(userId)) {
      dmTranscripts.set(userId, []);
    }
    dmTranscripts.get(userId).push({
      timestamp: message.createdAt,
      content: message.content,
    });
  }

  // Check for command prefix and process simple commands
  if (message.content.startsWith('!')) {
    totalCommandsProcessed++;
    const command = message.content.slice(1).trim().split(' ')[0];
    
    // Example command handling
    if (command === 'ping') {
      message.reply('Pong!');
    } else if (command === 'status') {
      message.reply('I am alive and kicking!');
    }
  }
});

// Route to get bot status and stats
app.get('/status', (req, res) => {
  try {
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const dmCount = client.channels.cache.filter(c => c.type === 'DM').size;

    const stats = {
      username: client.user.username,
      avatarURL: client.user.avatar,
      userID: client.user.id,
      status: client.presence.status,
      guilds: guildCount,
      users: userCount,
      dms: dmCount,
      totalMessages,
      totalCommandsProcessed,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Endpoint to get details of all guilds the bot is in
app.get('/guilds', (req, res) => {
  try {
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      ownerID: guild.ownerId,
    }));
    
    res.json({ guilds });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guild details.' });
  }
});

// Endpoint to get recent direct messages
app.get('/dms', (req, res) => {
  try {
    const dmChannels = client.channels.cache
      .filter(c => c.type === 'DM')
      .map(channel => ({
        id: channel.recipient.id,
        recipient: channel.recipient.username,
        lastMessage: channel.lastMessage?.content || 'No messages',
      }));

    res.json({ dmChannels });
  } catch (error) {
    console.error('Error fetching DMs:', error);
    res.status(500).json({ error: 'Failed to fetch DMs.' });
  }
});

// Endpoint to get DM transcript for a specific user
app.get('/transcript/:userId', (req, res) => {
  const userId = req.params.userId;
  const transcript = dmTranscripts.get(userId);

  if (transcript) {
    res.json(transcript);
  } else {
    res.status(404).json({ error: 'Transcript not found.' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Log in the bot
client.login(process.env.beta);
