// Import necessary modules
import cors from "cors";
import dotenv from "dotenv";
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

dotenv.config();

// Initialize API keys and models
const apiKey = "AIzaSyCmxupyVwQeUMFYM-ho2F5dQ9-gBKSEc2w"; // Replace with your actual API key
const elevenLabsApiKey = "sk_799b23489515a01b5c5325e5d67a23a460a1a61537cae4f6";
const voiceID = "kgG7dCoKCfLehAPWkJOE";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 512,
  responseMimeType: "text/plain",
};

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// Helper functions
const execPromise = promisify(exec);

const textToSpeech = async (textInput) => {
  try {
    // Call the Python script to generate audio
    await execPromise(
      `python sample.py "${textInput}"`
    );
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

  if (!userMessage) {
    return res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
  }

  if (!elevenLabsApiKey || !apiKey) {
    return res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Angry",
        },
        {
          text: "You don't want to ruin Wawa Sensei with a crazy bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Laughing",
        },
      ],
    });
  }

  try {
    console.log("1. Chat started\n");

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: "Hi gemini !! How are you ? You are a seller on Flipkart. Kindly act like a seller and recommend products to me based on my preferences and prompts. Generate responses in a happy tone, along with emojis and exclamations!",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hey there! 👋  So glad you stopped by! 🤩  Tell me all about what you're looking for, and I'll be your personal Flipkart guide! 💖  What kind of products are you interested in? 🤔  Do you have any specific hobbies, styles, or needs?  I'm here to help you find the perfect items! ✨ \n",
            },
          ],
        },
      ],
    });

    console.log("2. Model started\n");

    // Send the user's message to Gemini AI
    const result = await chatSession.sendMessage(userMessage);
    if (result) {
      console.log(result.response.text());
      console.log("Success !");
    } else {
      console.log("No Chat generated");
    }

    console.log("3. Message Generated\n");

    let messages = [
      {
        text: result.response.text(),
        facialExpression: "default",
        animation: "Talking_0",
      },
    ];

    console.log("4. Voice gen Started \n");

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(message);

      const fileName = `output_audio.mp3`;

      console.log("5. Audio gen Started \n");

      const textInput = message.text;
      console.log(textInput);
      console.log("6. Text extracted");

      await textToSpeech(textInput);

      console.log("7. Got the voice !!");

      // Generate lipsync data
      // await lipSyncMessage(i);

      console.log("8. Got the lip sync");

      // Attach audio and lipsync to the message
      message.audio = await audioFileToBase64(fileName);
      console.log("9. Audio attached\n");

      // message.lipsync = await readJsonTranscript(`au`);
      console.log("10. Lip Sync attached\n");
    }

    console.log("10. Yeah !! Audio Created");

    res.send({ messages });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});
