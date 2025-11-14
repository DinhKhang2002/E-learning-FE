"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, BookOpen, LogOut } from "lucide-react";

interface AvatarProps {
  onLogout: () => void;
}

export default function Avatar({ onLogout }: AvatarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleProfileClick = () => {
    setOpen(false);
    router.push("/userInfo");
  };

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
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <button
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-900 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600">
              <User size={18} strokeWidth={2} />
            </div>
            <span className="font-medium">Hồ sơ cá nhân</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              // TODO: Navigate to courses page
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-900 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
              <BookOpen size={18} strokeWidth={2} />
            </div>
            <span className="font-medium">Khóa học của tôi</span>
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600">
              <LogOut size={18} strokeWidth={2} />
            </div>
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}
