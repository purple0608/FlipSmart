import { useRef, useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import io from "socket.io-client";
import "../index.css";

import { AvatarContext } from "../hooks/AvatarProvider";
import TopProducts from "./TopProducts";
import ChatToggle from "./ChatToggle";
import { FaMicrophone, FaStop, FaChevronDown, FaTrash } from "react-icons/fa";

const socket = io("http://127.0.0.1:5000", {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Debug socket connection
socket.on('connect', () => console.log('Socket connected'));
socket.on('connect_error', (err) => console.error('Socket connection error:', err));

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const navigate = useNavigate();
  const { 
    chat, 
    message, 
    onMessagePlayed, 
    loading, 
    cameraZoomed, 
    setCameraZoomed, 
    isAvatarSpeaking,
    chatHistory,
    clearHistory,
    loadMoreHistory,
    isLoadingHistory,
    isDemoMode,
    stopSpeaking
  } = useChat();
  
  const [recording, setRecording] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [usingClientTTS, setUsingClientTTS] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  const messageContainerRef = useRef();
  const chatEndRef = useRef();
  const { avatar, setAvatar } = useContext(AvatarContext);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && input.current.value) {
      e.preventDefault();
      const messageText = input.current.value.trim();
      if (messageText) {
        chat(messageText);
        input.current.value = "";
        scrollToBottom();
      }
    }
  };

  const sendVoiceText = (text) => {
    if (!text || text.trim() === "") {
      console.log("Empty voice text, not sending.");
      setProcessingAudio(false);
      return;
    }

    console.log("Sending voice text:", text);
    // Don't call setTranscription again as we've already set it in stopRecording
    chat(text);
    scrollToBottom();
    setProcessingAudio(false);
  };

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
    if (input.current && input.current.value) {
      const messageText = input.current.value.trim();
      if (messageText) {
        chat(messageText);
        input.current.value = "";
        scrollToBottom();
      }
    }
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!loading) { 
      sendMessage();
    }
  };

  const goToHome = () => {
    navigate("/");
  };

  const toggleRecording = async () => {
    // Don't record when avatar is speaking
    if (isAvatarSpeaking) {
      console.log("Avatar is speaking, please wait...");
      return;
    }

    // Don't allow starting a new recording if we're currently processing audio
    if (processingAudio) {
      console.log("Still processing previous audio, please wait...");
      return;
    }

    if (!recording) {
      console.log("Starting recording...");
      setRecording(true);
      setTranscription(""); // Clear previous transcription

      try {
        // Try both localhost and 127.0.0.1 as sometimes localhost doesn't resolve properly
        const url = "http://127.0.0.1:5000/start-recording";
        console.log("Connecting to:", url);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to start recording:", response.status);
          setRecording(false);
        } else {
          console.log("Recording started successfully");
        }
      } catch (error) {
        console.error("Error starting recording:", error);
        setRecording(false);
      }
    } else {
      stopRecording();
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    // Set processing state to prevent new recording attempts
    setProcessingAudio(true);
    
    try {
      console.log("Stopping recording and getting transcription...");
      const url = "http://127.0.0.1:5000/stop-recording";
      console.log("Connecting to:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to stop recording.");
        return;
      }

      const data = await response.json();
      const fileContent = data.file_content;
      console.log("Received transcription:", fileContent);
      
      // Update transcription immediately for display
      setTranscription(fileContent);
      
      // Only send if we have actual content
      if (fileContent && fileContent.trim() !== "") {
        // Wait a bit to allow the user to see the transcription
        setTimeout(() => {
          sendVoiceText(fileContent);
        }, 500);
      } else {
        console.log("No voice content to send");
        setProcessingAudio(false);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      setProcessingAudio(false);
    }
  };

  const changeAvatar = (newAvatar) => {
    setAvatar(newAvatar);
  };

  // Listen for messages from the chatbot
  useEffect(() => {
    if (message && chatHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
      // Check if the current message is using client TTS
      setUsingClientTTS(message.usingClientTTS === true);
    }
  }, [chatHistory, message]);

  // Reset client TTS flag when avatar stops speaking
  useEffect(() => {
    if (!isAvatarSpeaking) {
      setUsingClientTTS(false);
    }
  }, [isAvatarSpeaking]);

  const scrollToBottom = useCallback(() => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // Small delay to ensure DOM updates are complete
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (!messageContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    // Show button when scrolled up more than 100px from bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isScrolledUp);
    
    // Check if we need to load more history when scrolled to top
    if (scrollTop < 50 && chatHistory.length > 10 && !isLoadingHistory) {
      loadMoreHistory();
    }
  }, [chatHistory.length, isLoadingHistory, loadMoreHistory]);

  useEffect(() => {
    const messageContainer = messageContainerRef.current;
    if (messageContainer) {
      messageContainer.addEventListener('scroll', handleScroll);
      return () => messageContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    socket.on("speech_recognized", (data) => {
      // Only update the transcription display here
      // The actual sending of the message is handled by sendVoiceText after stopRecording
      setTranscription(data.text);
    });

    return () => {
      socket.off("speech_recognized");
    };
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Fixed UI Elements that always remain visible */}
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 pointer-events-none">
        <div className="flex justify-between p-4 flex-col h-full">
          {/* Top Nav Buttons */}
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              )}
            </button>
          </div>

          {/* Chat Input - Always visible */}
          <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
            <input
              className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
              placeholder="Type a message..."
              ref={input}
              onKeyDown={handleKeyPress}
            />
            <button
              disabled={loading || isAvatarSpeaking}
              onClick={sendMessage}
              className={`bg-blue-500 hover:bg-blue-900 text-white p-4 px-10 font-semibold uppercase rounded-md ${
                (loading || isAvatarSpeaking) ? "cursor-not-allowed opacity-30" : ""
              }`}
            >
              Send
            </button>
            <div className="flex gap-2 items-center">
              <button
                onClick={toggleRecording}
                className={`
                  ${recording ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600"}
                  text-white p-4 rounded-full flex items-center justify-center transition-colors
                  ${processingAudio || loading || isAvatarSpeaking ? "opacity-50 cursor-not-allowed" : ""}
                `}
                disabled={processingAudio || loading || isAvatarSpeaking}
                title={recording ? "Stop recording" : "Start recording"}
              >
                <FaMicrophone size={16} />
              </button>
              
              <button
                onClick={stopSpeaking}
                className={`
                  bg-red-500 hover:bg-red-600 text-white p-4 rounded-full 
                  flex items-center justify-center transition-colors
                  ${!isAvatarSpeaking ? "opacity-50 cursor-not-allowed" : ""}
                `}
                disabled={!isAvatarSpeaking}
                title="Stop AI response"
              >
                <FaStop size={16} />
              </button>
              
              <button
                onClick={clearHistory}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 p-4 rounded-full flex items-center justify-center transition-colors"
                title="Clear chat history"
              >
                <FaTrash size={16} />
              </button>
            </div>
          </div>
          
          {/* Recording Status */}
          {(recording || processingAudio) && (
            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 p-4 bg-black bg-opacity-50 text-white rounded-md pointer-events-auto">
              {processingAudio ? "Processing..." : transcription || "Listening..."}
            </div>
          )}

          {/* Loading Status */}
          {loading && (
            <div className="fixed bottom-[calc(20px+420px)] right-10 bg-gradient-to-r from-gray-200 to-gray-500 p-3 rounded-md shadow-lg w-[200px] pointer-events-auto">
              <div className="relative">Loading...</div>
            </div>
          )}

          {/* Avatar Selection Menu - Only visible when NOT in demo mode */}
          {!isDemoMode && (
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
                <span className="blue-gradient_text font-semibold h">Jeevan</span>
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
                <span className="blue-gradient_text font-semibold">Meera</span>
              </div>

              {/* <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
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
                <span className="blue-gradient_text font-semibold"> AI</span>
              </div> */}

              {/* <div className="pointer-events-auto hover:bg-blue-600 w-32 h-32 flex flex-col p-3 items-center gap-2 rounded-lg bg-white">
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
              </div> */}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Toggle Button - Fixed at bottom right */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <ChatToggle onToggle={(isVisible) => setIsChatVisible(isVisible)} />
      </div>

      {/* Chat Window - Only this is collapsible */}
      <div 
        className={`fixed bottom-20 right-4 bg-gradient-to-r from-blue-700 to-purple-400 p-4 rounded-md shadow-lg w-[500px] h-[420px] z-20 pointer-events-auto 
                    transition-all duration-300 ease-in-out transform ${isChatVisible ? 'translate-x-0 opacity-100' : 'translate-x-[520px] opacity-0'}`}
      >
        <div className="text-white text-lg font-semibold mb-2">
          {isDemoMode ? "InfoEdge Assistant: Meera" : "InfoEdge Assistant: InfoSmart"}
        </div>

        {/* Chat Messages */}
        <div
          ref={messageContainerRef}
          className="h-[320px] overflow-y-scroll flex flex-col custom-scrollbar px-2"
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: '#A0AEC0 #EDF2F7',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isLoadingHistory && (
            <div className="text-center py-2 text-white text-sm opacity-75">
              Loading older messages...
            </div>
          )}
          
          {/* Chat Messages */}
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`message py-2 rounded animate-pop mb-2 ${msg.isUser ? 'ml-12 mr-2' : 'mr-12 ml-2'}`}
              style={{
                color: "white",
                backgroundColor: msg.isUser 
                  ? "rgba(55, 65, 81, 0.8)" 
                  : msg.isError 
                    ? "rgba(220, 38, 38, 0.7)" 
                    : "rgba(17, 24, 39, 0.8)",
                backdropFilter: "blur(10px)",
                textAlign: msg.isUser ? "right" : "left",
                borderRadius: msg.isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "10px 16px",
              }}
            >
              <div className="flex flex-col">
                <span className="text-xs opacity-60 mb-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                
                {msg.isTypingIndicator ? (
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Thinking</span>
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm">{msg.text}</span>
                )}
              </div>
            </div>
          ))}
          
          <div ref={chatEndRef} style={{ marginBottom: '8px' }} />
          
          {showScrollButton && (
            <button 
              onClick={scrollToBottom}
              className="absolute bottom-16 right-4 bg-gray-800 bg-opacity-60 text-white rounded-full p-3 shadow-lg"
              style={{ backdropFilter: "blur(5px)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
