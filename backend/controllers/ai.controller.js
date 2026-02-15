import TryCatch from "../utils/Trycatch.js";
import { chatWithAI } from "../utils/aiClient.js";

export const aiChat = TryCatch(async (req, res) => {

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const reply = await chatWithAI(message);

  res.json({ reply });
});

