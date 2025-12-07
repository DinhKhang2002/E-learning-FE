"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const LOGIN_API = `${BASE_HTTP}/api/auth/login`;
const AUTH_EVENT = "auth-changed";

interface LoginResult {
  message: string;
  code: number;
  result?: {
    accessToken: string;
    user: Record<string, unknown>;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("teacher0@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResult = await response.json();

      if (!response.ok || data.code !== 1000 || !data.result?.accessToken) {
        throw new Error(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.result.accessToken);
        localStorage.setItem("user", JSON.stringify(data.result.user || {}));
        window.dispatchEvent(new Event(AUTH_EVENT));
      }

      router.push("/homePage");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin đăng nhập."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-200 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Trải nghiệm an toàn & bảo mật</span>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Chào mừng bạn quay lại{" "}
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                E-Learning
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Đăng nhập để tiếp tục học tập cùng hơn 10.000 học viên, khám phá
              kho kiến thức đa dạng và theo dõi tiến độ học tập cá nhân hóa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Theo dõi tiến độ học",
                "Nhận chứng chỉ chính hãng",
                "Lớp học trực tiếp",
                "Hỏi đáp với giảng viên",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                  <span className="text-sm text-gray-200">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/30 via-transparent to-pink-500/20 blur-3xl rounded-3xl" />
            <form
              onSubmit={handleSubmit}
              className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold">Đăng nhập tài khoản</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Nhập thông tin đã đăng ký để tiếp tục.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@domain.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-500/90 hover:to-purple-600/90 transition-all duration-300 rounded-2xl py-3 font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Bằng việc đăng nhập, bạn đồng ý với{" "}
                <a href="#" className="text-purple-300 hover:text-purple-200 underline">
                  điều khoản & chính sách bảo mật
                </a>{" "}
                của chúng tôi.
              </p>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />

      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 left-16 w-72 h-72 bg-purple-600/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-16 w-96 h-96 bg-pink-500/40 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
}

