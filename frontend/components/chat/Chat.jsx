import React from "react";
import { BsSendCheck } from "react-icons/bs";
import { UserData } from "../../context/UserContext";

const Chat = ({ chat, setSelectedChat, isOnline }) => {
  const { user: loggedInUser } = UserData();
  if (!chat) return null;

  // ✅ FIX: always resolve the OTHER user
  const otherUser = chat.users.find(
    (u) => u._id !== loggedInUser._id
  );
  if (!otherUser) return null;

  const isSender =
    loggedInUser._id === chat.latestMessage?.sender;

  const lastMessage = chat.latestMessage?.text
    ? chat.latestMessage.text.slice(0, 30) +
      (chat.latestMessage.text.length > 30 ? "…" : "")
    : "No messages yet";

  return (
    <div
      onClick={() => setSelectedChat(chat)}
      className="
        flex items-center gap-3
        p-3 mt-2
        rounded-xl
        cursor-pointer
        bg-white
        hover:bg-blue-50
        hover:shadow-sm
        transition-all
      "
    >
      {/* Avatar */}
      <div className="relative">
        <img
          src={otherUser.profilePic.url}
          alt={otherUser.name}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {otherUser.name}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
          {isSender && <BsSendCheck className="text-blue-500" />}
          <span>{lastMessage}</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
