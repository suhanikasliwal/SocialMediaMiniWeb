import express from "express";
import { aiChat } from "../controllers/aiController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", isAuth, aiChat);

export default router;
