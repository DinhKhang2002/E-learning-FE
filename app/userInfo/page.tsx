"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: string;
  role: string;
  primarySubject: string;
  avatar: string;
  dob: string;
}

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const USER_INFO_API = `${BASE_HTTP}/api/users/getUserInfo`;

function formatDate(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatGender(gender: string) {
  const genderMap: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };
  return genderMap[gender] || gender;
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    TEACHER: "Giảng viên",
    STUDENT: "Sinh viên",
    ADMIN: "Quản trị viên",
  };
  return roleMap[role] || role;
}

function formatSubject(subject: string) {
  const subjectMap: Record<string, string> = {
    COMPUTER_SCIENCE: "Khoa học máy tính",
    MATHEMATICS: "Toán học",
    PHYSICS: "Vật lý",
    CHEMISTRY: "Hóa học",
    BIOLOGY: "Sinh học",
    ENGLISH: "Tiếng Anh",
    LITERATURE: "Văn học",
    HISTORY: "Lịch sử",
  };
  return subjectMap[subject] || subject;
}

export default function UserInfoPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (typeof window === "undefined") return;

      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(USER_INFO_API, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải thông tin người dùng. Vui lòng thử lại."
          );
        }

        setUserInfo(data.result);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin người dùng. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lỗi</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/homePage")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header với nút quay lại */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Avatar và thông tin cơ bản */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={userInfo.avatar || "/avatar-default.png"}
                    alt={fullName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{fullName}</h2>
                <p className="text-slate-500 mb-4">{userInfo.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm">
                  <GraduationCap className="w-4 h-4" />
                  {formatRole(userInfo.role)}
                </div>
              </div>
            </div>
          </div>

          {/* Card thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cá nhân */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Tên đăng nhập
                    </p>
                    <p className="text-slate-900 font-semibold text-base font-mono">
                      {userInfo.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Email
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {userInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {userInfo.phoneNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex-shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Ngày sinh
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {formatDate(userInfo.dob)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Giới tính
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {formatGender(userInfo.gender)}
                    </p>
                  </div>
                </div>

                {userInfo.role === "TEACHER" && userInfo.primarySubject && (
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                        Môn học chính
                      </p>
                      <p className="text-slate-900 font-semibold text-base">
                        {formatSubject(userInfo.primarySubject)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            {userInfo.address && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  Địa chỉ
                </h3>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium text-base leading-relaxed">
                      {userInfo.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

