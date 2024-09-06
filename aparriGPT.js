const express = require('express');
const { Client, Message } = require('discord.js-selfbot-v13');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Added Google Generative API

const app = express();
const client = new Client();

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

let guilds = [];
let messages = [];
let botMessages = []; // Track messages sent by the bot
const botPersonality = {
  name: 'AparriGPT',
  owner: {
    id: process.env.owner, // The Discord ID of the bot's closest user
    name: process.env.ownername,
    relationship: 'None', // Can adjust this to fit the relationship type
    personality: 'friendly and helpful but slightly sarcastic', // Description of personality
  },
};

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

// Handle incoming chat message events and integrate Google Gemini API
client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) {
    // Track the bot's own messages
    botMessages.push(message);
    return;
  }

  // Store recent messages
  messages.push({
    author: message.author.username,
    content: message.content,
    timestamp: message.createdAt,
  });

  // Keep only the last 50 messages to prevent memory overflow
  if (messages.length > 50) messages.shift();

  // Check if the bot is mentioned or if the owner speaks to it
  if (message.mentions.has(client.user) || message.author.id === botPersonality.owner.id) {
    // Check if the message contains a command to delete bot messages
    if (message.content.toLowerCase().includes('delete my messages')) {
      await deleteBotMessages(message.channel);
      return; // Exit early after handling the command
    }

    // Generate a personalized response using Google Gemini
    const response = await generateGeminiResponse(message.content, message.author.id === botPersonality.owner.id);

    // Send the response in the chat
    const botResponse = await message.channel.send(response);

    // Track the newly sent message
    botMessages.push(botResponse);
  }
});

// On bot ready, fetch guild info and start the Express server
client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);

  // Fetch and store guild info
  guilds = client.guilds.cache.map(guild => ({
    name: guild.name,
    memberCount: guild.memberCount,
    id: guild.id, // Include guild ID if needed
  }));

});



 // Start the Express server
 app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

// Function to communicate with Google Gemini API and generate responses
async function generateGeminiResponse(userMessage, isOwner) {
  const personality = isOwner
    ? botPersonality.personality + ". I'm extra nice to you!"
    : botPersonality.personality;

  try {
    const prompt = `User: ${userMessage}\nBot (personality: ${personality}):`;

    // Generate response from the model
    const result = await model.generateContent(prompt);

    // Return AI-generated response
    return result.response.text();
  } catch (error) {
    console.error('Error with Google Generative AI API:', error);
    return "Sorry, I can't think of a good response right now!";
  }
}

// Function to delete the bot's own messages from a channel
async function deleteBotMessages(channel) {
  for (const msg of botMessages) {
    try {
      await msg.delete();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }
  // Clear the list after deletion
  botMessages = [];
}

// Log in the bot using the token from environment variables
client.login(process.env.beta);
