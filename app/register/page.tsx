"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Phone,
  Home,
  UserRound,
  CalendarDays,
  Loader2,
  ShieldPlus,
  GraduationCap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const REGISTER_API = "http://localhost:8080/education/api/auth/register";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
] as const;

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Học viên" },
  { value: "TEACHER", label: "Giảng viên" },
] as const;

interface RegisterResponse {
  message: string;
  code: number;
  result?: string;
}

const DEFAULT_FORM_STATE = {
  username: "",
  password: "",
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  address: "",
  gender: "MALE" as (typeof GENDER_OPTIONS)[number]["value"],
  role: "STUDENT" as (typeof ROLE_OPTIONS)[number]["value"],
  dob: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
  }, [form]);

  const handleChange = (
    event: FormEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = event.currentTarget;
    setForm((prev) => ({
      ...prev,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(REGISTER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok || data.code !== 1000) {
        throw new Error(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }

      setSuccessMessage(data.result || "Đăng ký thành công!");
      setForm(DEFAULT_FORM_STATE);

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng kiểm tra lại thông tin đăng ký."
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
              <ShieldPlus className="w-4 h-4" />
              <span>Bắt đầu hành trình học tập của bạn</span>
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Tạo tài khoản{" "}
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                E-Learning
              </span>{" "}
              ngay hôm nay
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Gia nhập cộng đồng học tập hiện đại, tận hưởng kho kiến thức đa
              dạng cùng các giảng viên chuyên gia hàng đầu trong nhiều lĩnh
              vực.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Lớp học trực tiếp sinh động",
                "Bài giảng cập nhật liên tục",
                "Theo dõi tiến độ thông minh",
                "Chứng chỉ uy tín",
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
                <h2 className="text-2xl font-semibold">Đăng ký tài khoản</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Điền thông tin chi tiết để tạo tài khoản mới.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                    Họ
                  </label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      id="firstName"
                      name="firstName"
                      value={form.firstName}
                      onInput={handleChange}
                      placeholder="Nguyễn"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                    Tên
                  </label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onInput={handleChange}
                      placeholder="Văn A"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-300">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    id="username"
                    name="username"
                    value={form.username}
                    onInput={handleChange}
                    placeholder="john_doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onInput={handleChange}
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
                    name="password"
                    type="password"
                    value={form.password}
                    onInput={handleChange}
                    placeholder="StrongPass123@"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-300">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onInput={handleChange}
                      placeholder="0987654321"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium text-gray-300">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      value={form.dob}
                      onInput={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium text-gray-300">
                  Địa chỉ
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    id="address"
                    name="address"
                    value={form.address}
                    onInput={handleChange}
                    placeholder="123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="gender" className="text-sm font-medium text-gray-300">
                    Giới tính
                  </label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          gender: event.target.value as typeof form.gender,
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60 appearance-none transition-all"
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium text-gray-300">
                    Vai trò
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          role: event.target.value as typeof form.role,
                        }))
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/60 appearance-none transition-all"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-gray-900 text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {successMessage}
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
                  <span>Tạo tài khoản</span>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Bằng việc đăng ký, bạn đồng ý với{" "}
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

