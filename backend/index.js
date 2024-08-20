import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { log } from "console";

const apiKey = "AIzaSyCmxupyVwQeUMFYM-ho2F5dQ9-gBKSEc2w"; // Replace with your actual API key
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
dotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || "-", // Your OpenAI API key here, I used "-" to avoid errors when the key is not set but you should not do that
// });

// const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const elevenLabsApiKey = "sk_799b23489515a01b5c5325e5d67a23a460a1a61537cae4f6";
const voiceID = "kgG7dCoKCfLehAPWkJOE";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
    // -y to overwrite the file
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  // -r phonetic is faster but less accurate
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    console.log("Message Not found");
    
    res.send({
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
    return;
  }

  if (!elevenLabsApiKey || !apiKey) {
    console.log("No API key");
    
    res.send({
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
    return;
  }

  try {
    // Initialize a new chat session with the Gemini model
    console.log("1. Chat started\n");
    
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    console.log("2. Model started\n");

    // Send the user's message to Gemini AI
    const result = await chatSession.sendMessage(userMessage);
    if (result) {
      console.log(result.response.text());
      console.log("Success !");
      
    }
    else console.log("No Chat generated")
    
    console.log("3. Message Generated\n");
    
    // Parse the response
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
      
      // Generate audio file using text-to-speech
      const fileName = `audios/message_${i}.mp3`;
      console.log("5.  Audio gen Started \n");

      
      const textInput = message.text;
      console.log("6. Text extracted");
      
      await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
      console.log("7. Got the voice !!");
      
      // Generate lipsync data
      await lipSyncMessage(i);
      console.log("8. Got the lip sync");
      

      // Attach audio and lipsync to the message
      message.audio = await audioFileToBase64(fileName);
      console.log("9. Audio attached\n");
      
      message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      console.log("10. Lip Sync attached\n");

    }
    console.log("10. Yeah !! Audio Created");
    

    // Send the final response with generated messages
    res.send({ messages });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Something went wrong!" });
  }
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});



// app.post("/chat", async (req, res) => {
//   const userMessage = req.body.message;
//   if (!userMessage) {
//     res.send({
//       messages: [
//         {
//           text: "Hey dear... How was your day?",
//           audio: await audioFileToBase64("audios/intro_0.wav"),
//           lipsync: await readJsonTranscript("audios/intro_0.json"),
//           facialExpression: "smile",
//           animation: "Talking_1",
//         },
//         {
//           text: "I missed you so much... Please don't go for so long!",
//           audio: await audioFileToBase64("audios/intro_1.wav"),
//           lipsync: await readJsonTranscript("audios/intro_1.json"),
//           facialExpression: "sad",
//           animation: "Crying",
//         },
//       ],
//     });
//     return;
//   }
//   if (!elevenLabsApiKey || openai.apiKey === "-") {
//     res.send({
//       messages: [
//         {
//           text: "Please my dear, don't forget to add your API keys!",
//           audio: await audioFileToBase64("audios/api_0.wav"),
//           lipsync: await readJsonTranscript("audios/api_0.json"),
//           facialExpression: "angry",
//           animation: "Angry",
//         },
//         {
//           text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
//           audio: await audioFileToBase64("audios/api_1.wav"),
//           lipsync: await readJsonTranscript("audios/api_1.json"),
//           facialExpression: "smile",
//           animation: "Laughing",
//         },
//       ],
//     });
//     return;
//   }

//   // const completion = await openai.chat.completions.create({
//   //   model: "gpt-3.5-turbo-1106",
//   //   max_tokens: 1000,
//   //   temperature: 0.6,
//   //   response_format: {
//   //     type: "json_object",
//   //   },
//   //   messages: [
//   //     {
//   //       role: "system",
//   //       content: `
//   //       You are a virtual girlfriend.
//   //       You will always reply with a JSON array of messages. With a maximum of 3 messages.
//   //       Each message has a text, facialExpression, and animation property.
//   //       The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
//   //       The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
//   //       `,
//   //     },
//   //     {
//   //       role: "user",
//   //       content: userMessage || "Hello",
//   //     },
//   //   ],
//   // });

//   let messages = JSON.parse(completion.choices[0].message.content);
//   if (messages.messages) {
//     messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
//   }
//   for (let i = 0; i < messages.length; i++) {
//     const message = messages[i];
//     // generate audio file
//     const fileName = `audios/message_${i}.mp3`; // The name of your audio file
//     const textInput = message.text; // The text you wish to convert to speech
//     await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
//     // generate lipsync
//     await lipSyncMessage(i);
//     message.audio = await audioFileToBase64(fileName);
//     message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
//   }

//   res.send({ messages });
// });
