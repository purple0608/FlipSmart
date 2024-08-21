from elevenlabs import play
from elevenlabs.client import ElevenLabs
import argparse

client = ElevenLabs(
  api_key='sk_799b23489515a01b5c5325e5d67a23a460a1a61537cae4f6', # Defaults to ELEVEN_API_KEY
)

def text_to_speech(t):

    audio = client.generate(
    text=t,
    voice="Rachel",
    model="eleven_multilingual_v2"
    )
    audio_data = b''.join(audio) 
    with open("output_audio.mp3", "wb") as f:
        f.write(audio_data)
    
    
    return audio

# play(audio)
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert text to speech.')
    parser.add_argument('text', type=str, help='The text to convert to speech.')
    args = parser.parse_args()
    
    # Call the text_to_speech function with the provided text
    result = text_to_speech(args.text)
    print(result)
