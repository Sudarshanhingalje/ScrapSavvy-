import axios from "axios";
import { AI_CONFIG, API_ENDPOINTS } from "../../../config/env";

// =========================
// AXIOS INSTANCE
// =========================

const aiClient = axios.create({
  baseURL: API_ENDPOINTS.CHAT.replace("/chat", ""),
  timeout: AI_CONFIG.TIMEOUT || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================
// REQUEST INTERCEPTOR
// =========================

aiClient.interceptors.request.use(
  (config) => {
    console.log("[AI REQUEST]", config.method?.toUpperCase(), config.url);

    return config;
  },
  (error) => {
    console.error("[REQUEST ERROR]", error);
    return Promise.reject(error);
  },
);

// =========================
// RESPONSE INTERCEPTOR
// =========================

aiClient.interceptors.response.use(
  (response) => {
    console.log("[AI RESPONSE]", response.data);
    return response;
  },
  (error) => {
    console.error("[AI RESPONSE ERROR]", error);
    return Promise.reject(error);
  },
);

// =========================
// AI SERVICE
// =========================

const aiService = {
  // =========================
  // SEND MESSAGE
  // =========================

  sendMessage: async (message, language = "en") => {
    try {
      // Validate message
      if (!message || !message.trim()) {
        throw new Error("Message cannot be empty");
      }

      const cleanedMessage = message.trim();

      console.log("[AI] Sending:", cleanedMessage);

      // API Request
      const response = await aiClient.post("/chat", {
        message: cleanedMessage,
        language,
      });

      // Validate response
      if (!response || !response.data) {
        throw new Error("Empty response from AI");
      }

      const data = response.data;

      console.log("[AI] Response:", data);

      // Normalize backend response
      return {
        success: data.success ?? true,
        reply: data.reply || data.response || data.message || "No AI response",
        language: data.language || language,
        error: data.error || null,
      };
    } catch (error) {
      console.error("[AI SERVICE ERROR]", error);

      // Timeout
      if (error.code === "ECONNABORTED") {
        throw {
          type: "timeout",
          message: "AI request timed out. Please try again.",
        };
      }

      // Backend error
      if (error.response) {
        const status = error.response.status;

        const backendMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Backend server error";

        throw {
          type: "server",
          status,
          message: backendMessage,
        };
      }

      // No server response
      if (error.request) {
        throw {
          type: "network",
          message: "Cannot connect to backend server.",
        };
      }

      // Unknown
      throw {
        type: "unknown",
        message: error.message || "Unknown AI error",
      };
    }
  },

  // =========================
  // HEALTH CHECK
  // =========================

  healthCheck: async () => {
    try {
      const response = await aiClient.get("/health");

      return response.status === 200;
    } catch (error) {
      console.error("[AI HEALTH CHECK FAILED]", error.message);

      return false;
    }
  },

  // =========================
  // AVAILABLE LANGUAGES
  // =========================

  getAvailableLanguages: async () => {
    try {
      const response = await aiClient.get("/languages");

      return response.data || ["en", "hi", "mr"];
    } catch (error) {
      console.error("[AI LANGUAGES ERROR]", error.message);

      return ["en", "hi", "mr"];
    }
  },

  // =========================
  // LANGUAGE OPTIONS
  // =========================

  getLanguageOptions: () => {
    return [
      {
        code: "en",
        name: "English",
        locale: "en-IN",
        flag: "🇬🇧",
      },
      {
        code: "hi",
        name: "हिंदी",
        locale: "hi-IN",
        flag: "🇮🇳",
      },
      {
        code: "mr",
        name: "मराठी",
        locale: "mr-IN",
        flag: "🇮🇳",
      },
    ];
  },

  // =========================
  // SYSTEM PROMPT
  // =========================

  getSystemPrompt: () => {
    return `
You are ScrapSavvy AI Assistant.

You help users with:
- Scrap prices
- Recycling information
- Scrap pickup scheduling
- Waste management
- E-waste guidance

Rules:
- Keep responses short
- Be friendly
- Reply in same language
- Use Indian pricing references
- Focus on scrap and recycling
`;
  },

  // =========================
  // DEBUG LOGGER
  // =========================

  log: (action, data) => {
    if (AI_CONFIG.DEBUG) {
      console.log(`[AI DEBUG] ${action}`, data);
    }
  },
};

export default aiService;
