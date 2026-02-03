import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";

import { UserData } from "../../context/UserContext";
import { SocketData } from "../../context/SocketContext";
import { LoadingAnimation } from "../Loading";
import Message from "./Message";
import MessageInput from "./MessageInput";

/* =========================================================
   MESSAGE CONTAINER
   - typing indicator
   - seen ticks (safe, incremental)
========================================================= */

const MessageContainer = ({ selectedChat, setChats }) => {
  const { user } = UserData();
  const { socket, typingChats } = SocketData();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);
  const seenEmittedRef = useRef(false);

  /* ===============================
     OTHER USER (STABLE)
     =============================== */
  const otherUser = useMemo(() => {
    if (!selectedChat || !user) return null;
    return selectedChat.users.find(
      (u) => u._id !== user._id
    );
  }, [selectedChat, user]);

  /* ===============================
     FETCH MESSAGES
     =============================== */
  useEffect(() => {
    if (!otherUser || !selectedChat) return;

    let active = true;
    seenEmittedRef.current = false;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `/api/messages/${otherUser._id}`
        );

        if (!active) return;

        // mark incoming messages as seen locally
        const normalized = (data || []).map((m) => ({
          ...m,
          seen:
            m.sender !== user._id &&
            m.sender?._id !== user._id
              ? true
              : m.seen,
        }));

        setMessages(normalized);
      } catch (err) {
        console.error("Fetch messages failed", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMessages();
    return () => (active = false);
  }, [otherUser, selectedChat, user._id]);

  /* ===============================
     JOIN CHAT ROOM
     =============================== */
  useEffect(() => {
    if (socket && selectedChat?._id) {
      socket.emit("joinChat", selectedChat._id);
    }
  }, [socket, selectedChat?._id]);

  /* ===============================
     EMIT SEEN (ON OPEN)
     =============================== */
  useEffect(() => {
    if (!socket || !selectedChat?._id) return;
    if (seenEmittedRef.current) return;

    socket.emit("messageSeen", {
      chatId: selectedChat._id,
    });

    seenEmittedRef.current = true;
  }, [socket, selectedChat?._id]);

  /* ===============================
     SOCKET: RECEIVE MESSAGE
     =============================== */
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handler = (message) => {
      if (message.chatId !== selectedChat._id) return;

      setMessages((prev) => [
        ...prev,
        { ...message, seen: false },
      ]);

      setChats((prev) =>
        prev.map((c) =>
          c._id === message.chatId
            ? {
                ...c,
                latestMessage: {
                  text: message.text,
                  sender: message.sender,
                },
              }
            : c
        )
      );
    };

    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
  }, [socket, selectedChat, setChats]);

  /* ===============================
     SOCKET: MESSAGE SEEN
     =============================== */
  useEffect(() => {
    if (!socket || !selectedChat) return;

    const handler = ({ chatId }) => {
      if (chatId !== selectedChat._id) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user._id ||
          m.sender?._id === user._id
            ? { ...m, seen: true }
            : m
        )
      );
    };

    socket.on("messageSeen", handler);
    return () => socket.off("messageSeen", handler);
  }, [socket, selectedChat, user._id]);

  /* ===============================
     AUTO SCROLL
     =============================== */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingChats[selectedChat?._id]]);

  /* ===============================
     GUARD
     =============================== */
  if (!selectedChat || !otherUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a chat to start messaging
      </div>
    );
  }

  /* ===============================
     RENDER
     =============================== */
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <img
          src={otherUser.profilePic.url}
          alt={otherUser.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-semibold">
          {otherUser.name}
        </span>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingAnimation />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <Message
                key={msg._id}
                message={msg.text}
                seen={msg.seen}
                ownMessage={
                  msg.sender === user._id ||
                  msg.sender?._id === user._id
                }
              />
            ))
          ) : (
            <div className="text-center text-sm text-gray-400 mt-6">
              No messages yet. Say hi 👋
            </div>
          )}

          {/* Typing Indicator */}
          {typingChats[selectedChat._id] && (
            <div className="text-sm text-gray-400 italic ml-2">
              {otherUser.name} is typing…
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      )}

      {/* Input */}
      <MessageInput
        setMessages={setMessages}
        selectedChat={selectedChat}
      />
    </div>
  );
};

export default MessageContainer;
