from google.cloud import texttospeech
import argparse
import os

# Set up environment variable for Google Application Credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'flipkart-433216-a02082277fd0.json'

def text_to_speech(t):
    # Instantiate a client
    client = texttospeech.TextToSpeechClient()

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=t)

    # Build the voice request, select the language code ("en-US") and the SSML
    # voice gender ("neutral")
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    # The response's audio_content is binary.
    audio_data = response.audio_content
    with open("output_audio.mp3", "wb") as f:
        f.write(audio_data)

    return "output_audio.mp3"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert text to speech using Google Cloud Text-to-Speech.')
    parser.add_argument('text', type=str, help='The text to convert to speech.')
    args = parser.parse_args()
    
    # Call the text_to_speech function with the provided text
    audio_file = text_to_speech(args.text)
    print(f'Audio content written to file "{audio_file}"')
