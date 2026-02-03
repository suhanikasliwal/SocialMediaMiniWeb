import { useEffect, useRef, useState } from "react";
import { ChatData } from "../../context/ChatContext";
import { UserData } from "../../context/UserContext";

/* =========================================================
   CHAT BOX — CORE MESSAGING SURFACE (CLEAN + SAFE)
========================================================= */

const ChatBox = () => {
  const {
    selectedChat,
    messages = [],
    fetchMessages,
    sendMessage,
    loading,
  } = ChatData();

  const { user } = UserData();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  /* ===============================
     GUARD — NO CHAT SELECTED
     =============================== */
  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Select a conversation to get started
      </div>
    );
  }

  /* ===============================
     LOAD MESSAGES ON CHAT CHANGE
     =============================== */
  useEffect(() => {
    fetchMessages(selectedChat._id);
  }, [selectedChat?._id, fetchMessages]);

  /* ===============================
     AUTO SCROLL (STABLE)
     =============================== */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ===============================
     SEND MESSAGE
     =============================== */
  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    try {
      await sendMessage(text);
      setText("");
    } catch {
      // silent fail (toast handled elsewhere)
    }
  };

  /* ===============================
     RENDER
     =============================== */
  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((m) => {
            const isMe =
              m.sender?._id === user._id ||
              m.sender === user._id;

            return (
              <div
                key={m._id}
                className={`flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`message ${
                    isMe ? "own" : "other"
                  }`}
                >
                  {m.content || m.text}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-sm text-gray-400 mt-6">
            No messages yet. Say hello 👋
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={onSend}
        className="
          border-t
          border-gray-200
          p-3
          flex
          items-center
          gap-2
          bg-white
          sticky
          bottom-0
        "
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 custom-input"
        />

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn-primary"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
