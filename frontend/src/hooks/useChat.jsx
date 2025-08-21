import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const backendUrl = 'http://localhost:3000';
const ChatContext = createContext();

// Helper function to load chat history from localStorage
const loadChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

// Helper function to save chat history to localStorage
const saveChatHistory = (history) => {
  try {
    localStorage.setItem('chatHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

export const ChatProvider = ({ children }) => {
  // Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  // Product context override for demo mode
  const [contextOverride, setContextOverride] = useState(null);
  // Queue of messages to be spoken by the avatar
  const [messages, setMessages] = useState([]);
  // Current message being spoken
  const [message, setMessage] = useState(null);
  // Complete conversation history (both user and AI responses)
  const [chatHistory, setChatHistory] = useState(loadChatHistory);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // Track if greeting has been shown
  const [greetingShown, setGreetingShown] = useState(false);
  const [startTour, setStartTour] = useState(false); // To trigger the tour

  const chat = async (messageText) => {
    setLoading(true);
    
    // Immediately add user message to history
    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      text: messageText,
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prevHistory => {
      const updatedHistory = [...prevHistory, userMessage];
      saveChatHistory(updatedHistory);
      return updatedHistory;
    });
    
    // Add typing indicator
    const typingIndicatorId = uuidv4();
    const typingMessage = {
      id: typingIndicatorId,
      text: "Thinking...",
      isTypingIndicator: true,
      isUser: false,
      timestamp: new Date().toISOString(),
      replyToMessageId: userMessageId
    };
    
    setChatHistory(prevHistory => [...prevHistory, typingMessage]);
    
    try {
      console.log("Sending message to backend: ", messageText);
      console.log("Demo mode: ", isDemoMode);
      console.log("Context override: ", contextOverride);
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          isDemoMode,
          contextOverride
        }),
        // credentials: 'include',
      });
      
      const data = await response.json();
      
      // Remove typing indicator
      setChatHistory(prevHistory => prevHistory.filter(msg => msg.id !== typingIndicatorId));
      
      if (data && data.messages && data.messages.length > 0) {
        // Check for custom action to start the tour
        if (data.messages[0].action === 'start_tour') {
          console.log("Starting tour triggered from useChat");
          localStorage.removeItem('walkthrough');
          setStartTour(true); // Signal to start the tour
          // We don't want to add "Starting tour.." to chat history or speak it
          setLoading(false);
          return;
        }

        const newMessages = data.messages.map(msg => ({
          ...msg,
          id: uuidv4(),
          isUser: false,
          timestamp: new Date().toISOString(),
          replyToMessageId: userMessageId
        }));
        
        setChatHistory(prevHistory => {
          const updatedHistory = [...prevHistory, ...newMessages];
          saveChatHistory(updatedHistory);
          return updatedHistory;
        });
        
        // Update the message queue for the avatar to speak
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Remove typing indicator on error
      setChatHistory(prevHistory => prevHistory.filter(msg => msg.id !== typingIndicatorId));
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        isError: true,
        timestamp: new Date().toISOString(),
        replyToMessageId: userMessageId
      };
      
      setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const onMessagePlayed = () => {
    console.log('Message played, moving to next message if any');
    
    // First set avatar as not speaking
    setIsAvatarSpeaking(false);
    
    // Remove the current message from the state
    setMessage(null);
    
    setMessages(prevMessages => {
      // If there are more messages in the queue, remove just the first one
      if (prevMessages.length > 1) {
        console.log(`Moving to next message. ${prevMessages.length-1} messages remaining`);
        return prevMessages.slice(1);
      } else {
        // If this was the last message, clear the queue
        console.log('No more messages in queue');
        return [];
      }
    });
  };
  
  const clearHistory = () => {
    setChatHistory([]);
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };
  
  const loadMoreHistory = () => {
    // This is a placeholder for pagination if needed
    // In a real implementation, you would load older messages from backend
    setIsLoadingHistory(true);
    setTimeout(() => {
      setIsLoadingHistory(false);
    }, 500);
  };

  // Check if it's the first load and show greeting
  useEffect(() => {
    // On initial load, always reset demo mode and clear history
    setIsDemoMode(false);
    setContextOverride(null);
    clearHistory();

    
    const showInitialGreeting = async () => {
      // Only show greeting if no chat history and greeting hasn't been shown yet
      if (chatHistory.length === 0 && !greetingShown) {
        setGreetingShown(true);
        setLoading(true);
        
        try {
          const response = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: "", // Empty message triggers the default greeting
            }),
          });
          
          if (!response.ok) throw new Error('Failed to fetch greeting');
          
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            // Add AI response to messages queue for avatar to speak
            setMessages(data.messages);
            
            // Add to chat history
            const aiMessage = {
              id: uuidv4(),
              // Use demo mode greeting if demo mode is active
              text: isDemoMode ? "Hi I am Meera Your 3D demo buddy!" : "Hi i am meera , I am your 3D AI assistant. Ask me anything , I will be happy to help you",
              isUser: false,
              timestamp: new Date().toISOString(),
            };
            
            setChatHistory([aiMessage]);
            saveChatHistory([aiMessage]);
          }
        } catch (error) {
          console.error('Error fetching initial greeting:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    showInitialGreeting();
  }, []); // Run once on component mount

  useEffect(() => {
    if (!messages.length && message === null) {
      return;
    }
    
    if (messages.length > 0 && !message) {
      console.log('Setting current message:', messages[0].text?.substring(0, 20) + '...');
      setMessage(messages[0]);
      setIsAvatarSpeaking(true);
    } else if (messages.length === 0) {
      // Reset when no messages are left
      setMessage(null);
      setIsAvatarSpeaking(false);
    }
  }, [messages, message]);

  // Method to set demo mode state
  const setDemoModeState = useCallback((isDemoModeActive) => {
    setIsDemoMode(isDemoModeActive);
    localStorage.setItem('isDemoMode', isDemoModeActive.toString());
  }, []);
  
  // Method to set context override for demo mode
  const setProductContext = useCallback((context) => {
    return new Promise((resolve) => {
      console.log("Setting product context override inside chat: ", context);
      setContextOverride(context);
      setTimeout(() => {
        resolve();
      }, 50);
      console.log("Product context override set inside chat", contextOverride);
    });
  }, []);

  // Add a function to stop the avatar from speaking
  const stopSpeaking = useCallback(() => {
    console.log("Stopping AI response playback");
    // Clear the message queue and stop current message
    setMessages([]);
    setMessage(null);
    setIsAvatarSpeaking(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chat,
        messages,
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
        setDemoModeState,
        setProductContext,
        contextOverride,
        stopSpeaking,
        startTour,
        setStartTour // Expose setter to reset the trigger
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
