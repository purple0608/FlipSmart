import os
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import azure.cognitiveservices.speech as speechsdk
from flask_socketio import SocketIO

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=["http://localhost:5173"])

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173"])

recognizer_thread = None
stop_event = threading.Event()

# In-memory variable to store recorded text
recorded_text = ""
recorded_text_lock = threading.Lock()

def write_to_text(text):
    global recorded_text
    with recorded_text_lock:
        recorded_text += text + '\n'

def speak_to_microphone(api_key, region):
    global stop_event
    speech_config = speechsdk.SpeechConfig(subscription=api_key, region=region)
    speech_config.speech_recognition_language = "en-US"
    speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "60000")
    speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "20000")
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("Speak into your microphone. Say 'stop session' to end.")
    while not stop_event.is_set():
        speech_recognition_result = speech_recognizer.recognize_once_async().get()

        if speech_recognition_result.reason == speechsdk.ResultReason.RecognizedSpeech:
            recognized_text = speech_recognition_result.text
            print(f"Recognized: {recognized_text}")
            socketio.emit('speech_recognized', {'text': recognized_text})
            write_to_text(recognized_text)
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

# @app.route('/stop-recording', methods=['POST'])
# def stop_recording():
#     global stop_event, recorded_text
#     stop_event.set()
#     if recognizer_thread is not None:
#         recognizer_thread.join()

#     # After stopping the recording, send the stored text to Express backend
#     try:
#         response = requests.post('http://localhost:3000/chat', json={'message': recorded_text})
#         if response.status_code == 200:
#             # Clear the recorded text after successful send
#             with recorded_text_lock:
#                 recorded_text = ""
#             return jsonify({"status": "Recording stopped and data sent to Express backend"})
#         else:
#             return jsonify({"status": "Failed to send data to Express backend"}), response.status_code

#     except Exception as e:
#         return jsonify({"status": f"Error: {str(e)}"}), 500

# @app.route('/stop-recording', methods=['POST'])
# def stop_recording():
#     global stop_event, recorded_text
#     stop_event.set()
#     if recognizer_thread is not None:
#         recognizer_thread.join()

#     # After stopping the recording, write the recorded text to a file
#     try:
#         with open('recorded_text.txt', 'w') as file:
#             file.write(recorded_text)
        
#         # Clear the recorded text after writing to file
#         with recorded_text_lock:
#             recorded_text = ""

#         return jsonify({"status": "Recording stopped and text written to file"})
#     except Exception as e:
#         return jsonify({"status": f"Error: {str(e)}"}), 500


@app.route('/stop-recording', methods=['POST'])
def stop_recording():
    global stop_event, recorded_text, recognizer_thread

    stop_event.set()
    if recognizer_thread is not None:
        recognizer_thread.join()

    try:
        # Write the recorded text to a file
        with open('recorded_text.txt', 'w') as file:
            file.write(recorded_text)
        
        # Read the file content to include in the response
        with open('recorded_text.txt', 'r') as file:
            file_content = file.read()
        
        # Clear the recorded text after writing to file
        with recorded_text_lock:
            recorded_text = ""

        # Return JSON response with file content
        return jsonify({
            "status": "Recording stopped and text written to file",
            "file_content": file_content
        })

    except Exception as e:
        return jsonify({"status": f"Error: {str(e)}"}), 500


# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("api_key")
region = os.getenv("region")

if not api_key or not region:
    raise ValueError("API key or region not found in environment variables.")

# Run the Flask app with SocketIO
if __name__ == '__main__':
    socketio.run(app, port=5000, debug=True)
