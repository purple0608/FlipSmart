import { useRef, useState, useEffect, useContext } from "react";
import { useChat } from "../hooks/useChat";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { AvatarContext } from "../hooks/AvatarProvider";

const socket = io("http://localhost:5000");

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const navigate = useNavigate();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const { avatar, setAvatar } = useContext(AvatarContext);
  const [messages, setMessages] = useState(() => {
    // Initialize messages from session storage
    const storedMessages = sessionStorage.getItem("messages");
    return storedMessages ? JSON.parse(storedMessages) : [
      { text: "Hello! Welcome to Flipkart.", type: 'message' }
    ];
  });
  const messageContainerRef = useRef(null);

  const changeAvatar = (newAvatar) => {
    setAvatar(newAvatar);
  };

  useEffect(() => {
    if (message) {
      setMessages((prevMessages) => {
        const newMessages = [{ text: message.text, type: 'message' }, ...prevMessages];
        // Store updated messages in session storage
        sessionStorage.setItem("messages", JSON.stringify(newMessages));
        return newMessages;
      });
    }
  }, [message]);

  // useEffect(() => {
  //   if (transcription) {
  //     setMessages((prevMessages) => [{ text: transcription, type: 'transcription' }, ...prevMessages]);
  //   }
  // }, [transcription]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollBottom = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    socket.on("speech_recognized", (data) => {
      setTranscription(data.text);
      setMessages((prevList) => {
        const newList = [{ text: data.text, type: 'transcription' }, ...prevList];
        if (newList.length > 50) {
          storeRemovedChats(newList.slice(50));
          // Clear list and reset session storage
          sessionStorage.setItem("messages", JSON.stringify([]));
          return newList.slice(0, 50);
        }
        return newList;
      });
    });

    return () => {
      socket.off("speech_recognized");
    };
  }, []);

  const storeRemovedChats = async (chats) => {
    try {
      await fetch("http://localhost:5000/store-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chats }),
      });
    } catch (error) {
      console.error("Error storing removed chats:", error);
    }
  };

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message) {
      chat(text);
      input.current.value = "";
    }
  };

  const sendVoiceText = (data) => {
    chat(data);
  };

  const goToHome = () => {
    navigate("/");
  };

  const startRecording = async () => {
    if (!recording) {
      setRecording(true);
      setTranscription(""); // Clear previous transcription

      try {
        const response = await fetch("http://localhost:5000/start-recording", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to start recording.");
        }
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    try {
      const response = await fetch("http://localhost:5000/stop-recording", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const fileContent = data.file_content;
      sendVoiceText(fileContent);

      if (!response.ok) {
        console.error("Failed to stop recording.");
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        <div className="absolute bg-white rounded-md shadow-md p-2">
          <img
            src="/flipkart.webp"
            alt="Flipkart Logo"
            className="w-32 h-auto hover:filter hover:brightness-110 transition-all duration-300"
          />
        </div>

        <div className="w-full flex flex-col items-end justify-center gap-4">
          <button
            onClick={goToHome}
            className="pointer-events-auto bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-md"
          >
            <img src="/home.svg" alt="Home" className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="pointer-events-auto bg-gray-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            {cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )}
          </button>

          <button
            onClick={startRecording}
            className={`pointer-events-auto text-white p-4 rounded-md ${
              recording
                ? "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700"
                : "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            } flex items-center justify-center`}
          >
            {recording ? (
              <img src="/mon.svg" alt="Recording" className="w-6 h-6" />
            ) : (
              <img src="/moff.svg" alt="Not recording" className="w-6 h-6" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
          <input
            className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
            placeholder="Type a message..."
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-blue-500 hover:bg-blue-900 text-white p-4 px-10 font-semibold uppercase rounded-md ${
              loading || message ? "cursor-not-allowed opacity-30" : ""
            }`}
          >
            Send
          </button>
        </div>

        {recording && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 p-4 bg-black bg-opacity-50 text-white rounded-md">
            {transcription || "Listening..."}
          </div>
        )}

        <div className="fixed bottom-20 right-4 bg-gradient-to-r from-blue-700 to-purple-400 p-4 rounded-md shadow-lg w-[500px] h-[420px] opacity-80">
          <div className="text-white text-lg font-semibold mb-2">
            Flipkart Assistant
          </div>

          <div
            ref={messageContainerRef}
            className="h-[320px] overflow-y-auto flex flex-col-reverse"
          >
            {messages.map((message, index) => (
              <div
                key={`message-${index}`}
                className={`p-2 mb-2 bg-transparent rounded-md shadow-sm animate-pop ${
                  message.type === 'transcription'
                    ? "self-start"
                    : "self-end"
                }`}
              >
                <div
                  className={`relative p-3 rounded-md shadow-md max-w-[100%] ${
                    message.type === 'transcription'
                      ? "bg-green-300 ml-0"
                      : "bg-white mr-0"
                  } ${
                    message.type === 'transcription' ? "ml-0" : "mr-auto"
                  }`}
                >
                  <div
                    className={`absolute ${
                      message.type === 'transcription'
                        ? "-left-2"
                        : "-right-2"
                    } w-0 h-0 border-t-4 border-r-transparent`}
                  ></div>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="fixed bottom-[calc(20px+420px)] right-10 bg-gradient-to-r from-gray-200 to-gray-500 p-3 rounded-md shadow-lg w-[200px]">
            <div className="relative">Loading...</div>
          </div>
        )}

        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 flex flex-col items-center gap-3 p-2 bg-transparent rounded-md shadow-md">
          <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
            <button
              onClick={() => changeAvatar("/avatar1.glb")}
              className="w-20 h-20 bg-gray-200 rounded-full"
            >
              <img
                src="tech_avatar.avif"
                alt="Avatar 1"
                className="w-20 h-20 object-cover rounded-full"
              />
            </button>
            <span className="blue-gradient_text font-semibold">Tech AI</span>
          </div>

          <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
            <button
              onClick={() => changeAvatar("/avatar2.glb")}
              className="w-20 h-20 bg-gray-200 rounded-full"
            >
              <img
                src="/home_avatar.jpg"
                alt="Avatar 2"
                className="w-20 h-20 object-cover rounded-full"
              />
            </button>
            <span className="blue-gradient_text font-semibold">Home AI</span>
          </div>

          <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
            <button
              onClick={() => changeAvatar("/avatar3.glb")}
              className="w-20 h-20 bg-gray-200 rounded-full"
            >
              <img
                src="/fashion_avatar.avif"
                alt="Avatar 3"
                className="w-20 h-20 object-cover rounded-full"
              />
            </button>
            <span className="blue-gradient_text font-semibold">Fashion AI</span>
          </div>

          <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
            <button
              onClick={() => changeAvatar("/avatar4.glb")}
              className="w-20 h-20 bg-gray-200 rounded-full"
            >
              <img
                src="/gifts_avatar.jpg"
                alt="Avatar 4"
                className="w-20 h-20 object-cover rounded-full"
              />
            </button>
            <span className="blue-gradient_text font-semibold">Gifts AI</span>
          </div>
        </div>
      </div>
    </>
  );
};
