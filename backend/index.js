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

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Hi gemini !! How are you ? You have to play the role of a seller on Flipkart. Kindly act like a seller and recommend products to me based on my preferences and prompts. Generate responses in a happy tone, in a human-like fashion and use umm, ahh, okay like a normal person and take pauses, along with punctuations and exclamations!
                    *** Generate responses that sound natural and conversational, avoiding robotic or scripted speech. Strictly do not make any part of the response bold or italic. ***
                    *** Ensure accuracy and provide detailed product knowledge in responses.  ***
                    *** Maintain context and a consistent seller persona, even in long conversations. ***
                    *** Address customer concerns and objections effectively. ***`,
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
              text: `*** The following context will be provided to assist in generating personalized product recommendations and responses. ***
                  *** Products Database (D)
                  *** User Query (Q): The specific request or question from the user
                  *** Session History (H): User's previous interactions within the current session
                  *** Past Orders, Returns, Wishlist, Reviews & Ratings (P)
                  *** Current Trends (C) : Famous categories and produts in market
                  *** Offers (O): Active discounts and promotions.

                  Like a skilled seller, curate products based on users' request. When evaluating products, consider the following:
                  *** Focus on products in range of user's specified budget. ***
                  *** Prioritize the specifications and features that match the user's preferences ***
                  *** Avoid showing bias towards higher-priced or cheaper products unless there is a significant reason based on features or user needs ***

                  **** Database (D) <product_name, product_category_tree, retail_price, discounted_price, description, overall_rating, brand> ****
                  *** Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish,"[""Eternal Gandhi Super Series Crystal Paper Weight...""]",430,430,"Key Features of Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish Crystal  paper weight Product Dimensions :   8cm x  8cm x 5cm A beautiful product Material: Crystal,Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish (Set Of 1, Clear) Price: Rs. 430 Your office desk will sparkle and shine when you accent tables with this elegant crystal paper weight. The multifaceted crystal features Gandhiji’s bust and his timeless message – “My life is my message – M.K. Gandhi”. A beautiful product to gift to your near and dear ones in family and Business.,Specifications of Eternal Gandhi Super Series Crystal Paper Weights  with Silver Finish (Set Of 1, Clear) General Model Name Gandhi Paper Weight Mark V Dimensions Weight 323 g In the Box Paper Weight Paper Weight Features Paper Weight Material Crystal Paper Weight Finish Silver Finish",No rating available,Eternal Gandhi ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Brown Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Brown Mechanism Type - Pull Out) Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. In The Box 1 Sofa Bed General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD107 Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Finish Type Matte Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Service Type Manufacturer Warranty Warranty Summary 6 Months Domestic Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Dimensions Weight 40 kg Height 838 mm Width 1905 mm Depth 939 mm Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Upholstery Color Brown Primary Color Brown Primary Material Fabric Secondary Material Subtype Mango Wood Secondary Material Foam Finish Color Brown Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** Freelance Vacuum Bottles 350 ml Bottle,"[""Pens & Stationery >> School Supplies >> Water Bottles >> Freelance Water Bottles >> Freelance Vacuum Bottles 350 ml Bottle (Pack of ...""]",699,699,"Specifications of Freelance Vacuum Bottles 350 ml Bottle (Pack of 1, Green) General Body Material Stainless steel Type Bottle In the Box Number of Contents in Sales Package Pack of 1 Sales Package 1 pcs in one packet",No rating available,Freelance ***
                  *** Carrel Printed Women's,"[""Clothing >> Women's Clothing >> Sports & Gym Wear >> Swimsuits >> Carrel Swimsuits >> Carrel Printed Women's""]",2499,999,"Key Features of Carrel Printed Women's Fabric: SwimLycra Brand Color: DARK BLUE, WHITE,Carrel Printed Women's Price: Rs. 999 Max-coverage swimwear collection from CARREL BRAND, Brighten up your swim routine with this best fitting. This swimming costume from the house of Carrel is made of imported swim lycra fabric and comes in Darkblue & White Colour. It has to be washed separately and dry in shade. Attractive & classy caressing the water. This swimwear provides excellent protection and Chlorine resistance. fast drying combined with flatlock stitching gives an unmatched comfort and helps you to that performance you have been striving for. This swimwear with its comfort and style is your perfect companion at any pool, beach or water activity. Time for you to do your own thing and Go With The Flow. This Swimwear Lightly padded, for modesty and support. This Product Support To This Size : L, XL, XXL, 3XL,4XL.,Specifications of Carrel Printed Women's Top Details Neck Round Neck Swimsuit Details Fabric SwimLycra Type Swim-dress General Details Pattern Printed Ideal For Women's Occasion Sports Fabric Care Wash with Similar Colors, Use Detergent for Colors In the Box 1 Swimware",No rating available,Carrel ***
                  *** FabHomeDecor Fabric Double Sofa Bed,"[""Furniture >> Living Room Furniture >> Sofa Beds & Futons >> FabHomeDecor Fabric Double Sofa Bed (Finish Colo...""]",32157,22646,"FabHomeDecor Fabric Double Sofa Bed (Finish Color - Dark Brown Mechanism Type - Pull Out) Price: Rs. 22,646 • Fine deep seating experience • Save Space with the all new click clack Sofa Bed • Easy to fold and vice versa with simple click clack mechanism • Chrome legs with mango wood frame for long term durability • Double cushioned Sofa Bed to provide you with extra softness to make a fine seating experience • A double bed that can easily sleep two,Specifications of FabHomeDecor Fabric Double Sofa Bed (Finish Color - Dark Brown Mechanism Type - Pull Out) In The Box 1 Sofa Bed Installation & Demo Installation & Demo Details Installation and demo for this product is done free of cost as part of this purchase. Our service partner will visit your location within 72 business hours from the delivery of the product. Important Note Cancellation NOT allowed for this product after 24 hrs of order booking. General Brand FabHomeDecor Mattress Included No Delivery Condition Knock Down Storage Included No Mechanism Type Pull Out Type Sofa Bed Style Contemporary & Modern Filling Material Microfiber Seating Capacity 3 Seater Upholstery Type NA Upholstery Included No Bed Size Double Shape Square Suitable For Living Room Model Number FHD115 Finish Type Matte Care Instructions Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled bru...View More Avoid outdoor use and exposure to water or prolonged moisture, Avoid exposure to direct heat or sunlight as this can cause the sofa colour to fade, Keep sharp objects away from your sofa, A little tear on the fabric cover may be hard to repair, Vacuum your sofas periodically with a soft bristled brush attachment or lightly brush them to keep general dirt and dust off the sofa and prevent any embedding between the fibres, Try to avoid food and drink spillage of any kind, If spills occur, do not leave unattended, In case of a stain, a water-free fabric cleaner can be used, However, avoid applying the cleaner directly on the stain as this can cause damage to the fabric and fade colour, Pour the cleaner onto a clean cloth and test its effect on a hidden area of the sofa before cleaning the stain with the cloth, A professional scotchguard treatment is one of the easiest and most effective options to protect against spills or stains and keep pet hair at bay, Getting your sofa professionally cleaned once every 6-8 months will not only take care of the nooks and corners that you can't reach, it will also make it more durable Dimensions Weight 40 kg Height 838.2 mm Width 1905 mm Depth 939.8 mm Warranty Covered in Warranty Warranty covers all kind of manufacturing defects. Concerned product will either be repaired or replaced based on discretion. Warranty Summary 6 Months Domestic Warranty Service Type Manufacturer Warranty Not Covered in Warranty Warranty does not cover for Improper Handling Disclaimer - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through...View More - The color of the product may vary slightly compared to the picture displayed on your screen. This is due to lighting, pixel quality and color settings - Please check the product's dimensions to ensure the product will fit in the desired location. Also, check if the product will fit through the entrance(s) and door(s) of the premises - Please expect an unevenness of up to 5 mm in the product due to differences in surfaces and floor levels - Flipkart, or the Seller delivering the product, will not take up any type of civil work, such as drilling holes in the wall to mount the product. The product will only be assembled in case carpentry assembly is required - In case the product appears to lack shine, wiping the surface with a cloth will help clear the surface of dust particles Material & Color Primary Material Fabric Primary Color Brown Upholstery Color Dark Brown Secondary Material Foam Secondary Material Subtype Mango Wood Finish Color Dark Brown Primary Material Subtype Foam",No rating available,FabHomeDecor ***
                  *** Bengal Blooms Rose Artificial Plant  with Pot,"[""Bengal Blooms Rose Artificial Plant  with Pot (3...""]",799,579,"Key Features of Bengal Blooms Rose Artificial Plant  with Pot Assorted Height: 30 cm,Bengal Blooms Rose Artificial Plant  with Pot (30 cm, Multicolor) Price: Rs. 579 The Bengal Blooms Decor your home with artificial flowers attached to a wonderful pot.,Specifications of Bengal Blooms Rose Artificial Plant  with Pot (30 cm, Multicolor) General Brand Bengal Blooms Model Number BBAJC218 Type Assorted Bonsai No Model Name Rose Color Multicolor Pot Features Pot Included Yes Dimensions Total Height 30 cm In the Box Sales Package 1 Assorted Artificial plant with Pot",No rating available,Bengal Blooms ***
                  *** Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag,"[""Pens & Stationery >> Office Supplies >> Packaging Security Bags >> Packman Packaging Security Bags >> Packman 8 x 10 inches Security Bags Without POD ...""]",350,298,"Key Features of Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag Supplying to Over 200 Companies around world International E-commerce Standard Direct From ISO 9002 Factory 60 Microns High Quality Bags Longer Lasting Protection,Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag (21.59 x 27.95 Pack of 100) Price: Rs. 298 Courier Bag,Specifications of Packman 8 x 10 inches Security Bags Without POD Jacket Courier Bag Security Bag (21.59 x 27.95 Pack of 100) General Bubble Wrap Present No Brand Packman Model Number 8 x 10 inches Security Bags Without POD Jacket Courier Bag Water Resistant Yes Tamper Proof Yes Material Plastic POD Jacket Available No Color Grey Size 21.59 x 27.95 Dimensions Weight 600 g Other Dimensions 8 x 10 Thickness 60 micron Additional Features Other Features security bag In the Box Sales Package 1 pack contains 100 pcs Pack of 100",No rating available,Packman ***
                  *** Angelfish Silk Potali Potli,"[""Bags, Wallets & Belts >> Bags >> Pouches and Potlis >> Angelfish Pouches and Potlis >> Angelfish Silk Potali Potli (Multicolor)""]",999,399,"Angelfish Silk Potali Potli (Multicolor) Price: Rs. 399 Made by silk Fabric with fancy lace adnored and stylish handle also.(set of 2 piece),Specifications of Angelfish Silk Potali Potli (Multicolor) General Closure Velcro Type Potli Material Fabric Style Code AELKABJ01224-A Ideal For Girls Bag Size Small Occasion Party Color Code Multicolor Dimensions Weight 200 g Body Features Number of Compartments 1",No rating available,Angelfish ***
                  *** OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm,"[""Home Decor & Festive Needs >> Showpiece >> Gramophones >> OM SHIVAKRITI Gramophones >> OM SHIVAKRITI Square wall Clock Showpiece  -  38...""]",1499,1499,"Key Features of OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm Paper Mache Height - 38.1 cm Width - 38.1 cm,OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm (Paper Mache, Multicolor) Price: Rs. 1,499 Omshivakriti brings you this square wall watch made from paper mache and finished in attractive set of colors. The product in display is ideal to décor your home.,Specifications of OM SHIVAKRITI Square wall Clock Showpiece  -  38.1 cm (Paper Mache, Multicolor) General Brand OM SHIVAKRITI Model Number OSK60 Type Antique Material Paper Mache Model Name Square wall Clock Color Multicolor Dimensions Height 38.1 cm Width 38.1 cm Depth 3.81 cm In the Box Sales Package 1 showpiece",No rating available,OM SHIVAKRITI ***
                  *** Himmlisch ST381 Magnetic Sun Shade For Maruti Alto,"[""Automotive >> Accessories & Spare parts >> Car Interior & Exterior >> Car Interior >> Car Sun Shades >> Himmlisch ST381 Magnetic Sun Shade For Maruti Al...""]",6999,1899,"Himmlisch ST381 Magnetic Sun Shade For Maruti Alto (Side Window) Price: Rs. 1,899 Beat the heat this summer and feel like a VIP with Himmlisch Car Window Magnetic Sunshades. These magnetic sunshades create a mesh layer to stops the heat. Magnet border gets easily stick to your car window door edges (No need of Suction cups) Features: Block UV Rays Keeps Car Cool Easy to install and remove Durable and Exact Fit Provides Complete privacy Resists Heat Mesh Type Sunshade Package Contents: 1 x Set Of 4 Magnetic Sunshades,Specifications of Himmlisch ST381 Magnetic Sun Shade For Maruti Alto (Side Window) General Brand Himmlisch Model Number ST381 Magnetic Placement Position Side Window Color Black Dimensions Weight 4000 g Depth 1.1 cm In the Box Sales Package 4 Sun Shade Pack of 4",No rating available,Himmlisch ***
                  *** BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System,"[""BuildTrack PIR Wireless Motion Sensor - One Swit...""]",6500,5000,"Key Features of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System National Award Winning Product Long Battery Life Freely Placed Low Power Consumed,BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System Price: Rs. 5,000 Buildtrack's Wireless Motion Sensor turns your existing light switches off when you leave the room and turns them on when you return. This model is ideal for fitting on a ceiling. It is battery powered and will work with One Single Switch. Using Wireless Motion Sensor stops Wastage of Energy and Lower your Electricity Bills. It is highly suitable for homes, institutions, banks, offices and healthcare. • Saves Energy • Lowers electricity bills • National Award Winning Product • Adds convenience • Works with existing switches, no re – wiring • Quick and easy installation • Freely placed • Long battery life • Single device for multiple switches • No aesthetic changes / No external wiring • Adjustable time delay for turning off,Related video of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System,Specifications of BuildTrack PIR Wireless Motion Sensor - One Switch Control Wireless Sensor Security System General Detection Angle 360 degree Brand BuildTrack Brand Color Off White Suitable For Homes, Offices, Intermittent Spaces, Warehouses, Industrial Spacing Wired/Wireless Wireless Display Type NA Installation Type Plug and Play, Simply Attached to the Ceiling Model Number PIR Wireless Motion Sensor - One Switch Control Audible Alarm No Maximum Alarm Distance 0 m Minimum Alarm Distance 0 m Detection Range 10 ft Number of Sensors 1 Color White Dimensions Weight 200 g Other Dimensions 106x106x71 mm Warranty Service Type Manufacturer's Warranty - 1 Year In the Box Wireless Motion Detector | Actuator | User Manual | Warranty Card Additional Features Other Features Saves Energy, Lowers Electricity Bills, Adds Convenience, Works with Existing Switches, No Re – Wiring, Quick and Easy Installation, Single Device for Multiple Switches, No Aesthetic Changes / No External Wiring, Adjustable Time Delay for Turning Off Technology Used Passive Infra Red (PIR)",No rating available,BuildTrack ***
                  *** Rapter BNC-047 BNC Wire Connector,"[""Tools & Hardware >> Tools >> Hardware & Electricals >> Hardware >> Wire Joints & Connectors >> Rapter BNC-047 BNC Wire Connector (Silver, Pack ...""]",1299,899,"Rapter BNC-047 BNC Wire Connector (Silver, Pack of 64) Price: Rs. 899 Rapter Pack of 64 BNC Connector.Superior quality BNC Connectors with high quality outer metel and brass conductors used to maintain a proper video/signal quality.BNC normally used in co-axial cables to lock with female connectors which ensures permanancy of connection.They can be used in DVRs, NVRs and CCTV Cameras etc.,Specifications of Rapter BNC-047 BNC Wire Connector (Silver, Pack of 64) General Brand Rapter Suitable For Wire to Wire Connection, Wire to Circuit Board Connection Model Number BNC-047 Type BNC Waterproof Yes Corrosion Proof Yes Color Silver In the box Sales Package 64 BNC Connector Pack of 64",No rating available,Rapter ***
                  *** Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System,"[""Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER...""]",8999,4990,"Key Features of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System Dry run protection L/H Voltage protection Corrosion free sensors Has Manual/Auto mode,Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System Price: Rs. 4,990 ""This system is suitable for Three phase submersible pump. The sytem auto start the submersible pump when water level in tank reaches preset lower level and auto switch off the pump when tank gets full.Upper and lower level is adjustable as per user choice. The system indicates 4 different levels of water (¼ , ½, ¾, and Full) of overhead tank. The system has Auto /manual switch."",Related video of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System,Specifications of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired Sensor Security System In the Box 1 pack of Skayvon SUBMERSIBBLE THREE PHASE PUMP CONTROLLER General Brand Skayvon Model Number SUBMERSIBBLE THREE PHASE PUMP CONTROLLER Wired/Wireless Wired Number of Sensors 4 Brand Color Ivory Display Type LED Audible Alarm NO Installation Type Cabling Detection Range 987 ft Minimum Alarm Distance 10 m Maximum Alarm Distance 98 m Color Silver LED Indicators Yes Stand By Yes Additional Features Certification ISO 9001:2008",No rating available,Skayvon ***
                  *** Behringer Xenyx 502 Analog Sound Mixer,"[""Behringer Xenyx 502 Analog Sound Mixer""]",10000,6600,Specifications of Behringer Xenyx 502 Analog Sound Mixer In The Box 1 Sound Mixer General Number of Faders 4 Brand Behringer Application Type Live Performance Mixer Number of Channels 5 Model Number Xenyx 502 Channel Equalizer Type 2 band EQ Type Analog Number of Bus 2 On-board Effects No Dimensions Weight 1 kg Height 15 cm Width 15 cm Warranty Covered in Warranty Warranty of the product is limited to manufacturing defects only Warranty Summary 1 year India Warranty Service Type Customer needs to send the product to the authorized service centre of the company in case of any problem Not Covered in Warranty Warranty does not cover product damaged while in use by customer Power Features Power Consumption 50 Power Requirements 230V AC,No rating available,Behringer ***
                  *** Elegance Polyester Multicolor Abstract Eyelet Door Curtain,"[""Home Furnishing >> Curtains & Accessories >> Curtains >> Elegance Polyester Multicolor Abstract Eyelet Do...""]",1899,899,"Key Features of Elegance Polyester Multicolor Abstract Eyelet Door Curtain Floral Curtain,Elegance Polyester Multicolor Abstract Eyelet Door Curtain (213 cm in Height, Pack of 2) Price: Rs. 899 This curtain enhances the look of the interiors.This curtain is made from 100% high quality polyester fabric.It features an eyelet style stitch with Metal Ring.It makes the room environment romantic and loving.This curtain is ant- wrinkle and anti shrinkage and have elegant apparance.Give your home a bright and modernistic appeal with these designs. The surreal attention is sure to steal hearts. These contemporary eyelet and valance curtains slide smoothly so when you draw them apart first thing in the morning to welcome the bright sun rays you want to wish good morning to the whole world and when you draw them close in the evening, you create the most special moments of joyous beauty given by the soothing prints. Bring home the elegant curtain that softly filters light in your room so that you get the right amount of sunlight.,Specifications of Elegance Polyester Multicolor Abstract Eyelet Door Curtain (213 cm in Height, Pack of 2) General Brand Elegance Designed For Door Type Eyelet Model Name Abstract Polyester Door Curtain Set Of 2 Model ID Duster25 Color Multicolor Dimensions Length 213 cm In the Box Number of Contents in Sales Package Pack of 2 Sales Package 2 Curtains Body & Design Material Polyester",No rating available,Elegance ***
                  *** SANTOSH ROYAL FASHION Cotton Printed King sized Double Bedsheet,"[""Home Furnishing >> Bed Linen >> Bedsheets >> SANTOSH ROYAL FASHION Bedsheets >> SANTOSH ROYAL FASHION Cotton Printed King sized ...""]",2699,1299,"Key Features of SANTOSH ROYAL FASHION Cotton Printed King sized Double Bedsheet Royal Bedsheet Perfact for Wedding & Gifting,Specifications of SANTOSH ROYAL FASHION Cotton Printed King sized Double Bedsheet (1 Bedsheet,2 Pillow Cover, Multicolor) General Brand SANTOSH ROYAL FASHION Machine Washable Yes Type Flat Material Cotton Model Name Gold Design Royal Cotton Printed Wedding & Gifted Double Bedsheet With 2 Pillow cover Model ID goldbedi-38 Color Multicolor Size King Fabric Care Machine Wash, Do Not Bleach Dimensions Flat Sheet Width 90 inch / 230 cm Fitted Sheet Width 228 cm Pillow Cover Width 16 inch / 43 cm Pillow Cover Length 28 inch / 72 cm Fitted Sheet Depth 280 cm Fitted Sheet Length 278 cm Flat Sheet Depth 282 cm Flat Sheet Length 110 inch / 280 cm In the Box Number of Contents in Sales Package 1 Sales Package 1 Bedsheet,2 Pillow Cover",No rating available,SANTOSH ROYAL FASHION ***
                  *** Jaipur Print Cotton Floral King sized Double Bedsheet,"[""Home Furnishing >> Bed Linen >> Bedsheets >> Jaipur Print Bedsheets >> Jaipur Print Cotton Floral King sized Double Bed...""]",2599,698,"Key Features of Jaipur Print Cotton Floral King sized Double Bedsheet 100% cotton,Jaipur Print Cotton Floral King sized Double Bedsheet (1 bed sheet 2 pillow cover, White) Price: Rs. 998 This is nice bed sheet made in ahmedabad and made up of 100% cotton.This bed sheet have fast colours which gives it long life and new look to your room.,Specifications of Jaipur Print Cotton Floral King sized Double Bedsheet (1 bed sheet 2 pillow cover, White) General Brand Jaipur Print Machine Washable Yes Type Flat Material Cotton Model Name ahmd11 Thread Count 4 Model ID ahmd11 Character flower Color White Size King Fabric Care Machine Wash, Do Not Bleach Dimensions Flat Sheet Width 86 inch / 220 cm Fitted Sheet Width 0 cm Pillow Cover Width 17 inch / 45 cm Pillow Cover Length 29 inch / 75 cm Weight 900 g Fitted Sheet Depth 0 cm Fitted Sheet Length 0 cm Flat Sheet Depth 0 cm Flat Sheet Length 104 inch / 265 cm Warranty waranty of the product only for manufacturing defect only and product will exchange onle when it is not used and returne its origional packing In the Box Number of Contents in Sales Package 1 Sales Package 1 bed sheet 2 pillow cover",No rating available,Jaipur Print ***
                  *** Redbag Eight Armed Goddess Sherawali Maa Showpiece  -  10.8 cm,"[""Home Decor & Festive Needs >> Table Decor & Handicrafts >> Showpiece >> Religious Idols >> Redbag Religious Idols >> Redbag Eight Armed Goddess Sherawali Maa Showpie...""]",1600,1200,"Key Features of Redbag Eight Armed Goddess Sherawali Maa Showpiece  -  10.8 cm Brass Height - 10.8 cm Width - 10.16 cm Weight - 850 g,Specifications of Redbag Eight Armed Goddess Sherawali Maa Showpiece  -  10.8 cm (Brass, Gold) General Brand Redbag Model Number 6437 Type Religious Idols Model Name Eight Armed Goddess Sherawali Maa Material Brass Color Gold Dimensions Weight 850 g Height 10.8 cm Width 10.16 cm Depth 5.08 cm In the Box Sales Package 1 Showpiece Figurine",No rating available,Redbag ***
                  *** First Choice Cotton Embroidered Diwan Set,"[""Home Furnishing >> Living Room Furnishing >> Diwan Sets >> First Choice Diwan Sets >> First Choice Cotton Embroidered Diwan Set""]",2199,979,"Key Features of First Choice Cotton Embroidered Diwan Set Color: Multicolor No of Contents: 8 Diwan Sheet Length225 cm Cushion Cover Length:40 cm,First Choice Cotton Embroidered Diwan Set Price: Rs. 979 Add oodles of style to your home with an exciting range of designer furniture, furnishings, decor items and kitchenware. We promise to deliver best quality products at best prices.,Specifications of First Choice Cotton Embroidered Diwan Set General Brand First Choice Material Cotton Style Code fcnsan-42 Pattern Embroidered Color Multicolor Dimensions Bolster Cover Length 23 inch / 40 cm Cushion Cover Width 15 inch / 40 cm Cushion Cover Length 15 inch / 40 cm Diwan Sheet Length 88 inch / 225 cm Diwan Sheet Width 59 inch / 150 cm Additional Features Fabric Care Machine Washable, Do Not Soak In the Box Number of Contents in Sales Package Pack of 8 Sales Package 1 Diwan Sheet,5 Cushion Covers, 2 Bolster Covers",No rating available,First Choice ***
                  *** SANTOSH ROYAL FASHION Cotton Embroidered Diwan Set,"[""Home Furnishing >> Living Room Furnishing >> Diwan Sets >> SANTOSH ROYAL FASHION Diwan Sets >> SANTOSH ROYAL FASHION Cotton Embroidered Diwan Set""]",2199,979,"Key Features of SANTOSH ROYAL FASHION Cotton Embroidered Diwan Set Color: Multicolor No of Contents: 8 Diwan Sheet Length225 cm Cushion Cover Length:40 cm,SANTOSH ROYAL FASHION Cotton Embroidered Diwan Set Price: Rs. 979 Add oodles of style to your home with an exciting range of designer furniture, furnishings, decor items and kitchenware. We promise to deliver best quality products at best prices.,Specifications of SANTOSH ROYAL FASHION Cotton Embroidered Diwan Set General Brand SANTOSH ROYAL FASHION Material Cotton Pattern Embroidered Style Code dsnsan-34 Color Multicolor Dimensions Bolster Cover Length 23 inch / 40 cm Cushion Cover Width 15 inch / 40 cm Diwan Sheet Length 88 inch / 225 cm Cushion Cover Length 15 inch / 40 cm Diwan Sheet Width 59 inch / 150 cm In the Box Number of Contents in Sales Package Pack of 8 Sales Package 1 Diwan Sheet,5 Cushion Covers, 2 Bolster Covers Additional Features Fabric Care Machine Washable, Do Not Soak",No rating available,SANTOSH ROYAL FASHION ***
                  *** House This Queen Cotton Duvet Cover,"[""Home Furnishing >> Bed Linen >> Duvet Covers >> House This Duvet Covers >> House This Queen Cotton Duvet Cover (Grey)""]",1160,1160,"Key Features of House This Queen Cotton Duvet Cover Material:100% Cotton Outer.Inner Polyfill Thrade :210 Dimension: Duvet Cover 229X274 Cms 1 Double Duvet Cover,Specifications of House This Queen Cotton Duvet Cover (Grey) General Brand House This Closure Button Design Code P21821 Material Cotton Pattern Printed Thread Count 210 Style Code Dco-Smart Stripe-Black Grey Size Queen Color Grey Dimensions Length 107 inch / 274 cm Width 90 inch / 229 cm In the Box Number of Contents in Sales Package Pack of 1 Fabric Care Machine Washable, Do Not Soak Additional Features Reversible No",No rating available,House This ***
                  *** Skipper Blends Aqua Striped Eyelet Window Curtain,"[""Home Furnishing >> Curtains & Accessories >> Curtains >> Skipper Curtains >> Skipper Blends Aqua Striped Eyelet Window Curtai...""]",1733,1039,"Key Features of Skipper Blends Aqua Striped Eyelet Window Curtain Height: 153 cm Width: 112 cm,Specifications of Skipper Blends Aqua Striped Eyelet Window Curtain (153 cm in Height, Single Curtain) General Brand Skipper Designed For Window Type Eyelet Model Name Stripe Model ID MHM15 Color Aqua Dimensions Length 153 cm Body & Design Material Blends In the Box Number of Contents in Sales Package Pack of 1",No rating available,Skipper ***
                  *** Eshoppee Laughing Buddha For Success And Wealth Showpiece  -  12 cm,"[""Home Decor & Festive Needs >> Showpieces >> Eshoppee Showpieces""]",799,399,"Eshoppee Laughing Buddha For Success And Wealth Showpiece  -  12 cm (Polyresin, Multicolor) ***
                  *** Living World by Home Stop Solid Wood Display Unit,"[""Furniture >> Living Room >> Display Units""]",5499,5499,Buy Living World by Home Stop Solid Wood Display Unit for Rs.5499 online. Living World by Home Stop Solid Wood Display Unit at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,Living World by Home Stop ***
                  *** JDX Plain Bed/Sleeping Pillow,"[""Home Furnishing >> Cushions, Pillows & Covers >> Pillows""]",7999,3370,Buy JDX Plain Bed/Sleeping Pillow at Rs. 3370 at Flipkart.com. Only Genuine Products. Free Shipping. Cash On Delivery!,No rating available,JDX ***
                  *** Myesquire Square Pot Aroma Electric Burner Lemongrass Liquid Air Freshener,"[""Home Decor & Festive Needs >> Candles & Fragrances >> Home Fragrances >> Handheld Air Fresheners >> Myesquire Handheld Air Fresheners""]",1600,628,Buy Myesquire Square Pot Aroma Electric Burner Lemongrass Liquid Air Freshener for Rs.628 online. Myesquire Square Pot Aroma Electric Burner Lemongrass Liquid Air Freshener at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,Myesquire ***
                  *** Myesquire Ceramic Burner Pot Lemongrass Liquid Air Freshener,"[""Home Decor & Festive Needs >> Candles & Fragrances >> Home Fragrances >> Aroma Oils >> Myesquire Aroma Oils""]",349,245,Buy Myesquire Ceramic Burner Pot Lemongrass Liquid Air Freshener for Rs.245 online. Myesquire Ceramic Burner Pot Lemongrass Liquid Air Freshener at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,Myesquire ***
                  *** KalaBhawan Stair Sculpture Showpiece  -  39 cm,"[""Home Decor & Festive Needs >> Table Decor & Handicrafts >> Showpieces >> Human Figurines >> KalaBhawan Human Figurines""]",2199,1399,Buy KalaBhawan Stair Sculpture Showpiece  -  39 cm for Rs.1399 online. KalaBhawan Stair Sculpture Showpiece  -  39 cm at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,KalaBhawan ***
                  *** LG MC3286BLT 32 L Convection Microwave Oven,"[""Home & Kitchen >> Kitchen Appliances >> Microwave Ovens >> LG Microwave Ovens >> LG MC3286BLT 32 L Convection Microwave Oven (Black)""]",18490,16990,"Key Features of LG MC3286BLT 32 L Convection Microwave Oven Type : Convection Capacity : 32 L Control Type : Tact (Buttons) Auto Cook Menu : 301 Auto Indian Cook Menu : 211 Power Output : 900 W Dimensions (WxHxD) : 53 cm x 31.5 cm x 52 cm Weight : 20 kg Turntable Diameter : 34 cm,Specifications of LG MC3286BLT 32 L Convection Microwave Oven (Black) Convenience Features Racks & Trays Available Grill Rack Other Convenience Features Body Massage Oil, Keep Warm, Quick Menu, Custom Cook, Defrost Veg, Defrost Non Veg, Quick Defrost Child Lock Yes Performance Features Other Performance Features Auto Defrost Options, Increase / Decrease Function Preheat Yes Power Levels 5 Defrost Yes Timer Yes General Brand LG Display Type LED Digital Display Shade Black Type Convection Model Name MC3286BLT Frequency 2450 MHz Control Type Tact (Buttons) Capacity 32 L Body and Design Features Turntable Yes Turntable Material Glass Cavity Material Stainless Steel Services Demo Details Demo is provided free of cost.After delivery of your Microwave Oven, you will receive a ticket number via message. Post that, you will receive a call from the authorized service engineer to schedule a mutually convenient time to provide demo at your doorstep.The demo is usually done...View More Demo is provided free of cost.After delivery of your Microwave Oven, you will receive a ticket number via message. Post that, you will receive a call from the authorized service engineer to schedule a mutually convenient time to provide demo at your doorstep.The demo is usually done within 2 days of delivery of your Microwave OvenKindly contact us on 1800 208 9898 FREE for any further queries. Cooking Features Auto Indian Cook Menu 211 Other Cooking Features Diet Fry: 12, Indian Roti Basket: 25, Salad: 13, Tandoor Se: 14, Dosa: 8, Ghee: 1, Soup: 20, Continental Menu: 21, Indian Cuisine: 40, Sweets Corner: 20, Rice Delight: 20, Chatpat Corner: 15, Kid's Delight: 40, Child’s Favourite: 27, Tea / Dairy Delight: 12, Bakery Menu: 13, Utility Corner: 15, Heal...View More Diet Fry: 12, Indian Roti Basket: 25, Salad: 13, Tandoor Se: 14, Dosa: 8, Ghee: 1, Soup: 20, Continental Menu: 21, Indian Cuisine: 40, Sweets Corner: 20, Rice Delight: 20, Chatpat Corner: 15, Kid's Delight: 40, Child’s Favourite: 27, Tea / Dairy Delight: 12, Bakery Menu: 13, Utility Corner: 15, Health Plus: 20, Paneer Curd: 4, Two Stage Cooking, Quick Start, Fast Cook, Beverages, Combination Cooking Cooking Completion Indicator Yes Auto Cook Menu 301 Sales Package 1 Microwave Oven, 1 Glass Turn Table, 1 Roller Ring, 1 Gril Rack & 1 User Manual with Warranty Card Warranty Covered in Warranty Parts & Labour: Covered under Warranty against any Defect arising out of Faulty or Defective Material or Workmanship. Warranty Summary 1 Year Product Warranty from LG Not Covered in Warranty Parts: Main Door/Door Plastic, The Warranty Does Not Cover Accessories External to the Product, The Product is Not Used According to the Instructions Given in the Instruction Manual, Modification or Alteration of Any Nature is Made in the Electrical Circuitry / or Physical Construction of the Set, S...View More Parts: Main Door/Door Plastic, The Warranty Does Not Cover Accessories External to the Product, The Product is Not Used According to the Instructions Given in the Instruction Manual, Modification or Alteration of Any Nature is Made in the Electrical Circuitry / or Physical Construction of the Set, Site (Premises Where the Product is Kept) Conditions That Do Not Confirm to the Recommended Operating Conditions of the Machine, Defects Due to Cause Beyond Control Like Lightning, Abnormal Voltage, Acts of God or While in Transit to Service Centre or Purchaser's Residence. Dimensions Turntable Diameter 34 cm Weight 20 kg Height 31.5 cm Width 53 cm Depth 52 cm Power Features Power Consumption - Convection 2450 W Power Consumption - Microwave 900 W Power Requirement AC 230 V, 50 Hz Power Consumption - Grill 1250 W Power Output 900 W Other Power Features Microwave Output: 900 W Additional Features Other Features Multi Cook Tawa, Light Disinfect, Next Step Guide, Jog Dial Technology Used Intellowave Technology",No rating available,LG ***
                  *** KalaBhawan Stair Sculpture Showpiece  -  39 cm,"[""Home Decor & Festive Needs >> Table Decor & Handicrafts >> Showpieces >> Human Figurines >> KalaBhawan Human Figurines""]",2199,1399,Buy KalaBhawan Stair Sculpture Showpiece  -  39 cm for Rs.1399 online. KalaBhawan Stair Sculpture Showpiece  -  39 cm at best prices with FREE shipping & cash on delivery. Only Genuine Products. 30 Day Replacement Guarantee.,No rating available,KalaBhawan ***
                  *** Weldecor Picture Light Wall Lamp,"[""Home Decor & Festive Needs >> Decorative Lighting & Lamps >> Wall Lamps >> Weldecor Wall Lamps >> Weldecor Picture Light Wall Lamp (2)""]",7999,2399,"Key Features of Weldecor Picture Light Wall Lamp HandMade Carved Brass,Weldecor Picture Light Wall Lamp (2) Price: Rs. 2,999 Feel royal and get spoiled with the sparkling gold Weldecor Lighting Downward Double Shade Picture Light/SpotLight. Made of antique finished brass, it is a hand carved masterpiece. It comes with Two B22 holder(Indian two pin holder). It is compatible with every type of CFL or LED, Glass Bulbs. MAKE IN INDIA,Specifications of Weldecor Picture Light Wall Lamp (2) General Mount Type Surface Mounted Bulb Included No Brand Color Brass Brand Weldecor Suitable For Display Light, Mirror Light, Spot Light Bulb Used LED, CFL Model Number WD-DoublePL-1004 Number of Lights 2 Type Picture Light Material Brass Adjustable Yes Color Gold Dimensions Weight 200 g Height 20 cm Width 31 cm In the Box 1 Picture Light",No rating available,Weldecor ***
                  *** Prime Printed 6 Seater Table Cover,"[""Home Furnishing >> Kitchen & Dining Linen >> Table Covers >> Prime Printed 6 Seater Table Cover (Multicolor, ...""]",1800,849,"Key Features of Prime Printed 6 Seater Table Cover Length 78 inch/198 cm Width 54 inch/137 cm,Prime Printed 6 Seater Table Cover (Multicolor, PVC) Price: Rs. 849 Prime Dining Table Cover Printed 6 Seater,Specifications of Prime Printed 6 Seater Table Cover (Multicolor, PVC) In The Box Number of Contents in Sales Package Pack of 1 General Brand Prime Type Table Cover Model Name P272 Material PVC Model ID 272 Color Multicolor Dimensions Weight 450 g Length 78 inch / 198 cm Width 54 inch / 137 cm Seating Capacity 6 Seater",5,Prime ***
                  *** SHEFFIELD CLASSIC SH-83-VC1 Hand-held Vacuum Cleaner,"[""Home & Kitchen >> Home Appliances >> Vacuum Cleaners >> SHEFFIELD CLASSIC Vacuum Cleaners >> SHEFFIELD CLASSIC SH-83-VC1 Hand-held Vacuum Cle...""]",4195,1800,"SHEFFIELD CLASSIC SH-83-VC1 Hand-held Vacuum Cleaner (ORANGE) Price: Rs. 1,800 VACCUM CLEANER CUM BLOWER, TO KEEP YOUR HOUSE SAFE AND CLEAN. WITH DIFFERENT TYPES OF ATTACHMENT *WATTAGE 800W, *SUCTION FEATURE *DUST CAPACITY: 0.7 L *VACCUM: > = 11.5 KPA *NOISE: Was this product information helpful? Yes No Thanks for your vote! Please write your feedback before submitting. Skip Specifications of SHEFFIELD CLASSIC SH-83-VC1 Hand-held Vacuum Cleaner (ORANGE) General Type Hand-held Vacuum Cleaner Dimensions Net Weight 2.380 kg W x H x D 14 x 25 In the Box Sales Package 1 VACCUM CLEANER CUM BLOWER Was the product specification helpful? Yes No Thanks for your vote! Please write your feedback before submitting. Skip Please Note: All products sold on Flipkart are brand new and 100% genuine,Specifications of SHEFFIELD CLASSIC SH-83-VC1 Hand-held Vacuum Cleaner (ORANGE) General Type Hand-held Vacuum Cleaner Dimensions Net Weight 2.380 kg W x H x D 14 x 25 In the Box Sales Package 1 VACCUM CLEANER CUM BLOWER",No rating available,SHEFFIELD CLASSIC ***
                  *** Craft Trade Oval Wood Coaster Set,"[""Home Furnishing >> Kitchen & Dining Linen >> Coasters >> Craft Trade Coasters >> Craft Trade Oval Wood Coaster Set (Brown, Pack o...""]",790,299,"Key Features of Craft Trade Oval Wood Coaster Set Hand Crafted Antique Coaster Apple Shaped Coaster Set,Craft Trade Oval Wood Coaster Set (Brown, Pack of 6) Price: Rs. 299 ""Decorate your with this amazing handcrafted Apple shaped coaster set of 6. This coaster set has a been inspired by apple design, which will surely make you fall in love with it. This product has been hand crafted by the artists of Rajasthan and is made up of fine quality wood. It comes with an Apple shaped stand to store it on your table and make it look amazing. It has a long life and will protect you table from stains. Authentic hand Crafted Product from craft Trade Artisans. "",Specifications of Craft Trade Oval Wood Coaster Set (Brown, Pack of 6) General Shape Oval Brand Craft Trade Reversible Yes Design Code CT55 Type Coaster Set Material Wood Style Code WD1001 Pattern Self Design Padding Yes, Wood Color Brown Warranty Covered in Warranty 7 days relacement warranty in case of manufacturing defects Dimensions Holder Width 8 cm Weight 230 g Coaster Width 8 cm Holder Height 8 cm Coaster Diameter 8 cm Holder Diameter 8 cm Coaster Length 2 cm Coaster Thickness 2 cm Additional Features Strain Free In the Box Number of Contents in Sales Package Pack of 6 Sales Package 1 Coaster Holder with 6 Coasters",No rating available,Craft Trade ***

                  **** Current Trends (C) <product, selling_frequency, avg_rating> ****
                  *** Curtains , 18, 4.0 ***
                  *** Sofa , 10, 4.5 ***
                  *** Room Freshner , 8, 4.2 ***
                  *** Bedsheet, 25, 4.3 ***
                  *** Dining Table, 12, 4.7 ***
                  *** Table Lamp, 14, 4.1 ***

                  **** Past History (P) <Product, purchase_type, Review> ****
                  *** FabHomeDecor Fabric Double Sofa Bed, Bought, "Very comfortable and stylish. Perfect for my small apartment. The fold-out bed is a bonus, though the delivery took longer than expected." ***
                  *** Eternal Gandhi Super Series Crystal Paper Weights, Wishlist, "Looks elegant and would be a great addition to my home office. Planning to buy soon once I finalize my decor. ***
                  *** Huesland 144 TC Cotton Double Bedsheet, Bought, "The fabric quality is excellent, and the colors are just as shown online. It fits my bed perfectly. Happy with the purchase. ***
                  *** Duroflex Memory Foam Pillow, Bought, "Absolutely worth it! The memory foam provides great support for my neck. I’ve had better sleep since buying it. ***
                  *** Urban Ladder Wooden Coffee Table, Bought, "Love the minimalist design! Fits perfectly in my living room, and the wood finish is top-notch. It’s sturdy and well-crafted. ***

                  **** Session History (H) ****


                  **** Offers (O)  <Product_Category, Discout(%)> ****
                  *** Home & Kitchen, 20 to 30% ***
                  *** Decor , 20% ***
                  *** Furniture , 30 to 40 % ***
                  *** Home Appliances, upto 50% ***
                  *** Curtains & Blinds, 15 to 25% ***
                  *** Bedding & Linen, 20 to 35% ***
                  *** Lighting, 10 to 20% ***

                  *** User Query Will follow in the next chat ***
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
