import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
from flask_socketio import SocketIO, emit

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow requests from your React app
CORS(app, origins=["http://localhost:5173"])

# Initialize SocketIO with CORS settings
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173"])

recognizer_thread = None
stop_event = threading.Event()

def speak_to_microphone(api_key, region):
    global stop_event
    # Create a speech configuration object
    speech_config = speechsdk.SpeechConfig(subscription=api_key, region=region)
    speech_config.speech_recognition_language = "en-US"
    
    # Set timeout durations on the speech_config object
    speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "60000")
    speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "20000")

    # Set up audio configuration for default microphone
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)

    # Create a speech recognizer
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("Speak into your microphone. Say 'stop session' to end.")
    
    while not stop_event.is_set():
        # Recognize speech asynchronously
        speech_recognition_result = speech_recognizer.recognize_once_async().get()

        if speech_recognition_result.reason == speechsdk.ResultReason.RecognizedSpeech:
            recognized_text = speech_recognition_result.text
            print(f"Recognized: {recognized_text}")
            socketio.emit('speech_recognized', {'text': recognized_text})  # Emit recognized text to the client
            if "stop session" in recognized_text.lower():
                print("Session ended by user.")
                break
        elif speech_recognition_result.reason == speechsdk.ResultReason.NoMatch:
            print("No speech could be recognized.")
        elif speech_recognition_result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = speech_recognition_result.cancellation_details
            print(f"Speech Recognition canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                print(f"Error details: {cancellation_details.error_details}")

@app.route('/start-recording', methods=['POST'])
def start_recording():
    global recognizer_thread, stop_event
    if recognizer_thread is None or not recognizer_thread.is_alive():
        stop_event.clear()
        recognizer_thread = threading.Thread(target=speak_to_microphone, args=(api_key, region))
        recognizer_thread.start()
        return jsonify({"status": "Recording started"})
    else:
        return jsonify({"status": "Recording is already running"})

@app.route('/stop-recording', methods=['POST'])
def stop_recording():
    global stop_event
    stop_event.set()
    if recognizer_thread is not None:
        recognizer_thread.join()
    return jsonify({"status": "Recording stopped"})

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("api_key")
region = os.getenv("region")

# Ensure the environment variables are set
if not api_key or not region:
    raise ValueError("API key or region not found in environment variables.")

# Run the Flask app with SocketIO
if __name__ == '__main__':
    socketio.run(app, port=5000, debug=True)
