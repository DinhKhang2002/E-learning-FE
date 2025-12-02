"use client";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, LogOut, User, Settings, BookOpen, MessageSquare } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Notification from "./Notification";
import Messenger from "./Messenger";

type StoredUser = {
  id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  address?: string | null;
  gender?: string | null;
  role?: string | null;
  primarySubject?: string | null;
  avatar?: string | null;
  dob?: string | null;
};

const AUTH_EVENT = "auth-changed";

const navItems = [
  { label: "Trang chủ", href: "/homePage#home" },
  { label: "Khóa học", href: "/homePage#courses" },
  { label: "Giảng viên", href: "/homePage#teachers" },
  { label: "Liên hệ", href: "/homePage#contact" },
];

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [showMessenger, setShowMessenger] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const router = useRouter();

  const syncAuthState = () => {
    if (typeof window === "undefined") {
      return;
    }
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");
    setIsLoggedIn(Boolean(token));
    if (userRaw) {
      try {
        setUser(JSON.parse(userRaw));
      } catch (error) {
        console.warn("Failed to parse stored user", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");
    
    if (!token || !userRaw) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      if (!user?.id) return;

      const response = await fetch(
        `http://localhost:8080/education/api/notices/${user.id}/count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok && data.code === 1000) {
        setUnreadNotificationCount(data.result || 0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  useEffect(() => {
    syncAuthState();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchUnreadNotificationCount();
      // Refresh notification count every 30 seconds
      const interval = setInterval(fetchUnreadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "accessToken" || event.key === "user") {
        syncAuthState();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_EVENT, syncAuthState);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_EVENT, syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event(AUTH_EVENT));
    }
    setIsLoggedIn(false);
    setProfileOpen(false);
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const navigateTo = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  const displayName = useMemo(() => {
    if (!user) return "Người dùng";
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return fullName || user.username || "Người dùng";
  }, [user]);

  const displayEmail = user?.email || "user@elearning.com";
  const displayRole = user?.role || "Thành viên E-Learning";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 bg-opacity-80 border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/homePage#home" className="group flex items-center space-x-2 text-white font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                E-Learning
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {!isLoggedIn && navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-gray-200 hover:text-white font-medium transition-all duration-300 relative group"
                  onClick={() => setProfileOpen(false)}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}

              {/* Auth Buttons or Avatar */}
              {!isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigateTo("/login")}
                    className="px-5 py-2 text-purple-300 border border-purple-500 rounded-full hover:bg-purple-500 hover:bg-opacity-20 hover:text-white transition-all duration-300 backdrop-blur-sm"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => navigateTo("/register")}
                    className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Notification
                    userId={user?.id}
                    authToken={
                      typeof window !== "undefined"
                        ? window.localStorage.getItem("accessToken")
                        : null
                    }
                  />
                  <button
                    onClick={() => setShowMessenger(true)}
                    className="relative p-2 text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
                    title="Tin nhắn"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                        <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                          <User className="w-5 h-5 text-pink-400" />
                        </div>
                      </div>
                      <span className="text-white font-medium hidden lg:block">{displayName}</span>
                    </button>

                  {/* Dropdown Profile */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white border-opacity-20 overflow-hidden">
                      <div className="p-4 border-b border-white border-opacity-10">
                        <p className="text-black text-sm">{displayName}</p>
                        <p className="text-black text-sm font-light italic">{displayEmail}</p>
                      </div>
                      <div className="h-[1.5px] bg-yellow-300 opacity-70 mx-4"></div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            router.push("/userInfo");
                          }}
                          className="
                            w-full px-4 py-3 flex items-center space-x-3
                            text-black
                            hover:bg-gray-200
                            transition-all"
                        >
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-black">Hồ sơ</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            router.push("/homePage#courses");
                          }}
                          className="
                            w-full px-4 py-3 flex items-center space-x-3
                            text-black
                            hover:bg-gray-200
                            transition-all"
                        >
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span className="text-black">Khóa học của tôi</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            // TODO: Navigate to settings page when available
                            console.log("Settings clicked");
                          }}
                          className="
                            w-full px-4 py-3 flex items-center space-x-3
                            text-black
                            hover:bg-gray-200
                            transition-all"
                        >
                          <Settings className="w-4 h-4 text-blue-500" />
                          <span className="text-black">Cài đặt</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 flex items-center space-x-3 text-red-400 hover:bg-red-500 hover:bg-opacity-20 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div
        className={clsx(
          "fixed inset-0 z-50 md:hidden transition-all duration-500",
          mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            "absolute inset-0 bg-black transition-opacity duration-500",
            mobileMenuOpen ? "bg-opacity-60" : "bg-opacity-0"
          )}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={clsx(
            "absolute right-0 top-0 h-full w-80 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 shadow-2xl transform transition-transform duration-500 ease-out",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <Link href="/homePage#home" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-xl font-bold text-white">E-Learning</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!isLoggedIn && (
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 text-lg text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-white border-opacity-20">
              {!isLoggedIn ? (
                <div className="space-y-3">
                  <button
                    onClick={() => navigateTo("/login")}
                    className="w-full py-3 text-purple-300 border border-purple-500 rounded-xl hover:bg-purple-500 hover:bg-opacity-20 transition-all"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => navigateTo("/register")}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all"
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-10 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                        <User className="w-6 h-6 text-pink-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{displayName}</p>
                      <p className="text-gray-400 text-sm">{displayRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-red-400 border border-red-500 border-opacity-50 rounded-xl hover:bg-red-500 hover:bg-opacity-20 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messenger Modal */}
      {showMessenger && user?.id && (
        <Messenger
          isOpen={showMessenger}
          onClose={() => setShowMessenger(false)}
          currentUserId={user.id}
          authToken={
            typeof window !== "undefined"
              ? window.localStorage.getItem("accessToken") || ""
              : ""
          }
        />
      )}
    </>
  );
}