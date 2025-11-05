"use client";
import { useState } from "react";
import { Menu, X, LogOut, User, Settings, BookOpen } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Trang chủ", href: "#home" },
  { label: "Khóa học", href: "#courses" },
  { label: "Giảng viên", href: "#teachers" },
  { label: "Liên hệ", href: "#contact" },
];

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 bg-opacity-80 border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a
              href="#"
              className="group flex items-center space-x-2 text-white font-bold text-xl tracking-tight"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                E-Learning
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-gray-200 hover:text-white font-medium transition-all duration-300 relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}

              {/* Auth Buttons or Avatar */}
              {!isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => alert("Chuyển đến trang đăng nhập")}
                    className="px-5 py-2 text-purple-300 border border-purple-500 rounded-full hover:bg-purple-500 hover:bg-opacity-20 hover:text-white transition-all duration-300 backdrop-blur-sm"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => alert("Chuyển đến trang đăng ký")}
                    className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all duration-300"
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
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
                    <span className="text-white font-medium hidden lg:block">
                      Nguyễn Văn A
                    </span>
                  </button>

                  {/* Dropdown Profile */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white border-opacity-20 overflow-hidden">
                      <div className="p-4 border-b border-white border-opacity-10">
                        <p className="text-white font-semibold">Nguyễn Văn A</p>
                        <p className="text-gray-300 text-sm">student@elearning.com</p>
                      </div>
                      <div className="py-2">
                        {[
                          { icon: User, label: "Hồ sơ" },
                          { icon: BookOpen, label: "Khóa học của tôi" },
                          { icon: Settings, label: "Cài đặt" },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className="w-full px-4 py-3 flex items-center space-x-3 text-gray-200 hover:bg-white hover:bg-opacity-10 transition-all"
                          >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setIsLoggedIn(false);
                            setProfileOpen(false);
                          }}
                          className="w-full px-4 py-3 flex items-center space-x-3 text-red-400 hover:bg-red-500 hover:bg-opacity-20 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
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
              <a href="#" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-xl font-bold text-white">E-Learning</span>
              </a>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-lg text-gray-200 hover:text-white hover:bg-white hover:bg-opacity-10 rounded-xl transition-all"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white border-opacity-20">
              {!isLoggedIn ? (
                <div className="space-y-3">
                  <button className="w-full py-3 text-purple-300 border border-purple-500 rounded-xl hover:bg-purple-500 hover:bg-opacity-20 transition-all">
                    Đăng nhập
                  </button>
                  <button className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-pink-500/40 transform hover:scale-105 transition-all">
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
                      <p className="text-white font-semibold">Nguyễn Văn A</p>
                      <p className="text-gray-400 text-sm">Học viên</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setMobileMenuOpen(false);
                    }}
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
    </>
  );
}