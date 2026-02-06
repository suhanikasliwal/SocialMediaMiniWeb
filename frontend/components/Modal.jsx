import React from "react";
import { Link } from "react-router-dom";

/* =========================================================
   GENERIC MODAL (FOLLOWERS / FOLLOWING / LIKES)
   Design-system compliant, motion-ready
========================================================= */
const Modal = ({ value = [], title, setShow }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={() => setShow(false)}
      />

      {/* Modal Card */}
      <div
        className="
          relative
          card glass
          w-[320px]
          max-h-[380px]
          p-4
          flex
          flex-col
          animate-[fadeInUp_0.25s_ease-out]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <button
            onClick={() => setShow(false)}
            className="
              text-gray-400
              hover:text-gray-600
              text-xl
              leading-none
              transition
            "
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {value.length > 0 ? (
            value.map((user, index) => (
              <Link
                key={user._id}
                to={`/user/${user._id}`}
                onClick={() => setShow(false)}
                className="
                  flex items-center gap-3
                  px-3 py-2
                  rounded-xl
                  hover:bg-white/40
                  transition
                "
              >
                <span className="text-xs text-gray-400 w-4">
                  {index + 1}
                </span>

                <img
                  src={user.profilePic?.url}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                />

                <span className="font-medium text-sm truncate">
                  {user.name}
                </span>
              </Link>
            ))
          ) : (
            <div className="text-center text-sm text-gray-500 mt-6">
              No {title.toLowerCase()} yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
