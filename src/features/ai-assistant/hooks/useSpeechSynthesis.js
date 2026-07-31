import { useCallback, useEffect, useState } from "react";

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);

  // Load available browser voices
  useEffect(() => {
    if (!window.speechSynthesis) {
      setError("Speech Synthesis not supported in this browser");
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Find best matching voice
  const getBestVoice = useCallback(() => {
    if (!voices.length) return null;

    // Exact language match
    let selectedVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === language.toLowerCase(),
    );

    // Hindi fallback
    if (!selectedVoice && language === "mr-IN") {
      selectedVoice = voices.find((voice) =>
        voice.lang.toLowerCase().includes("hi"),
      );
    }

    // English India fallback
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) =>
        voice.lang.toLowerCase().includes("en-in"),
      );
    }

    // Any English fallback
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) =>
        voice.lang.toLowerCase().includes("en"),
      );
    }

    // Final fallback
    if (!selectedVoice) {
      selectedVoice = voices[0];
    }

    return selectedVoice;
  }, [voices, language]);

  const speak = useCallback(
    (text) => {
      try {
        if (!text || !text.trim()) return;

        setError(null);

        // Browser support check
        if (!window.speechSynthesis) {
          setError("Speech Synthesis not supported");
          return;
        }

        // Stop previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        const selectedVoice = getBestVoice();

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = language;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error("Speech Synthesis Error:", event.error);

          setError(`Speech failed: ${event.error}`);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error(err);

        setError(err.message || "Speech synthesis failed");
        setIsSpeaking(false);
      }
    },
    [getBestVoice, language],
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    language,
    setLanguage,
    error,
    voices,
  };
};

export default useSpeechSynthesis;
