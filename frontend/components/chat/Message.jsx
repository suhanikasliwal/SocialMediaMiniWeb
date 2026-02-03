import React from "react";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { FiAlertCircle } from "react-icons/fi";

const Message = ({
  ownMessage,
  message,
  seen = false,
  delivered = true,
  sending = false,
  failed = false,
}) => {
  return (
    <div
      className={`flex ${
        ownMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[70%]
          px-4 py-2
          text-sm
          rounded-2xl
          relative
          break-words
          transition-all
          duration-300
          transform-gpu
          ${
            ownMessage
              ? failed
                ? "bg-red-500 text-white"
                : "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-800"
          }
          ${ownMessage ? "rounded-br-sm" : "rounded-bl-sm"}
          ${sending ? "opacity-70 animate-pulse" : ""}
          shadow-md
          hover:shadow-lg
        `}
      >
        {/* Message text */}
        <div className="pr-7">{message}</div>

        {/* Status (own messages only) */}
        {ownMessage && (
          <span
            className="
              absolute
              bottom-1
              right-2
              text-xs
              flex
              items-center
              gap-1
              select-none
            "
          >
            {failed ? (
              <FiAlertCircle className="text-white" />
            ) : sending ? (
              <span className="text-[10px] opacity-80">
                sending…
              </span>
            ) : seen ? (
              <BsCheckAll className="text-blue-200" />
            ) : delivered ? (
              <BsCheckAll className="text-gray-300" />
            ) : (
              <BsCheck className="text-gray-400" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
