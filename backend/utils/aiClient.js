import axios from "axios";

/**
 * AI client – talks to .NET AI service
 * Safe fallback if AI is down
 */

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:5183";

export const generateCaptionAI = async (caption) => {
  try {
    const res = await axios.post(
      `${AI_BASE_URL}/api/ai/generate-post`,
      { prompt: caption }
    );

    return res.data.text;
  } catch (err) {
    console.error("AI service error:", err.message);

    // fallback → never break post creation
    return caption;
  }
};

export const chatWithAI = async (message) => {
  try {
    const res = await axios.post(
      `${AI_BASE_URL}/api/ai/chat`,
      { message }
    );

    return res.data.reply;
  } catch (err) {
    console.error("AI chat error:", err.message);
    return "AI service is temporarily unavailable.";
  }
};


