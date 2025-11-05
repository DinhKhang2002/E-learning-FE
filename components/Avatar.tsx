"use client";
import { useState, useRef, useEffect } from "react";

interface AvatarProps {
  onLogout: () => void;
}

export default function Avatar({ onLogout }: AvatarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar hình tròn */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 hover:ring-2 ring-indigo-500 transition"
      >
        <img
          src="/avatar-default.png"
          alt="User Avatar"
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 animate-fadeIn">
          <a
            href="#"
            className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
          >
            Hồ sơ cá nhân
          </a>
          <a
            href="#"
            className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
          >
            Khóa học của tôi
          </a>
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
