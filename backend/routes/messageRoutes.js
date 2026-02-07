import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getAllMessages,
  sendMessage,
  getAllChats, // ✅ added
} from "../controllers/messageControllers.js";

const router = express.Router();

router.get("/chats", isAuth, getAllChats); // ✅ REQUIRED
router.post("/", isAuth, sendMessage);
router.get("/:id", isAuth, getAllMessages);

export default router;
