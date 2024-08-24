from elevenlabs import play
from elevenlabs.client import ElevenLabs
import argparse

client = ElevenLabs(
  api_key='sk_34302a622119c5d84520c5fe2bcbf9ea6d1077c0820c3177', # Defaults to ELEVEN_API_KEY
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
