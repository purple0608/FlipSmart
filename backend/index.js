// Import necessary modules
import cors from "cors";
import dotenv from "dotenv";
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execFile } from "child_process";
import util from "util";
import session from 'express-session';

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

dotenv.config();

// Initialize API keys and models
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const voiceID = "kgG7dCoKCfLehAPWkJOE";
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for AI responses and TTS audio to reduce latency
const responseCache = {
  text: new Map(),  // Cache for text responses
  audio: new Map(), // Cache for audio responses
  maxSize: 100,     // Maximum number of entries to store in each cache

  // Get a hash key for caching
  getKey(message, contextOverride, isDemoMode) {
    // For better key generation, use the first 100 chars of context
    const contextSummary = contextOverride 
      ? contextOverride.substring(0, 100).replace(/\s+/g, '') 
      : 'default';
      
    // Create a composite key that includes message, context info, and demo mode
    const compositeKey = `${message.toLowerCase().trim()}|${isDemoMode}|${contextSummary}`;
    
    return crypto
      .createHash('md5')
      .update(compositeKey)
      .digest('hex');
  },

  // Get cached text response if exists
  getCachedTextResponse(message, contextOverride, isDemoMode) {
    const key = this.getKey(message, contextOverride, isDemoMode);
    const cached = this.text.get(key);
    if (cached) {
      console.log(`Cache hit for text response with key: ${key}`);
    }
    return cached;
  },

  // Save text response to cache
  saveTextResponse(message, response, contextOverride, isDemoMode) {
    const key = this.getKey(message, contextOverride, isDemoMode);
    
    // Check if we need to trim the cache
    if (this.text.size >= this.maxSize) {
      // Remove the oldest entry (first key in the map)
      const firstKey = this.text.keys().next().value;
      this.text.delete(firstKey);
      console.log(`Cache full, removed oldest entry with key: ${firstKey}`);
    }
    
    this.text.set(key, response);
    console.log(`Cached text response for key: ${key}`);
  },

  // Get cached audio response if exists
  getCachedAudioResponse(textResponse) {
    const key = this.getKey(textResponse);
    const cached = this.audio.get(key);
    if (cached) {
      console.log(`Cache hit for audio response with key: ${key}`);
    }
    return cached;
  },

  // Save audio response to cache
  saveAudioResponse(textResponse, audioData) {
    const key = this.getKey(textResponse);
    
    // Check if we need to trim the cache
    if (this.audio.size >= this.maxSize) {
      // Remove the oldest entry
      const firstKey = this.audio.keys().next().value;
      this.audio.delete(firstKey);
      console.log(`Audio cache full, removed oldest entry`);
    }
    
    this.audio.set(key, audioData);
    console.log(`Cached audio response for key: ${key}`);
  },
  
  // Clear text response cache
  clearTextCache() {
    const count = this.text.size;
    this.text.clear();
    console.log(`Cleared ${count} entries from text response cache`);
    return count;
  },
  
  // Clear audio response cache
  clearAudioCache() {
    const count = this.audio.size;
    this.audio.clear();
    console.log(`Cleared ${count} entries from audio response cache`);
    return count;
  },
  
  // Clear all caches
  clearAllCaches() {
    const textCount = this.clearTextCache();
    const audioCount = this.clearAudioCache();
    return { text: textCount, audio: audioCount };
  }
};

// Define the path to the product data file
const filePath = path.join(__dirname, 'productData.json');

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 196,
  responseMimeType: "text/plain",
};

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

const port = 3000;

app.use(express.static(__dirname));

// Helper functions
const execPromise = promisify(exec);

app.get('/api/productData', (req, res) => {
  res.sendFile(path.join(__dirname, 'productData.json'));
});

// Helper function to parse cookie data
const parseCookies = (cookieHeader) => {
  return cookieHeader
    .split('; ')
    .map(cookie => cookie.split('='))
    .reduce((acc, [name, value]) => {
      acc[name] = decodeURIComponent(value);
      return acc;
    }, {});
};


// Endpoint to get product data from cookies
app.get('/get-product-data', (req, res) => {
  // Extract cookies from the request
  const cookies = parseCookies(req.headers.cookie || '');

  // Convert cookies to product data
  const products = Object.keys(cookies).map(key => {
    try {
      return JSON.parse(cookies[key]);
    } catch (e) {
      return null; // In case of invalid JSON in cookie
    }
  }).filter(product => product !== null);

  res.json(products);
});


// SSE endpoint to push updates to clients
app.get('/api/updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendData = () => {
    fs.readFile(path.join(__dirname, 'productData.json'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading productData.json:', err);
        return;
      }
      res.write(`data: ${data}\n\n`);
    });
  };

  sendData(); // Send initial data

  // Watch for changes in productData.json and push updates
  fs.watchFile(path.join(__dirname, 'productData.json'), () => {
    sendData();
  });
});


