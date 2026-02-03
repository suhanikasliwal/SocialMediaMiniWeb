import React from "react";
import { ChatData } from "../../context/ChatContext";

/* =========================================================
   CHAT LIST — STABLE + FUTURE-READY
========================================================= */

const ChatList = () => {
  const {
    chats = [],
    selectedChat,
    setSelectedChat,
    fetchMessages,
  } = ChatData();

  /* ===============================
     OPEN CHAT (SINGLE SOURCE)
     =============================== */
  const openChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
  };

  /* ===============================
     EMPTY STATE
     =============================== */
  if (!chats.length) {
    return (
      <div className="w-[30%] border-r flex items-center justify-center">
        <p className="text-gray-400 text-sm text-center">
          No conversations yet
        </p>
      </div>
    );
  }

  /* ===============================
     CHAT LIST
     =============================== */
  return (
    <div className="w-[30%] border-r p-3 overflow-y-auto">
      {chats.map((chat) => {
        const friend = chat.user; // ✅ backend-aligned
        const isActive = selectedChat?._id === chat._id;

        return (
          <div
            key={chat._id}
            onClick={() => openChat(chat)}
            className={`
              p-3
              mb-2
              cursor-pointer
              rounded-xl
              flex
              items-center
              gap-3
              transition-all
              ${
                isActive
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-100"
              }
            `}
          >
            {/* Avatar */}
            <img
              src={friend?.profilePic?.url || "/avatar.png"}
              alt={friend?.name || "User"}
              className="w-10 h-10 rounded-full object-cover"
            />

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm truncate">
                  {friend?.name || "User"}
                </span>

                {/* 🔔 UNREAD BADGE (READY, SAFE DEFAULT) */}
                {chat.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-[2px] rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              {/* Last message */}
              {chat.latestMessage?.text && (
                <p className="text-xs text-gray-500 truncate">
                  {chat.latestMessage.text}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
