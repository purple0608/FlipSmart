// import {
//     GoogleGenerativeAI,
//     HarmCategory,
//     HarmBlockThreshold
// } from "@google/generative-ai";
// // const apiKey = process.env.GEMINI_API_KEY;
// const apiKey = "AIzaSyCmxupyVwQeUMFYM-ho2F5dQ9-gBKSEc2w";
// const genAI = new GoogleGenerativeAI(apiKey);

// const model = genAI.getGenerativeModel({
//   model: "gemini-1.5-flash",
// });

// const generationConfig = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 64,
//   maxOutputTokens: 512,
//   responseMimeType: "text/plain",
// };

// async function run() {
//   const chatSession = model.startChat({
//     generationConfig,
//     // safetySettings: Adjust safety settings
//     // See https://ai.google.dev/gemini-api/docs/safety-settings
//     history: [],
//   });

//   const result = await chatSession.sendMessage("Tell me about sharks ");
//   console.log(result.response.text());
// }

// run();


// const fs = require("fs");
// const { parse } = require("csv-parse");
// const { GoogleAIFileManager } = require("@google/generative-ai/server");
// import "fs";
import fs from "fs";
import { parse } from  "csv-parse";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} from "@google/generative-ai";

// const apiKey = process.env.GEMINI_API_KEY;
const apiKey = "AIzaSyCmxupyVwQeUMFYM-ho2F5dQ9-gBKSEc2w";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

/**
 * Reads data from a CSV file and returns the content as an array of strings.
 */
function extractCSV(pathname) {
  return new Promise((resolve, reject) => {
    const parts = [`--- START OF CSV ${pathname} ---`];
    fs.createReadStream(pathname)
      .pipe(parse({ delimiter: "," }))
      .on("data", (row) => {
        parts.push(row.join(" ")); // Join CSV row elements with a space
      })
      .on("end", () => {
        resolve(parts);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

/**
 * Waits for the given files to be active.
 */
async function waitForFilesActive(files) {
  console.log("Waiting for file processing...");
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name);
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
  console.log("...all files ready\n");
}

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

async function run() {
  try {
    // Read data from CSV file
    const csvData = await extractCSV("data.csv");
    console.log(csvData.join("\n")); // Log the extracted CSV data

    // Upload the CSV file to Gemini
    const files = [await uploadToGemini("data.csv", "text/csv")];

    // Some files have a processing delay. Wait for them to be ready.
    await waitForFilesActive(files);

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: files[0].mimeType,
                fileUri: files[0].uri,
              },
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage("I want to buy a skirt");
    console.log(result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