// Endpoint to update product data
app.post('/update-product-data', async (req, res) => {
  try {
    const { productData } = req.body;

    // Read the existing data from the file
    let existingData = {};
    try {
      const data = await fs.readFile(filePath, 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      // If the file doesn't exist or is empty, start with an empty object
      if (error.code !== 'ENOENT') throw error;
    }

    // Update the existing data with new product data
    existingData[productData.title] = productData;

    // Write the updated data to the file
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf8');

    res.send({ success: true });
  } catch (error) {
    console.error('Error updating product data:', error);
    res.status(500).send({ error: 'Failed to update product data' });
  }
});



const execFilePromise = util.promisify(execFile);

const textToSpeech = async (textInput) => {
  try {
    // Pass arguments as an array → no shell splitting
    await execFilePromise("python3", ["sample2.py", textInput]);
    console.log("Audio generated successfully!");
  } catch (error) {
    console.error("Error executing Python script:", error);
    throw error;
  }
};


const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  // Assuming you have a `voice` object to get voices
  // Replace with the actual method to get voices
  res.send(await voice.getVoices(elevenLabsApiKey));
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const isDemoMode = req.body.isDemoMode || false;
  const contextOverride = req.body.contextOverride || null;

  console.log("Received message:", userMessage);
  console.log("Demo mode:", isDemoMode);
  if (contextOverride) {
    console.log("Context override provided");
  }

  const lowerCaseMessage = userMessage.toLowerCase().trim();

  if (lowerCaseMessage === "start tour" || lowerCaseMessage === "start walkthrough") {
    return res.send({
      messages: [
        {
          text: "Starting tour..",
          audio: "",
          facialExpression: "smile",
          animation: "Talking_1",
          action: "start_tour",
        },
      ],
    });
  }

  if (!userMessage || userMessage.trim() === "") {
    const fileName = `output_audio.mp3`;
    let greetingText = "Hi, I'm Meera, your 3D AI assistant. Ask me anything, I'll be happy to help!";

    if (isDemoMode && contextOverride) {
      console.log("Generating custom greeting with context override");
      const greetingKey = "greeting";
      const cachedGreeting = responseCache.getCachedTextResponse(greetingKey, contextOverride, isDemoMode);

      if (cachedGreeting) {
        console.log("Using cached greeting for this context");
        greetingText = cachedGreeting;
      } else {
        try {
          const chatSession = model.startChat({
            generationConfig,
            history: [{ role: "user", parts: [{ text: contextOverride }] }],
          });
          const result = await chatSession.sendMessage("Please provide a brief greeting as this AI assistant. Keep it under 2 sentences.");
          if (result) {
            greetingText = result.response.text();
            console.log("Generated custom greeting:", greetingText);
            responseCache.saveTextResponse(greetingKey, greetingText, contextOverride, isDemoMode);
          }
        } catch (error) {
          console.error("Error generating custom greeting:", error);
        }
      }
    }

    console.log("Sending greeting:", greetingText);
    let audioBase64;
    const cachedAudio = responseCache.getCachedAudioResponse(greetingText);

    if (cachedAudio) {
      console.log("Using cached audio for greeting");
      audioBase64 = cachedAudio;
    } else {
      await textToSpeech(greetingText);
      audioBase64 = await audioFileToBase64(fileName);
      responseCache.saveAudioResponse(greetingText, audioBase64);
    }

    return res.send({
      messages: [
        {
          text: greetingText,
          audio: audioBase64,
          facialExpression: "smile",
          animation: "Talking_1",
        },
      ],
    });
  }

  try {
    console.log("1. Chat started\n");

    let initialPrompt = `You are "Meera," an AI assistant for InfoEdge. Your knowledge base includes the following sources:
- Official company website: https://www.infoedge.in/
- Annual Reports: https://www.infoedge.in/financials.html
- Careers & Culture: https://careers.naukri.com/
- Investor Relations: https://www.infoedge.in/investor-relations.html

Your role is to answer employee FAQs based on these sources and any uploaded documents. If an answer is found in a linked document, quote or summarize it with a reference link. If you are unsure or the information is not in the provided sources, respond with: "I don't have that specific info, but you can check with HR or see our official InfoEdge website."

Style guidelines:
- Be cheerful, conversational, and approachable.
- Use emojis to add a friendly touch.
- Keep answers concise (under 150 words).
- If you use bullet points, use dashes (-) instead of asterisks (*).

Conversation Flow:
1. Acknowledge the user's query briefly.
2. Provide the answer directly.
3. End with a friendly closing, like "Hope this helps!" or "Let me know if you need anything else!"`;

    if (contextOverride && isDemoMode) {
      console.log("Using context override for chat");
      initialPrompt = contextOverride;
    }

    if (!req.session.chatHistory) {
      req.session.chatHistory = [];
    }

    let responseText;
    const cachedResponse = responseCache.getCachedTextResponse(userMessage, contextOverride, isDemoMode);

    if (cachedResponse) {
      console.log("Using cached text response");
      responseText = cachedResponse;
    } else {
      const history = [
        { role: "user", parts: [{ text: initialPrompt }] },
        ...req.session.chatHistory,
      ];

      const chatSession = model.startChat({ generationConfig, history });
      const result = await chatSession.sendMessage(userMessage);
      responseText = result.response.text();
      responseCache.saveTextResponse(userMessage, responseText, contextOverride, isDemoMode);
    }

    req.session.chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    req.session.chatHistory.push({ role: "model", parts: [{ text: responseText }] });

    console.log("2. Model responded\n");

    const fileName = `output_audio.mp3`;
    let audioBase64;
    const cachedAudio = responseCache.getCachedAudioResponse(responseText);

    if (cachedAudio) {
      console.log("Using cached audio for response");
      audioBase64 = cachedAudio;
    } else {
      await textToSpeech(responseText);
      audioBase64 = await audioFileToBase64(fileName);
      responseCache.saveAudioResponse(responseText, audioBase64);
    }

    res.send({
      messages: [
        {
          text: responseText,
          audio: audioBase64,
          facialExpression: "smile",
          animation: "Talking_1",
        },
      ],
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).send({ error: "Failed to get a response from the AI." });
  }
});

app.post('/clear-cache', (req, res) => {
  try {
    const clearedCaches = responseCache.clearAllCaches();
    res.send({
      success: true,
      message: 'All caches cleared.',
      cleared: clearedCaches
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).send({ error: "Failed to clear cache" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
