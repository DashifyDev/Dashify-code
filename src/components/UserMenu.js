"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function UserMenu({ dbUser, isMobile, authLoading, isAdmin }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuRef = useRef(null);

  const handlePicClick = event => {
    event.stopPropagation();
    setAnchorEl(prev => (prev ? null : event.currentTarget));
  };

  useEffect(() => {
    if (!anchorEl) return;

    const handlePointerDown = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAnchorEl(null);
      }
    };

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        setAnchorEl(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorEl]);

  if (authLoading) {
    return <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (dbUser) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={handlePicClick}
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 rounded-full border-0 outline-none transition-all duration-200 hover:ring-2 hover:ring-[#63899e]/30"
        >
          <img
            src={dbUser.picture}
            alt={dbUser.email}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-gray-200 hover:border-[#63899e] transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </button>

        {/* Dropdown Menu */}
        {anchorEl && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAnchorEl(null)} />
            <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white/95 backdrop-blur-sm border border-gray-200/60 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
              {/* User Info Section */}
              <div className="px-4 py-4 bg-gradient-to-r from-[#63899e]/5 to-[#4a6d7e]/5 border-b border-gray-200/60">
                <div className="flex items-center gap-3">
                  <img
                    src={dbUser.picture}
                    alt={dbUser.email}
                    className="h-10 w-10 rounded-full border-2 border-[#63899e]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {dbUser.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{dbUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Menu Items */}
              <div>
                {isAdmin && (
                  <Link
                    href="/admin/board-library"
                    onClick={() => setAnchorEl(null)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Admin Board Library Management
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setAnchorEl(null)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Account
                </Link>
                <Link
                  href="/subscription"
                  onClick={() => setAnchorEl(null)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Subscription
                </Link>
                <a
                  href="/api/auth/logout"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/50 transition-all duration-200 group"
                >
                  <svg
                    className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="group-hover:text-red-600 font-medium transition-colors">
                    Log out
                  </span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/api/auth/login"
          prefetch={false}
          className="px-4 py-2 text-sm font-semibold text-[#63899e] hover:text-[#4a6d7e] transition-colors"
        >
          Login
        </Link>
        <Link
          href="/api/auth/login?screen_hint=signup"
          prefetch={false}
          className="px-4 py-2 text-sm font-semibold bg-[#63899e] text-white rounded-lg hover:bg-[#4a6d7e] transition-colors shadow-sm hover:shadow-md"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return null;
}
