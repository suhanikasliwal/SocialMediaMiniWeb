import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import axios from "axios";
import cors from "cors";

import { connectDb } from "./database/db.js";
import { app, server } from "./socket/socket.js";
import { isAuth } from "./middlewares/isAuth.js";

import { Chat } from "./models/ChatModel.js";
import { User } from "./models/userModel.js";

// routes
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import aiRoutes from "./routes/ai.routes.js";

dotenv.config();

/* ======================================================
   🔥 CRITICAL MIDDLEWARES (MUST COME FIRST)
====================================================== */

// ✅ JSON BODY PARSER (REQUIRED FOR AI CHAT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ COOKIE PARSER (REQUIRED FOR AUTH)
app.use(cookieParser());

// ✅ CORS (FRONTEND ↔ BACKEND)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

/* ======================================================
   ☁️ CLOUDINARY CONFIG
====================================================== */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ======================================================
   🚀 ROUTES (AFTER MIDDLEWARES)
====================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/messages", messageRoutes);

// ✅ AI ROUTES (NOW BODY & AUTH WORK)
app.use("/api/ai", aiRoutes);

/* ======================================================
   🧠 CUSTOM APIs
====================================================== */

// get all chats
app.get("/api/messages/chats", isAuth, async (req, res) => {
  try {
    const chats = await Chat.find({
      users: req.user._id,
    }).populate({
      path: "users",
      select: "name profilePic",
    });

    chats.forEach((chat) => {
      chat.users = chat.users.filter(
        (u) => u._id.toString() !== req.user._id.toString()
      );
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get all users
app.get("/api/user/all", isAuth, async (req, res) => {
  try {
    const search = req.query.search || "";
    const users = await User.find({
      name: { $regex: search, $options: "i" },
      _id: { $ne: req.user._id },
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ======================================================
   🌐 SERVE FRONTEND (PRODUCTION)
====================================================== */

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "frontend", "dist", "index.html")
    );
  });
}

/* ======================================================
   ♻️ RENDER KEEP-ALIVE
====================================================== */

if (process.env.NODE_ENV === "production") {
  const url = "https://mern-social-3e3m.onrender.com";
  const interval = 30000;

  setInterval(() => {
    axios.get(url).catch(() => {});
  }, interval);
}

/* ======================================================
   🔌 SERVER + DB
====================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  connectDb();
});
