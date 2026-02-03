import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import { ChatData } from "../../context/ChatContext";
import { UserData } from "../../context/UserContext";
import { SocketData } from "../../context/SocketContext";

const MessageInput = ({ setMessages, selectedChat }) => {
  const { user } = UserData();
  const { setChats } = ChatData();
  const { socket } = SocketData();

  const [textMsg, setTextMsg] = useState("");
  const [sending, setSending] = useState(false);

  /* ===============================
     AI INTELLIGENCE STATE
     =============================== */
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  /* ===============================
     LOCK RECEIVER (STABLE)
     =============================== */
  const receiverId = useMemo(() => {
    return selectedChat.users.find(
      (u) => u._id !== user._id
    )?._id;
  }, [selectedChat, user._id]);

  /* ===============================
     TYPING INDICATOR (UNCHANGED)
     =============================== */
  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const aiTimerRef = useRef(null);

  const handleTyping = (e) => {
    const value = e.target.value;
    setTextMsg(value);

    // socket typing
    if (socket && selectedChat?._id) {
      if (!typingRef.current) {
        typingRef.current = true;
        socket.emit("typing", { chatId: selectedChat._id });
      }

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        typingRef.current = false;
        socket.emit("stopTyping", { chatId: selectedChat._id });
      }, 1200);
    }

    // AI debounce
    clearTimeout(aiTimerRef.current);
    if (value.trim().length > 4) {
      aiTimerRef.current = setTimeout(() => {
        fetchAiSuggestions(value);
      }, 600);
    } else {
      setAiSuggestions([]);
    }
  };

  /* ===============================
     AI: FETCH SUGGESTIONS
     =============================== */
  const fetchAiSuggestions = async (text) => {
    try {
      setAiLoading(true);
      const { data } = await axios.post("/api/ai/suggest", {
        text,
        context: "chat",
      });

      if (Array.isArray(data)) {
        setAiSuggestions(data.slice(0, 3));
      }
    } catch {
      // silent fail
    } finally {
      setAiLoading(false);
    }
  };

  /* ===============================
     AI: IMPROVE MESSAGE
     =============================== */
  const improveMessage = async () => {
    if (!textMsg.trim()) return;

    try {
      setAiLoading(true);
      const { data } = await axios.post("/api/ai/improve", {
        text: textMsg,
        context: "chat",
      });

      if (data?.text) {
        setTextMsg(data.text);
        setAiSuggestions([]);
      }
    } catch {
      toast.error("AI improvement failed");
    } finally {
      setAiLoading(false);
    }
  };

  /* ===============================
     SEND MESSAGE (OPTIMISTIC)
     =============================== */
  const handleMessage = async (e) => {
    e.preventDefault();
    if (!textMsg.trim() || sending || !receiverId) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      chatId: selectedChat._id,
      sender: user._id,
      text: textMsg,
      sending: true,
      failed: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTextMsg("");
    setAiSuggestions([]);
    setSending(true);

    try {
      const { data } = await axios.post("/api/messages", {
        message: optimisticMessage.text,
        recieverId: receiverId,
      });

      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data : m))
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === selectedChat._id
            ? {
                ...chat,
                latestMessage: {
                  text: data.text,
                  sender: data.sender,
                },
              }
            : chat
        )
      );

      socket?.emit("stopTyping", { chatId: selectedChat._id });
      typingRef.current = false;
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? { ...m, sending: false, failed: true }
            : m
        )
      );
      toast.error("Message failed to send");
    } finally {
      setSending(false);
    }
  };

  /* ===============================
     CLEANUP
     =============================== */
  useEffect(() => {
    setTextMsg("");
    setAiSuggestions([]);
    typingRef.current = false;
    clearTimeout(timerRef.current);
    clearTimeout(aiTimerRef.current);
  }, [selectedChat?._id]);

  return (
    <div className="border-t bg-white p-3">
      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {aiSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTextMsg(s);
                setAiSuggestions([]);
              }}
              className="
                text-xs
                px-3 py-1
                rounded-full
                bg-blue-50
                text-blue-600
                hover:bg-blue-100
                transition
              "
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleMessage}
        className="flex items-center gap-2"
      >
        <input
          value={textMsg}
          onChange={handleTyping}
          placeholder="Type a message…"
          className="
            flex-1
            px-4 py-2
            rounded-full
            bg-gray-100
            focus:outline-none
            focus:ring-2
            focus:ring-blue-400
          "
          disabled={sending}
        />

        {textMsg.trim() && (
          <button
            type="button"
            onClick={improveMessage}
            disabled={aiLoading}
            className="
              px-3
              text-sm
              text-blue-600
              hover:text-blue-700
              transition
            "
          >
            ✨ Improve
          </button>
        )}

        <button
          type="submit"
          disabled={sending || !textMsg.trim()}
          className="
            bg-blue-600
            text-white
            px-5 py-2
            rounded-full
            font-medium
            hover:bg-blue-700
            transition
            disabled:opacity-50
          "
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
