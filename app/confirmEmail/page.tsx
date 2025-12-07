"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Home, LogIn, Sparkles, Mail, Loader2, XCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CONFIRM_EMAIL_API = (token: string) =>
  `${BASE_HTTP}/api/confirm-email?token=${token}`;

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isVisible, setIsVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setError("Không tìm thấy token xác nhận. Vui lòng kiểm tra lại link.");
        setIsConfirming(false);
        return;
      }

      try {
        const response = await fetch(CONFIRM_EMAIL_API(token), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || data.code !== 1000) {
          throw new Error(
            data?.message || "Xác nhận email thất bại. Token có thể đã hết hạn hoặc không hợp lệ."
          );
        }

        setIsSuccess(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể xác nhận email. Vui lòng thử lại sau."
        );
        setIsSuccess(false);
      } finally {
        setIsConfirming(false);
      }
    };

    confirmEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-8"
          >
            {/* Loading State */}
            {isConfirming && (
              <>
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="relative"
                  >
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 shadow-2xl">
                      <Loader2 className="w-16 h-16 text-white animate-spin" />
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                    Đang xác nhận{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      email...
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
                    Vui lòng đợi trong giây lát, chúng tôi đang xác nhận tài khoản của bạn.
                  </p>
                </motion.div>
              </>
            )}

            {/* Success State */}
            {!isConfirming && isSuccess && (
              <>
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="relative"
                  >
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                    
                    {/* Main Circle */}
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-2xl">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.2,
                        }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
                      </motion.div>
                    </div>

                    {/* Sparkle Effects */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 0.4 + i * 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="absolute"
                        style={{
                          top: `${20 + Math.sin((i * Math.PI) / 3) * 60}px`,
                          left: `${20 + Math.cos((i * Math.PI) / 3) * 60}px`,
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                    Xác nhận email{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      thành công!
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
                    Tài khoản của bạn đã được xác nhận thành công. Bây giờ bạn có thể đăng nhập và bắt đầu hành trình học tập của mình.
                  </p>
                </motion.div>

                {/* Email Icon with Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm">
                    <Mail className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300 text-sm font-medium">
                      Email đã được xác nhận
                    </span>
                  </div>
                </motion.div>
              </>
            )}

            {/* Error State */}
            {!isConfirming && !isSuccess && error && (
              <>
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="relative"
                  >
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-red-400 via-rose-500 to-pink-500 shadow-2xl">
                      <XCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-4"
                >
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                    Xác nhận email{" "}
                    <span className="bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                      thất bại
                    </span>
                  </h1>
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm max-w-xl mx-auto">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-base leading-relaxed">
                      {error}
                    </p>
                  </div>
                  <p className="text-gray-400 text-sm max-w-xl mx-auto">
                    Vui lòng kiểm tra lại link xác nhận hoặc yêu cầu gửi lại email xác nhận.
                  </p>
                </motion.div>
              </>
            )}

            {/* Action Buttons - Only show when not loading */}
            {!isConfirming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isSuccess ? 0.8 : 0.5, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/homePage")}
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_16px_40px_rgba(37,99,235,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Home className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Trở về trang chủ</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/login")}
                  className={`group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl border-2 backdrop-blur-sm px-8 py-4 text-base font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                    isSuccess
                      ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 focus-visible:ring-emerald-500"
                      : "border-sky-400/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400 focus-visible:ring-sky-500"
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span>Tới trang đăng nhập</span>
                </motion.button>
              </motion.div>
            )}

            {/* Additional Info - Only show on success */}
            {!isConfirming && isSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="pt-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Chào mừng bạn đến với E-Learning!</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

