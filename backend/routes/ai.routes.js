import express from "express";
import { aiChat } from "../controllers/ai.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/chat", aiChat);

export default router;
