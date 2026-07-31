import { useCallback, useRef, useState } from "react";
import aiService from "../services/aiService";
import useSpeechRecognition from "./useSpeechRecognition";
import useSpeechSynthesis from "./useSpeechSynthesis";

const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en");

  const speechRecognition = useSpeechRecognition();
  const speechSynthesis = useSpeechSynthesis();

  // Prevent duplicate sends
  const isSendingRef = useRef(false);

  // Language synchronization
  const handleLanguageChange = useCallback(
    (newLanguage) => {
      setLanguage(newLanguage);

      const languageMap = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
      };

      const mappedLanguage = languageMap[newLanguage] || "en-IN";

      speechRecognition.setLanguage(mappedLanguage);
      speechSynthesis.setLanguage(mappedLanguage);
    },
    [speechRecognition, speechSynthesis],
  );

  // Send message to AI
  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage || !userMessage.trim()) return;

      // Prevent duplicate requests
      if (isSendingRef.current) return;

      isSendingRef.current = true;

      setError(null);
      setIsLoading(true);

      // Stop ongoing speech before new request
      speechSynthesis.stop();

      const cleanedMessage = userMessage.trim();

      // Add user message
      const userMsg = {
        id: Date.now(),
        type: "user",
        text: cleanedMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        // Send to backend AI
        const response = await aiService.sendMessage(cleanedMessage, language);

        const aiText =
          response?.reply ||
          response?.response ||
          response?.message ||
          "Sorry, I could not understand that.";

        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          text: aiText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Speak AI response
        speechSynthesis.speak(aiText);

        return aiMessage;
      } catch (err) {
        console.error("AI Chat Error:", err);

        const errorText = "Sorry, I encountered an error. Please try again.";

        setError(err?.message || "AI request failed");

        const errorMessage = {
          id: Date.now() + 1,
          type: "ai",
          text: errorText,
          isError: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);

        // Speak fallback error
        speechSynthesis.speak(errorText);
      } finally {
        setIsLoading(false);
        isSendingRef.current = false;
      }
    },
    [language, speechSynthesis],
  );

  // Voice input handler
  const handleVoiceInput = useCallback(async () => {
    setError(null);

    // If currently listening → stop and send transcript
    if (speechRecognition.isListening) {
      speechRecognition.stopListening();

      // Wait slightly for final transcript
      setTimeout(() => {
        const finalTranscript = speechRecognition.transcript?.trim();

        if (finalTranscript) {
          sendMessage(finalTranscript);
          speechRecognition.resetTranscript();
        }
      }, 500);

      return;
    }

    // Stop speaking before listening
    if (speechSynthesis.isSpeaking) {
      speechSynthesis.stop();
    }

    // Start listening
    speechRecognition.startListening();
  }, [speechRecognition, speechSynthesis, sendMessage]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);

    speechRecognition.resetTranscript();
    speechSynthesis.stop();
  }, [speechRecognition, speechSynthesis]);

  return {
    messages,
    isLoading,
    error,

    language,
    handleLanguageChange,

    sendMessage,
    handleVoiceInput,
    clearChat,

    transcript:
      speechRecognition.transcript || speechRecognition.interimTranscript,

    isListening: speechRecognition.isListening,
    isSpeaking: speechSynthesis.isSpeaking,

    speechRecognition,
    speechSynthesis,
  };
};

export default useAIChat;
