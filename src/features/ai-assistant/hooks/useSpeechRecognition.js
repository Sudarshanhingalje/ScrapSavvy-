import { useCallback, useRef, useState } from "react";

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Browser Support Check
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError(
          "Speech Recognition is not supported in this browser. Use Chrome.",
        );
        return;
      }

      // Microphone Permission Check
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        setError("Microphone permission denied.");
        return;
      }

      // Stop previous recognition if exists
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setInterimTranscript("");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += text + " ";
          } else {
            interim += text;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }

        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);

        switch (event.error) {
          case "not-allowed":
            setError("Microphone access denied.");
            break;

          case "network":
            setError("Network error occurred.");
            break;

          case "no-speech":
            setError("No speech detected.");
            break;

          default:
            setError(`Speech error: ${event.error}`);
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setError(err.message || "Speech recognition failed");
      setIsListening(false);
    }
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    language,
    setLanguage,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
