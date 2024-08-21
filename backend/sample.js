import { ElevenLabsClient, ElevenLabs } from 'elevenlabs';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

const client = new ElevenLabsClient({
  apiKey: 'sk_799b23489515a01b5c5325e5d67a23a460a1a61537cae4f6'
});

async function convertTextToSpeech() {
  try {
    const response = await client.textToSpeech.convert({
      voice_id: 'pMsXgVXv3BLzUgSXRplE',
      optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
      output_format: ElevenLabs.OutputFormat.Mp32205032,
      text: "It sure does, Jackie… My mama always said: “In Carolina, the air's so thick you can wear it!”",
      voice_settings: {
        stability: 0.1,
        similarity_boost: 0.3,
        style: 0.2
      }
    });

    // Check if response.readableStream exists and is a valid stream
    if (response.readableStream && typeof response.readableStream.pipe === 'function') {
      await pipelineAsync(
        response.readableStream,
        fs.createWriteStream('output.mp3')
      );
      console.log('Audio file saved successfully.');
    } else {
      console.error('The response does not contain a valid readable stream.');
    }
  } catch (error) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
  }
}

convertTextToSpeech();
