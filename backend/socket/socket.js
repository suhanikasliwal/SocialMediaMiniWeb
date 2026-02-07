import express from "express";
import http from "http";
import { Server } from "socket.io";

export const app = express();

/* ======================================================
   HTTP SERVER
====================================================== */
export const server = http.createServer(app);

/* ======================================================
   SOCKET.IO
====================================================== */
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

/* ======================================================
   ONLINE USER MAP (SOURCE OF TRUTH)
====================================================== */
const onlineUsers = new Map();

/* ======================================================
   HELPERS (USED BY CONTROLLERS)
====================================================== */
export const getReciverSocketId = (userId) => {
  return onlineUsers.get(userId);
};

/* ======================================================
   SOCKET EVENTS
====================================================== */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* ===============================
     USER CONNECT
     =============================== */
  socket.on("addUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  /* ===============================
     JOIN CHAT ROOM
     =============================== */
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  /* ===============================
     TYPING INDICATOR
     =============================== */
  socket.on("typing", ({ chatId }) => {
    socket.to(chatId).emit("typing");
  });

  socket.on("stopTyping", ({ chatId }) => {
    socket.to(chatId).emit("stopTyping");
  });

  /* ===============================
     MESSAGE SEEN
     =============================== */
  socket.on("messageSeen", ({ chatId }) => {
    socket.to(chatId).emit("messageSeen", { chatId });
  });

  /* ===============================
     DISCONNECT
     =============================== */
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("🔴 Socket disconnected:", socket.id);
  });
});
