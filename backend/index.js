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

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

dotenv.config();

// Initialize API keys and models
const apiKey = "AIzaSyCmxupyVwQeUMFYM-ho2F5dQ9-gBKSEc2w"; // Replace with your actual API key
const elevenLabsApiKey = "sk_99312b0e877a42b64a03ab1212e020a3625fd9f6d3092c60";
const voiceID = "kgG7dCoKCfLehAPWkJOE";
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the product data file
const filePath = path.join(__dirname, 'productData.json');

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
app.use(cookieParser());
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



const textToSpeech = async (textInput) => {
  try {
    // Call the Python script to generate audio
    await execPromise(
      `python3 sample2.py "${textInput}"`
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
  console.log(userMessage);

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

    // const chatSession = model.startChat({
    //   generationConfig,
    //   history: [
    //     {
    //       role: "user",
    //       parts: [
    //         {
    //           text: "Hi gemini !! How are you ? You are a seller on Flipkart. Kindly act like a seller and recommend products to me based on my preferences and prompts. Generate responses in a happy tone, along with emojis and exclamations!",
    //         },
    //       ],
    //     },
    //     {
    //       role: "model",
    //       parts: [
    //         {
    //           text: "Hey there! 👋  So glad you stopped by! 🤩  Tell me all about what you're looking for, and I'll be your personal Flipkart guide! 💖  What kind of products are you interested in? 🤔  Do you have any specific hobbies, styles, or needs?  I'm here to help you find the perfect items! ✨ \n",
    //         },
    //       ],
    //     },
    //   ],
    // });
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Hi gemini !! How are you ? You have to play the role of a seller on Flipkart. Kindly act like a seller and recommend products to me based on my preferences and prompts. Generate responses in a happy tone, in a human-like fashion and use umm, ahh, okay like a normal person and take pauses,along with punctuations and exclamations! Try not to create bias for products, and suggest prodtcts in the price range promted by the user.
                    *** Generate responses that sound natural and conversational, avoiding robotic or scripted speech. Do not include * & : special characters. ***
                    *** Ensure accuracy and provide detailed product knowledge in every response.  ***
                    *** Maintain context and a consistent seller persona, even in long conversations. ***
                    *** Address customer concerns and objections effectively, providing clear and professional responses. ***
                    *** Deliver personalized recommendations that are relevant and tailored to the user's needs. ***`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hey there! So glad you stopped by! Tell me all about what you're looking for, and I'll be your personal Flipkart guide!  What kind of products are you interested in?  Do you have any specific hobbies, styles, or needs?  I'm here to help you find the perfect items! \n",
            },
          ],
        },
        {
          role: "user",
          parts: [
            {
              text: `*** Like a professional seller, curate products based on users' request. When evaluating products, consider the following:
                  *** Focus on products that are neither too expensive nor too cheap for the user's specified budget. ***
                  *** Prioritize the specifications and features that match the user's preferences ***
                  *** Help the user find the best value by recommending products that offer a good balance between quality, performance, and cost. ***
                  *** Avoid showing bias towards higher-priced or cheaper products unless there is a significant reason based on features or user needs ***

                  *** This is a selection of products from Flipkart's database. Kindly utilize this data to recommend items based on my preferences. Please compare products by features, display price comparisons, highlight cheaper or more expensive options, and respond with product suggestions based on their ratings and reviews. ***

                  *** product_name, product_category_tree, retail_price, discounted_price, description, overall_rating, brand ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",999,379,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra Navy, Red, Navy,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 3 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach Additional Details Style Code ALTHT_3P_21 In the Box 3 shorts",No rating available,Alisha ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Leatherette Black Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Leatherette Black Mechanism Type - Pull Out) Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. In The Box 1 Sofa Bed General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD112 Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Finish Type Matte Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Service Type Manufacturer Warranty Warranty Summary 6 Months Domestic Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Dimensions Weight 40 kg Height 838 mm Width 1905 mm Depth 939 mm Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Upholstery Color Leatherette Black Primary Color Black Primary Material Fabric Secondary Material Subtype Mango Wood Secondary Material Foam Finish Color Leatherette Black Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** AW Bellies,"[""Footwear >> Women's Footwear >> Ballerinas >> AW Bellies""]",999,499,"Key Features of AW Bellies Sandals Wedges Heel Casuals,AW Bellies Price: Rs. 499 Material: Synthetic Lifestyle: Casual Heel Type: Wedge Warranty Type: Manufacturer Product Warranty against manufacturing defects: 30 days Care instructions: Allow your pair of shoes to air and de-odorize at regular basis; use shoe bags to prevent any stains or mildew; dust any dry dirt from the surface using a clean cloth; do not use polish or shiner,Specifications of AW Bellies General Ideal For Women Occasion Casual Shoe Details Color Red Outer Material Patent Leather Heel Height 1 inch Number of Contents in Sales Package Pack of 1 In the Box One Pair Of Shoes",No rating available,AW ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",699,267,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra Black, Red,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 2 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach Additional Details Style Code ALTGHT_11 In the Box 2 shorts",No rating available,Alisha ***
                  *** Sicons All Purpose Arnica Dog Shampoo,"[""Pet Supplies >> Grooming >> Skin & Coat Care >> Shampoo >> Sicons All Purpose Arnica Dog Shampoo (500 ml)""]",220,210,Specifications of Sicons All Purpose Arnica Dog Shampoo (500 ml) General Pet Type Dog Brand Sicons Quantity 500 ml Model Number SH.DF-14 Type All Purpose Fragrance Arnica Form Factor Liquid In the Box Sales Package Shampoo Sicons Dog Fashion Arnica,No rating available,Sicons ***
                  *** Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish,"[""Eternal Gandhi Super Series Crystal Paper Weight...""]",430,430,"Key Features of Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish Crystal  paper weight Product Dimensions :   8cm x  8cm x 5cm A beautiful product Material: Crystal,Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish (Set Of 1, Clear) Price: Rs. 430 Your office desk will sparkle and shine when you accent tables with this elegant crystal paper weight. The multifaceted crystal features Gandhiji’s bust and his timeless message – “My life is my message – M.K. Gandhi”. A beautiful product to gift to your near and dear ones in family and Business.,Specifications of Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish (Set Of 1, Clear) General Model Name Gandhi Paper Weight Mark V Dimensions Weight 323 g In the Box Paper Weight Paper Weight Features Paper Weight Material Crystal Paper Weight Finish Silver Finish",No rating available,Eternal Gandhi ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",1199,479,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra Navy, Red, White, Red,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 4 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's In the Box 4 shorts Additional Details Style Code ALTGHT4P_26 Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Alisha ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Brown Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Brown Mechanism Type - Pull Out) Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. In The Box 1 Sofa Bed General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD107 Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Finish Type Matte Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Service Type Manufacturer Warranty Warranty Summary 6 Months Domestic Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Dimensions Weight 40 kg Height 838 mm Width 1905 mm Depth 939 mm Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Upholstery Color Brown Primary Color Brown Primary Material Fabric Secondary Material Subtype Mango Wood Secondary Material Foam Finish Color Brown Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** "dilli bazaaar Bellies, Corporate Casuals, Casuals","[""Footwear >> Women's Footwear >> Ballerinas >> dilli bazaaar Bellies, Corporate Casuals, Casuals""]",699,349,"Key Features of dilli bazaaar Bellies, Corporate Casuals, Casuals Material: Fabric Occasion: Ethnic, Casual, Party, Formal Color: Pink Heel Height: 0,Specifications of dilli bazaaar Bellies, Corporate Casuals, Casuals General Occasion Ethnic, Casual, Party, Formal Ideal For Women Shoe Details Weight 200 g (per single Shoe) - Weight of the product may vary depending on size. Heel Height 0 inch Outer Material Fabric Color Pink",No rating available,dilli bazaaar ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",1199,479,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra White, Black, Red, Black,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 4 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach Additional Details Style Code ALTGHT4P_39 In the Box 4 shorts",No rating available,Alisha ***
                  *** Ladela Bellies,"[""Footwear >> Women's Footwear >> Ballerinas >> Ladela Bellies""]",1724,950,"Key Features of Ladela Bellies Brand: LADELA Color : Black,Ladela Bellies Price: Rs. 950 Experience the best bellies from the house of Ladela. Providing the best material to keep your feet cozy and active for the whole day.,Specifications of Ladela Bellies General Occasion Casual Ideal For Women Shoe Details Heel Height 0 inch Outer Material PU Color Black",5,Ladela ***
                  *** Carrel Printed Women's,"[""Clothing >> Women's Clothing >> Sports & Gym Wear >> Swimsuits >> Carrel Swimsuits >> Carrel Printed Women's""]",2299,910,"Key Features of Carrel Printed Women's Fabric: SwimLycra Brand Color: Black, White,Carrel Printed Women's Price: Rs. 910 Max-coverage swimwear collection from CARREL BRAND, Brighten up your swim routine with this best fitting. This swimming costume from the house of Carrel is made of imported swim lycra fabric and comes in Black & White Colour. It has to be washed separately and dry in shade. Attractive & classy caressing the water. This swimwear provides excellent protection and Chlorine resistance. fast drying combined with flatlock stitching gives an unmatched comfort and helps you to that performance you have been striving for. This swimwear with its comfort and style is your perfect companion at any pool, beach or water activity. Time for you to do your own thing and Go With The Flow. This Swimwear Lightly padded, for modesty and support. This Product Support To This Size : L, XL, XXL, 3XL,4XL.,Specifications of Carrel Printed Women's Top Details Neck Round Neck Swimsuit Details Fabric SwimLycra Type Swim-dress General Details Pattern Printed Ideal For Women's Occasion Sports Fabric Care Wash with Similar Colors, Use Detergent for Colors In the Box 1 Swimware",No rating available,Carrel ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",999,379,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra Black, White, Black,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 3 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach Additional Details Style Code ALTHT_3P_17 In the Box 3 shorts",No rating available,Alisha ***
                  *** Freelance Vacuum Bottles 350 ml Bottle,"[""Pens & Stationery >> School Supplies >> Water Bottles >> Freelance Water Bottles >> Freelance Vacuum Bottles 350 ml Bottle (Pack of ...""]",699,699,"Specifications of Freelance Vacuum Bottles 350 ml Bottle (Pack of 1, Green) General Body Material Stainless steel Type Bottle In the Box Number of Contents in Sales Package Pack of 1 Sales Package 1 pcs in one packet",No rating available,Freelance ***
                  *** Alisha Solid Women's Cycling Shorts,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Shorts >> Alisha Shorts >> Alisha Solid Women's Cycling Shorts""]",999,379,"Key Features of Alisha Solid Women's Cycling Shorts Cotton Lycra Black, White, White,Specifications of Alisha Solid Women's Cycling Shorts Shorts Details Number of Contents in Sales Package Pack of 3 Fabric Cotton Lycra Type Cycling Shorts General Details Pattern Solid Ideal For Women's Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach Additional Details Style Code ALTHT_3P_2 In the Box 3 shorts",No rating available,Alisha ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Purple Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Purple Mechanism Type - Pull Out) Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. In The Box 1 Sofa Bed General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD132 Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Finish Type Matte Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Service Type Manufacturer Warranty Warranty Summary 6 Months Domestic Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Dimensions Weight 40 kg Height 838 mm Width 1905 mm Depth 939 mm Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Upholstery Color Purple Primary Color Purple Primary Material Fabric Secondary Material Subtype Mango Wood Secondary Material Foam Finish Color Purple Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** Style Foot Bellies,"[""Footwear >> Women's Footwear >> Ballerinas >> Style Foot Bellies""]",899,449,"Key Features of Style Foot Bellies ballerina shoes ballerina flats,Style Foot Bellies Price: Rs. 449 ballet shoes that fits perfectly for casual and party wear,Specifications of Style Foot Bellies General Occasion Casual Ideal For Women Shoe Details Heel Height 1 inch Outer Material PU Color Black In the Box 1 slipper",No rating available,Style Foot ***
                  *** Carrel Printed Women's,"[""Clothing >> Women's Clothing >> Sports & Gym Wear >> Swimsuits >> Carrel Swimsuits >> Carrel Printed Women's""]",2499,999,"Key Features of Carrel Printed Women's Fabric: SwimLycra Brand Color: DARK BLUE, WHITE,Carrel Printed Women's Price: Rs. 999 Max-coverage swimwear collection from CARREL BRAND, Brighten up your swim routine with this best fitting. This swimming costume from the house of Carrel is made of imported swim lycra fabric and comes in Darkblue & White Colour. It has to be washed separately and dry in shade. Attractive & classy caressing the water. This swimwear provides excellent protection and Chlorine resistance. fast drying combined with flatlock stitching gives an unmatched comfort and helps you to that performance you have been striving for. This swimwear with its comfort and style is your perfect companion at any pool, beach or water activity. Time for you to do your own thing and Go With The Flow. This Swimwear Lightly padded, for modesty and support. This Product Support To This Size : L, XL, XXL, 3XL,4XL.,Specifications of Carrel Printed Women's Top Details Neck Round Neck Swimsuit Details Fabric SwimLycra Type Swim-dress General Details Pattern Printed Ideal For Women's Occasion Sports Fabric Care Wash with Similar Colors, Use Detergent for Colors In the Box 1 Swimware",No rating available,Carrel ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Dark Brown Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Dark Brown Mechanism Type - Pull Out) In The Box 1 Sofa Bed Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD115 Finish Type Matte Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Dimensions Weight 40 kg Height 838.2 mm Width 1905 mm Depth 939.8 mm Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Warranty Summary 6 Months Domestic Warranty Service Type Manufacturer Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Primary Material Fabric Primary Color Brown Upholstery Color Dark Brown Secondary Material Foam Secondary Material Subtype Mango Wood Finish Color Dark Brown Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** Sicons Conditioning Conditoner Dog Shampoo,"[""Pet Supplies >> Grooming >> Skin & Coat Care >> Shampoo >> Sicons Conditioning Conditoner Dog Shampoo (200 ml)""]",110,100,Specifications of Sicons Conditioning Conditoner Dog Shampoo (200 ml) General Pet Type Dog Brand Sicons Quantity 200 ml Model Number SH.DF-02 Type Conditioning Fragrance Conditoner Form Factor Gel In the Box Sales Package Shampoo Sicons Dog Fashion Conditioner Aloe Rinse,No rating available,Sicons ***
                  *** dongli Printed Boy's Round Neck T-Shirt,"[""Clothing >> Kids' Clothing >> Boys Wear >> Polos & T-Shirts >> dongli Polos & T-Shirts >> dongli Printed Boy's Round Neck T-Shirt (Pack of 4)""]",2400,1039,"Specifications of dongli Printed Boy's Round Neck T-Shirt (Pack of 4) T-shirt Details Sleeve Half Sleeve Number of Contents in Sales Package Pack of 4 Fabric Cotton Type Round Neck Fit Regular General Details Pattern Printed Occasion Casual Ideal For Boy's In the Box 4 T Shirt Additional Details Style Code DLHBB445_BEIGE_BLACK_GYELLOW_PURPLE Fabric Care Wash with Similar Colors, Use Detergent for Colors",No rating available,dongli ***
                  *** SWAGGA Women Clogs,"[""Footwear >> Women's Footwear >> Sports Sandals >> SWAGGA Women Clogs""]",1500,1500,"Key Features of SWAGGA Women Clogs Occasion: Ethnic Material: Leather Color: Brown, White Heel Height: 0,Specifications of SWAGGA Women Clogs General Occasion Ethnic Ideal For Women Sandal Details Type Clogs Heel Height 0 inch Outer Material Leather Color Brown, White13",No rating available,SWAGGA ***
                  *** Kennel Rubber Dumbell With Bell - Small Rubber Rubber Toy For Dog,"[""Pet Supplies >> Toys >> Comfort Toys""]",190,190,Buy Kennel Rubber Dumbell With Bell - Small Rubber Rubber Toy For Dog for Rs.190 online. Kennel Rubber Dumbell With Bell - Small Rubber Rubber Toy For Dog at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,Kennel ***
                  *** Glus Wedding Lingerie Set,"[""Clothing >> Women's Clothing >> Lingerie, Sleep & Swimwear >> Lingerie Sets >> Glus Lingerie Sets""]",1299,699,Glus Wedding Lingerie Set - Buy Turquoise Glus Wedding Lingerie Set For Only Rs. 1299 Online in India. Shop Online For Apparels. Huge Collection of Branded Clothes Only at Flipkart.com,No rating available, ***
                  *** Veelys Shiny White Quad Roller Skates - Size 4.5 UK,"[""Sports & Fitness >> Other Sports >> Skating >> Skates >> Veelys Skates""]",3199,2499,Veelys Shiny White Quad Roller Skates - Size 4.5 UK only for Rs 2499 . Ideal For Boys . Buy online @ Flipkart.com. Only Genuine Products. Free Shipping. Cash On Delivery!,No rating available, ***
                  *** Bulaky vanity case Jewellery Vanity Case,"[""Beauty and Personal Care >> Makeup >> Vanity Boxes >> Bulaky Vanity Boxes""]",499,390,Buy Bulaky vanity case Jewellery Vanity Case for Rs.390 online. Bulaky vanity case Jewellery Vanity Case at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,3, ***
                  *** FDT Women's Leggings,"[""Clothing >> Women's Clothing >> Fusion Wear >> Leggings & Jeggings >> Legging Jegging >> FDT Legging Jegging""]",699,309,FDT Women's Leggings - Buy Parrot Green FDT Women's Leggings For Only Rs. 699 Online in India. Shop Online For Apparels. Huge Collection of Branded Clothes Only at Flipkart.com,No rating available, ***
                  *** Madcaps C38GR30 Men's Cargos,"[""Clothing >> Men's Clothing >> Cargos, Shorts & 3/4ths >> Cargos >> Madcaps Cargos""]",2199,1699,Madcaps C38GR30 Men's Cargos - Buy Green Madcaps C38GR30 Men's Cargos For Only Rs. 2199 Online in India. Shop Online For Apparels. Huge Collection of Branded Clothes Only at Flipkart.com,No rating available, ***
                  *** Bengal Blooms Rose Artificial Plant  with Pot,"[""Bengal Blooms Rose Artificial Plant  with Pot (3...""]",799,579,"Key Features of Bengal Blooms Rose Artificial Plant  with Pot Assorted Height: 30 cm,Bengal Blooms Rose Artificial Plant  with Pot (30 cm, Multicolor) Price: Rs. 579 The Bengal Blooms Decor your home with artificial flowers attached to a wonderful pot.,Specifications of Bengal Blooms Rose Artificial Plant  with Pot (30 cm, Multicolor) General Brand Bengal Blooms Model Number BBAJC218 Type Assorted Bonsai No Model Name Rose Color Multicolor Pot Features Pot Included Yes Dimensions Total Height 30 cm In the Box Sales Package 1 Assorted Artificial plant with Pot",No rating available,Bengal Blooms ***
                  *** Indcrown Net Embroidered Semi-stitched Lehenga Choli Material,"[""Clothing >> Women's Clothing >> Ethnic Wear >> Fabric >> Lehenga Choli Material >> Indcrown Lehenga Choli Material >> Indcrown Net Embroidered Semi-stitched Lehenga C...""]",999,699,"Key Features of Indcrown Net Embroidered Semi-stitched Lehenga Choli Material Ghagra Choli , Ghagra, Choli, Dupatta Set , Lehenga Choli , Lehenga, Choli and Dupatta Set .,Indcrown Net Embroidered Semi-stitched Lehenga Choli Material (Semi-stitched) Price: Rs. 699 We have not authorised any other seller to sell our brand Indcrown . Any seller doing so is selling fake Indcrown Products. Buy original Indcrown products from the seller "" indcrown‘’ only,Specifications of Indcrown Net Embroidered Semi-stitched Lehenga Choli Material (Semi-stitched) Fabric Details Fabric Net Type Semi-stitched Lehenga Choli Material General Details Pattern Embroidered Ideal For Women's Color Multicolor Fabric Care Dry clean or else Normal Hand Wash Additional Details Other Details Lehnga Choli is an Indian traditional ware also known as Chaniya Choli. We at Bolly Lounge offers you to attract compliments by this attractive Lehnga Choli made with fine quality material and beautiful work which can be worn for functions, festivals, parties and even office also. This Lehnga Choli ...View More Lehnga Choli is an Indian traditional ware also known as Chaniya Choli. We at Bolly Lounge offers you to attract compliments by this attractive Lehnga Choli made with fine quality material and beautiful work which can be worn for functions, festivals, parties and even office also. This Lehnga Choli is comes with unstitched material so it can be stitched according to your taste and preference. Stunning Self Designed Partywear Salwar Suit Gives A Trendy Look. Suit Having Fine Embroidery Work Over All. A Fine Fabric Used To Make It, It Will Be Comfortable In All Season. Style Code R C Lehe Bt In the Box 1 Lehenga Choli And Duppta Set",No rating available,Indcrown ***
                  *** Shopmania Music Band A5 Notebook Spiral Bound,"[""Pens & Stationery >> Diaries & Notebooks >> Notebooks >> Designer >> Shopmania Designer >> Shopmania Music Band A5 Notebook Spiral Bound (M...""]",499,275,"Specifications of Shopmania Music Band A5 Notebook Spiral Bound (Multicolor) General Ruling Ruled Model id NB00664 Type Notebook GSM 75 Cover Type 300 GSM Hard Laminated Cover No. of Pages 160 Brand Name Shopmania Binding Spiral Bound Color Multicolor Size A5 Dimensions Length 9 inch Width 6 inch Special Features Can be used as Notepad, Diary, Writing pad In the Box Sales Package 1 Notebook",No rating available,Shopmania ***
                  *** Shopmania Music Band A5 Notebook Spiral Bound,"[""Pens & Stationery >> Diaries & Notebooks >> Notebooks >> Designer >> Shopmania Designer >> Shopmania Music Band A5 Notebook Spiral Bound (M...""]",499,275,"Specifications of Shopmania Music Band A5 Notebook Spiral Bound (Multicolor) General Ruling Ruled Model id NB00678 Type Notebook GSM 75 Cover Type 300 GSM Hard Laminated Cover No. of Pages 160 Brand Name Shopmania Binding Spiral Bound Color Multicolor Size A5 Dimensions Length 9 inch Width 6 inch Special Features Can be used as Notepad, Diary, Writing pad In the Box Sales Package 1 Notebook",No rating available,Shopmania ***
                  *** "Tiara Diaries 2016-2017 Designer LA Kaarta ""TAKING ACTION GETTING RESULT"" (Set of 3) B5 Notebook Hard Bound","[""Pens & Stationery >> Diaries & Notebooks >> Notebooks >> Designer >> Tiara Diaries Designer >> Tiara Diaries 2016-2017 Designer LA Kaarta \""TAKI...""]",1000,837,"Specifications of Tiara Diaries 2016-2017 Designer LA Kaarta ""TAKING ACTION GETTING RESULT"" (Set of 3) B5 Notebook Hard Bound (Coffee, Pack of 3) General Ruling ruled Model id 244 Type Notebook No. of Pages 216 Brand Name Tiara Diaries Binding Hard Bound Size B5 Color Coffee",No rating available,Tiara Diaries ***
                  *** KAJCI Embroidered Women's Waistcoat,"[""Clothing >> Women's Clothing >> Formal Wear >> Waistcoats >> KAJCI Waistcoats >> KAJCI Embroidered Women's Waistcoat""]",1200,699,Specifications of KAJCI Embroidered Women's Waistcoat General Details Pattern Embroidered Ideal For Women's Waistcoat Details Fabric Art Silk In the Box Waistcoat Additional Details Style Code LKOD112 Fabric Care Dry Clean Only,No rating available,KAJCI ***
                  *** Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag,"[""Pens & Stationery >> Office Supplies >> Packaging Security Bags >> Packman Packaging Security Bags >> Packman 8 x 10 inches Security Bags Without POD ...""]",350,298,"Key Features of Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag Supplying to Over 200 Companies around world International E-commerce Standard Direct From ISO 9002 Factory 60 Microns High Quality Bags Longer Lasting Protection,Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag (21.59 x 27.95 Pack of 100) Price: Rs. 298 Courier Bag,Specifications of Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag (21.59 x 27.95 Pack of 100) General Bubble Wrap Present No Brand Packman Model Number 8 x 10 inches Security Bags Without POD Jacket Courier Bag Water Resistant Yes Tamper Proof Yes Material Plastic POD Jacket Available No Color Grey Size 21.59 x 27.95 Dimensions Weight 600 g Other Dimensions 8 x 10 Thickness 60 micron Additional Features Other Features security bag In the Box Sales Package 1 pack contains 100 pcs Pack of 100",No rating available,Packman ***
                  *** Pick Pocket Embroidered Women's Waistcoat,"[""Clothing >> Women's Clothing >> Formal Wear >> Waistcoats >> Pick Pocket Waistcoats >> Pick Pocket Embroidered Women's Waistcoat""]",899,899,Specifications of Pick Pocket Embroidered Women's Waistcoat General Details Pattern Embroidered Occasion Casual Ideal For Women's Waistcoat Details Lining Polyester Fabric Bengal Silk Additional Details Style Code TL-012 Fabric Care First Time Dry Clean,No rating available,Pick Pocket ***
                  *** Angelfish Silk Potali Potli,"[""Bags, Wallets & Belts >> Bags >> Pouches and Potlis >> Angelfish Pouches and Potlis >> Angelfish Silk Potali Potli (Multicolor)""]",999,399,"Angelfish Silk Potali Potli (Multicolor) Price: Rs. 399 Made by silk Fabric with fancy lace adnored and stylish handle also.(set of 2 piece),Specifications of Angelfish Silk Potali Potli (Multicolor) General Closure Velcro Type Potli Material Fabric Style Code AELKABJ01224-A Ideal For Girls Bag Size Small Occasion Party Color Code Multicolor Dimensions Weight 200 g Body Features Number of Compartments 1",No rating available,Angelfish ***
                  *** Oye Boy's Dungaree,"[""Clothing >> Kids' Clothing >> Boys Wear >> Dungarees & Jumpsuits >> Dungarees >> Oye Dungarees >> Oye Boy's Dungaree""]",899,764,Specifications of Oye Boy's Dungaree Top Details Number of Contents in Sales Package Pack of 1 Fabric Cotton Type Dungaree General Details Pattern Solid Ideal For Boy's In the Box 1 Dungaree,No rating available,Oye ***
                  *** Nuride Canvas Shoes,"[""Footwear >> Women's Footwear >> Casual Shoes >> Canvas >> Nuride Canvas Shoes""]",1999,1349,"Key Features of Nuride Canvas Shoes Material: Canvas Occasion: Casual Color: Red Heel Height: 0.5,Specifications of Nuride Canvas Shoes General Occasion Casual Ideal For Women Shoe Details Heel Height 0.5 inch Outer Material Canvas Color Red",No rating available,Nuride ***
                  *** OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm,"[""Home Decor & Festive Needs >> Showpiece >> Gramophones >> OM SHIVAKRITI Gramophones >> OM SHIVAKRITI Square wall Clock Showpiece  -  38...""]",1499,1499,"Key Features of OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm Paper Mache Height - 38.1 cm Width - 38.1 cm,OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm (Paper Mache, Multicolor) Price: Rs. 1,499 Omshivakriti brings you this square wall watch made from paper mache and finished in attractive set of colors. The product in display is ideal to décor your home.,Specifications of OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm (Paper Mache, Multicolor) General Brand OM SHIVAKRITI Model Number OSK60 Type Antique Material Paper Mache Model Name Square wall Clock Color Multicolor Dimensions Height 38.1 cm Width 38.1 cm Depth 3.81 cm In the Box Sales Package 1 showpiece",No rating available,OM SHIVAKRITI ***
                  *** Himmlisch ST381 Magnetic Sun Shade For Maruti Alto,"[""Automotive >> Accessories & Spare parts >> Car Interior & Exterior >> Car Interior >> Car Sun Shades >> Himmlisch ST381 Magnetic Sun Shade For Maruti Al...""]",6999,1899,"Himmlisch ST381 Magnetic Sun Shade For Maruti Alto (Side Window) Price: Rs. 1,899 Beat the heat this summer and feel like a VIP with Himmlisch Car Window Magnetic Sunshades. These magnetic sunshades create a mesh layer to stops the heat. Magnet border gets easily stick to your car window door edges (No need of Suction cups) Features: Block UV Rays Keeps Car Cool Easy to install and remove Durable and Exact Fit Provides Complete privacy Resists Heat Mesh Type Sunshade Package Contents: 1 x Set Of 4 Magnetic Sunshades,Specifications of Himmlisch ST381 Magnetic Sun Shade For Maruti Alto (Side Window) General Brand Himmlisch Model Number ST381 Magnetic Placement Position Side Window Color Black Dimensions Weight 4000 g Depth 1.1 cm In the Box Sales Package 4 Sun Shade Pack of 4",No rating available,Himmlisch ***
                  *** Rapter BNC-179 BNC Wire Connector,"[""Tools & Hardware >> Tools >> Hardware & Electricals >> Hardware >> Wire Joints & Connectors >> Rapter BNC-179 BNC Wire Connector (Silver, Pack ...""]",2299,1400,"Rapter BNC-179 BNC Wire Connector (Silver, Pack of 100) Price: Rs. 1,400 Rapter Pack of 100 BNC Connector.Superior quality BNC Connectors with high quality outer metel and brass conductors used to maintain a proper video/signal quality.BNC normally used in co-axial cables to lock with female connectors which ensures permanancy of connection.They can be used in DVRs, NVRs and CCTV Cameras etc.,Specifications of Rapter BNC-179 BNC Wire Connector (Silver, Pack of 100) General Brand Rapter Suitable For Wire to Wire Connection, Wire to Circuit Board Connection Model Number BNC-179 Type BNC Waterproof Yes Corrosion Proof Yes Color Silver In the box Sales Package 100 BNC Connector Pack of 100",No rating available,Rapter ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",999,499,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% Cotton Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004384 NAVY BLUE Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",899,449,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% POLYESTER Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004370 PINK::OLIVE Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Vishudh Printed Women's Anarkali Kurta,"[""Vishudh Printed Women's Anarkali Kurta""]",2099,1049,"Specifications of Vishudh Printed Women's Anarkali Kurta Kurta Details Sleeve Half Sleeve Number of Contents in Sales Package Pack of 1 Fabric 100% Cotton Type Anarkali Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004389 BEIGE::PINK Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System,"[""BuildTrack PIR Wireless Motion Sensor - One Swit...""]",6500,5000,"Key Features of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System National Award Winning Product Long Battery Life Freely Placed Low Power Consumed,BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System Price: Rs. 5,000 Buildtrack's Wireless Motion Sensor turns your existing light switches off when you leave the room and turns them on when you return. This model is ideal for fitting on a ceiling. It is battery powered and will work with One Single Switch. Using Wireless Motion Sensor stops Wastage of Energy and Lower your Electricity Bills. It is highly suitable for homes, institutions, banks, offices and healthcare. • Saves Energy • Lowers electricity bills • National Award Winning Product • Adds convenience • Works with existing switches, no re – wiring • Quick and easy installation • Freely placed • Long battery life • Single device for multiple switches • No aesthetic changes / No external wiring • Adjustable time delay for turning off,Related video of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System,Specifications of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System General Detection Angle 360 degree Brand BuildTrack Brand Color Off White Suitable For Homes, Offices, Intermittent Spaces, Warehouses, Industrial Spacing Wired/Wireless Wireless Display Type NA Installation Type Plug and Play, Simply Attached to the Ceiling Model Number PIR Wireless Motion Sensor - One Switch Control Audible Alarm No Maximum Alarm Distance 0 m Minimum Alarm Distance 0 m Detection Range 10 ft Number of Sensors 1 Color White Dimensions Weight 200 g Other Dimensions 106x106x71 mm Warranty Service Type Manufacturer's Warranty - 1 Year In the Box Wireless Motion Detector | Actuator | User Manual | Warranty Card Additional Features Other Features Saves Energy, Lowers Electricity Bills, Adds Convenience, Works with Existing Switches, No Re – Wiring, Quick and Easy Installation, Single Device for Multiple Switches, No Aesthetic Changes / No External Wiring, Adjustable Time Delay for Turning Off Technology Used Passive Infra Red (PIR)",No rating available,BuildTrack ***
                  *** Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired Sensor Security System,"[""Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER...""]",9990,4990,"Key Features of Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired Sensor Security System Dry run protection L/H Voltage protection Corrosion free sensors Has Manual/Auto mode,Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired Sensor Security System Price: Rs. 4,990 ""This system is suitable for single phase submersible pump. The sytem auto start the submersible pump when water level in tank reaches preset lower level and auto switch off the pump when tank gets full.Upper and lower level is adjustable as per user choice. The system indicates 4 different levels of water (¼ , ½, ¾, and Full) of overhead tank. The system has Auto /manual switch."",Related video of Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired Sensor Security System,Specifications of Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired Sensor Security System In the Box 1 pack of Skayvon SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER General Brand Skayvon Model Number SUMMERSIBLE SINGLE PHASE PUMP CONTROLLER Wired/Wireless Wired Number of Sensors 4 Brand Color Ivory Display Type LED Audible Alarm NO Installation Type Cabling Detection Range 987 ft Minimum Alarm Distance 10 m Maximum Alarm Distance 98 m Color Silver LED Indicators Yes",No rating available,Skayvon ***
                  *** MASARA Solid Women's Straight Kurta,"[""MASARA Solid Women's Straight Kurta""]",1399,599,"Key Features of MASARA Solid Women's Straight Kurta Green Straight,MASARA Solid Women's Straight Kurta Price: Rs. 599 The knee length kurti with raindrop pattern with subtle colors will completely transform your look at your work place. Soft cotton fabric used in this kurti is to die for.,Specifications of MASARA Solid Women's Straight Kurta Kurta Details Sleeve 3/4 Sleeve Fabric Cotton Type Straight Neck Round General Details Pattern Solid Occasion Casual Ideal For Women's Additional Details Style Code M002PCOTSEARAIN",No rating available,MASARA ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",899,449,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% POLYESTER Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004371 RUST::TEAL Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Rapter BNC-047 BNC Wire Connector,"[""Tools & Hardware >> Tools >> Hardware & Electricals >> Hardware >> Wire Joints & Connectors >> Rapter BNC-047 BNC Wire Connector (Silver, Pack ...""]",1299,899,"Rapter BNC-047 BNC Wire Connector (Silver, Pack of 64) Price: Rs. 899 Rapter Pack of 64 BNC Connector.Superior quality BNC Connectors with high quality outer metel and brass conductors used to maintain a proper video/signal quality.BNC normally used in co-axial cables to lock with female connectors which ensures permanancy of connection.They can be used in DVRs, NVRs and CCTV Cameras etc.,Specifications of Rapter BNC-047 BNC Wire Connector (Silver, Pack of 64) General Brand Rapter Suitable For Wire to Wire Connection, Wire to Circuit Board Connection Model Number BNC-047 Type BNC Waterproof Yes Corrosion Proof Yes Color Silver In the box Sales Package 64 BNC Connector Pack of 64",No rating available,Rapter ***
                  *** Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System,"[""Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER...""]",8999,4990,"Key Features of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System Dry run protection L/H Voltage protection Corrosion free sensors Has Manual/Auto mode,Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System Price: Rs. 4,990 ""This system is suitable for Three phase submersible pump. The sytem auto start the submersible pump when water level in tank reaches preset lower level and auto switch off the pump when tank gets full.Upper and lower level is adjustable as per user choice. The system indicates 4 different levels of water (¼ , ½, ¾, and Full) of overhead tank. The system has Auto /manual switch."",Related video of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System,Specifications of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System In the Box 1 pack of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER General Brand Skayvon Model Number SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired/Wireless Wired Number of Sensors 4 Brand Color Ivory Display Type LED Audible Alarm NO Installation Type Cabling Detection Range 987 ft Minimum Alarm Distance 10 m Maximum Alarm Distance 98 m Color Silver LED Indicators Yes Stand By Yes Additional Features Certification ISO 9001:2008",No rating available,Skayvon ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",899,449,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% POLYESTER Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004373 BLACK::MAROON Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Behringer Xenyx 502 Analog Sound Mixer,"[""Behringer Xenyx 502 Analog Sound Mixer""]",10000,6600,Specifications of Behringer Xenyx 502 Analog Sound Mixer In The Box 1 Sound Mixer General Number of Faders 4 Brand Behringer Application Type Live Performance Mixer Number of Channels 5 Model Number Xenyx 502 Channel Equalizer Type 2 band EQ Type Analog Number of Bus 2 On-board Effects No Dimensions Weight 1 kg Height 15 cm Width 15 cm Warranty Covered in Warranty Warranty of the product is limited to manufacturing defects only Warranty Summary 1 year India Warranty Service Type Customer needs to send the product to the authorized service centre of the company in case of any problem Not Covered in Warranty Warranty does not cover product damaged while in use by customer Power Features Power Consumption 50 Power Requirements 230V AC,No rating available,Behringer ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",899,449,"Key Features of Vishudh Printed Women's Straight Kurta BLACK, GREY Straight,Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% POLYESTER Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004374 BLACK::GREY Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",899,449,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% POLYESTER Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004372 PURPLE::PLUM Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** MASARA Solid Women's Straight Kurta,"[""MASARA Solid Women's Straight Kurta""]",1399,599,"Key Features of MASARA Solid Women's Straight Kurta Green Straight,MASARA Solid Women's Straight Kurta Price: Rs. 599 The knee length kurti with raindrop pattern with subtle colors will completely transform your look at your work place. Soft cotton fabric used in this kurti is to die for.,Specifications of MASARA Solid Women's Straight Kurta Kurta Details Sleeve 3/4 Sleeve Fabric Cotton Type Straight Neck Round General Details Pattern Solid Occasion Casual Ideal For Women's Additional Details Style Code M003PCOTSEARAIN",No rating available,MASARA ***
                  *** MASARA Solid Women's Straight Kurta,"[""MASARA Solid Women's Straight Kurta""]",1399,550,"Key Features of MASARA Solid Women's Straight Kurta Red Straight,MASARA Solid Women's Straight Kurta Price: Rs. 550 The blooming flowers of summer aren’t just for the gardens anymore. Bold floral prints on this knee-length cotton kurta allow you to effortlessly coordinate natural beauty into your outfit. The bright and pastel colors provide a more graceful feature to the ensemble.,Specifications of MASARA Solid Women's Straight Kurta Kurta Details Sleeve 3/4 Sleeve Fabric Cotton Type Straight Neck Round General Details Pattern Solid Occasion Casual Ideal For Women's Additional Details Style Code M002PCOTREDGAR",No rating available,MASARA ***
                  *** Roadster Men's Zipper Solid Cardigan,"[""Clothing >> Men's Clothing >> Winter & Seasonal Wear >> Cardigans >> Roadster Cardigans >> Roadster Men's Zipper Solid Cardigan""]",1399,699,"Key Features of Roadster Men's Zipper Solid Cardigan Fabric: 100% Acrylic Suitable For: Western Wear,Roadster Men's Zipper Solid Cardigan Price: Rs. 699 Navy blue and olive green cardigan, has a mock collar, a full zip closure, long raglan sleeves, two insert pockets, a ribbed hemLook stylish while beating the winter chill in this comfortable cardigan from Roadster. Team it with a pair of jeans and casual shoes when heading out for the day..,Specifications of Roadster Men's Zipper Solid Cardigan Cardigan Details Closure Zipper Sleeve Full Sleeve Number of Contents in Sales Package Pack of 1 Fabric 100% Acrylic General Details Pattern Solid Ideal For Men's Occasion Casual Fabric Care Machine-Wash Cold Additional Details Style Code 872907",3.6,Roadster ***
                  *** Vishudh Printed Women's Straight Kurta,"[""Vishudh Printed Women's Straight Kurta""]",999,499,"Specifications of Vishudh Printed Women's Straight Kurta Kurta Details Sleeve Sleeveless Number of Contents in Sales Package Pack of 1 Fabric 100% Cotton Type Straight Neck ROUND NECK General Details Pattern Printed Occasion Festive Ideal For Women's In the Box Kurta Additional Details Style Code VNKU004385 MAROON Fabric Care Gentle Machine Wash in Lukewarm Water, Do Not Bleach",No rating available,Vishudh ***
                  *** Noor Embroidered Women's Straight Kurta,"[""Noor Embroidered Women's Straight Kurta""]",1649,849,"Key Features of Noor Embroidered Women's Straight Kurta 100% Rayon Fabric Elegant Hand Embroidered Neck,Specifications of Noor Embroidered Women's Straight Kurta Kurta Details Sleeve 3/4 Sleeve Number of Contents in Sales Package Pack of 1 Fabric Rayon Type Straight Neck Round Neck General Details Pattern Embroidered Occasion Casual Ideal For Women's Additional Details Style Code NW_0012 Fabric Care Dry Clean Only",No rating available,Noor ***
                `,
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
