import { Chat } from "../models/ChatModel.js";
import Message from "../models/messages.js";
import { getReciverSocketId, io } from "../socket/socket.js";
import TryCatch from "../utils/Trycatch.js";

/* ===========================
   SEND MESSAGE
=========================== */
export const sendMessage = TryCatch(async (req, res) => {
  const { recieverId, message } = req.body;
  const senderId = req.user._id;

  if (!recieverId || !message) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  let chat = await Chat.findOne({
    users: { $all: [senderId, recieverId] },
  });

  if (!chat) {
    chat = await Chat.create({
      users: [senderId, recieverId],
      latestMessage: {
        text: message,
        sender: senderId,
      },
    });
  }

  const newMessage = await Message.create({
    chatId: chat._id,
    sender: senderId,
    text: message,
    seen: false, // ✅ NEW
  });

  await chat.updateOne({
    latestMessage: {
      text: message,
      sender: senderId,
    },
  });

  const receiverSocketId = getReciverSocketId(recieverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  res.status(201).json(newMessage);
});

/* ===========================
   GET ALL MESSAGES
=========================== */
export const getAllMessages = TryCatch(async (req, res) => {
  const { id } = req.params; // other user
  const userId = req.user._id;

  const chat = await Chat.findOne({
    users: { $all: [userId, id] },
  });

  if (!chat) {
    return res.status(404).json({ message: "No chat found" });
  }

  // ✅ MARK MESSAGES AS SEEN (ONLY RECEIVER SIDE)
  await Message.updateMany(
    {
      chatId: chat._id,
      sender: { $ne: userId },
      seen: false,
    },
    { seen: true }
  );

  // 🔔 NOTIFY SENDER (REAL-TIME)
  chat.users.forEach((uid) => {
    if (uid.toString() !== userId.toString()) {
      const socketId = getReciverSocketId(uid.toString());
      if (socketId) {
        io.to(socketId).emit("messageSeen", {
          chatId: chat._id,
        });
      }
    }
  });

  const messages = await Message.find({ chatId: chat._id })
    .populate("sender", "name profilePic");

  res.json(messages);
});

/* ===========================
   GET ALL CHATS
=========================== */
export const getAllChats = TryCatch(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ users: userId })
    .populate("users", "name profilePic")
    .sort({ updatedAt: -1 });

  res.json(chats);
});
