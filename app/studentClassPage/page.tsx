"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  CheckSquare,
  FileText,
  BookOpen,
  GraduationCap,
  Star,
  CalendarDays,
  Hash,
  User,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;
const CHECK_ROOM_API = (classId: string | number) =>
  `http://localhost:8080/education/api/rooms/check/${classId}`;
const JOIN_ROOM_API = (roomCode: string, userId: number) =>
  `http://localhost:8080/education/api/rooms/${roomCode}/join?userId=${userId}`;

interface ClassData {
  id: number;
  name: string;
  code: string;
  description: string;
  semester: string;
  teacherId: number;
  teacherName: string;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

interface Room {
  id: string;
  roomCode: string;
  roomName: string;
  teacherId: number;
  classId: number;
  subject: string;
  startTime: string;
  description: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

interface RoomCheckResponse {
  hasRoom: boolean;
  listRooms: Room[] | null;
}

const studentSections = [
  {
    id: 1,
    label: "Điểm danh & Xin nghỉ",
    icon: CheckSquare,
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    hoverColor: "hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600",
    href: "/studentClassAction/AttandenceAction",
    description: "Xem lịch sử điểm danh và gửi đơn xin nghỉ",
  },
  {
    id: 2,
    label: "Tài liệu lớp",
    icon: BookOpen,
    color: "from-indigo-500 via-purple-500 to-pink-500",
    hoverColor: "hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600",
    href: "/studentClassAction/DocumentAction",
    description: "Tải xuống và xem tài liệu học tập",
  },
  {
    id: 3,
    label: "Bài tập được giao",
    icon: FileText,
    color: "from-blue-500 via-cyan-500 to-sky-500",
    hoverColor: "hover:from-blue-600 hover:via-cyan-600 hover:to-sky-600",
    href: "/studentClassAction/AssignmentAction",
    description: "Xem và nộp bài tập về nhà",
  },
  {
    id: 4,
    label: "Hệ thống thi online",
    icon: GraduationCap,
    color: "from-amber-500 via-orange-500 to-red-500",
    hoverColor: "hover:from-amber-600 hover:via-orange-600 hover:to-red-600",
    href: "/studentClassAction/ExamAction",
    description: "Tham gia các kỳ thi trực tuyến",
  },
  {
    id: 5,
    label: "Xem điểm",
    icon: Star,
    color: "from-yellow-500 via-amber-500 to-orange-500",
    hoverColor: "hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600",
    href: "/studentClassAction/ScoreAction",
    description: "Xem điểm các bài tập và kỳ thi",
  },
];

function formatDate(input: string) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function StudentClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("id");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");
    
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      setError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      router.push("/login");
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.id) {
          setUserId(user.id);
        }
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
  }, [router]);

  const fetchClassDetail = useCallback(
    async (token: string, id: string | null) => {
      if (!id) {
        setError("Không tìm thấy ID lớp học");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(CLASS_DETAIL_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ClassData> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải thông tin lớp học. Vui lòng thử lại."
          );
        }

        setClassData(data.result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin lớp học. Vui lòng thử lại sau."
        );
        setClassData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkActiveRoom = useCallback(
    async (token: string, id: string | null) => {
      if (!id) return;

      setCheckingRoom(true);
      try {
        const response = await fetch(CHECK_ROOM_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok && data.code === 1000 && data.result) {
          const result: RoomCheckResponse = data.result;
          if (result.hasRoom && result.listRooms && result.listRooms.length > 0) {
            // Lấy room đầu tiên có status STARTED
            const startedRoom = result.listRooms.find((room) => room.status === "STARTED");
            setActiveRoom(startedRoom || result.listRooms[0]);
          } else {
            setActiveRoom(null);
          }
        }
      } catch (err) {
        console.error("Failed to check room:", err);
        // Không hiển thị lỗi nếu check room fail, chỉ log
      } finally {
        setCheckingRoom(false);
      }
    },
    []
  );

  const handleJoinRoom = useCallback(
    async (roomCode: string) => {
      if (!authToken || !userId) {
        setError("Vui lòng đăng nhập để tham gia cuộc họp");
        return;
      }

      setJoiningRoom(true);
      try {
        const response = await fetch(JOIN_ROOM_API(roomCode, userId), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(data?.message || "Không thể tham gia cuộc họp");
        }

        // Navigate to room page
        router.push(`/classRoom/${roomCode}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tham gia cuộc họp. Vui lòng thử lại."
        );
        setJoiningRoom(false);
      }
    },
    [authToken, userId, router]
  );

  useEffect(() => {
    if (authToken && classId) {
      fetchClassDetail(authToken, classId);
      checkActiveRoom(authToken, classId);
    }
  }, [authToken, classId, fetchClassDetail, checkActiveRoom]);

  const handleSectionClick = (href: string) => {
    if (classId) {
      router.push(`${href}?classId=${classId}`);
    } else {
      router.push(href);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin lớp học...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !classData) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center max-w-md">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-lg">
              <p className="text-red-600 font-semibold mb-2 text-lg">
                Không thể tải thông tin lớp học
              </p>
              <p className="text-red-500 text-sm mb-6">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId) {
                    fetchClassDetail(authToken, classId);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 shadow-md"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background Gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-indigo-100/80 via-purple-100/60 via-pink-100/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-8">
          {/* Breadcrumb Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 flex items-center gap-2 text-sm"
          >
            <Link
              href="/homePage"
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">
              {classData?.name || "Lớp học"}
            </span>
          </motion.nav>

          {/* Active Room Notification */}
          {activeRoom && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Cuộc họp đang diễn ra
                      </h3>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500 text-white">
                        {activeRoom.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      {activeRoom.roomName}
                    </p>
                    {activeRoom.description && (
                      <p className="text-sm text-slate-600 mb-3">
                        {activeRoom.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Mã phòng: <span className="font-mono font-semibold text-emerald-600">{activeRoom.roomCode}</span></span>
                      {activeRoom.startTime && (
                        <span>
                          Bắt đầu: {new Date(activeRoom.startTime).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleJoinRoom(activeRoom.roomCode)}
                    disabled={joiningRoom}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningRoom ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tham gia...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>Tham gia ngay</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveRoom(null)}
                    className="p-2 rounded-lg hover:bg-emerald-100 transition-colors"
                    aria-label="Đóng thông báo"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Class Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-8">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-200/30 to-rose-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">
                          {classData?.name || "Lớp học"}
                        </h1>
                        <p className="text-sm text-slate-500">
                          Mã lớp: <span className="font-mono font-semibold text-indigo-600">{classData?.code}</span>
                        </p>
                      </div>
                    </div>
                    {classData?.description && (
                      <p className="text-slate-600 leading-relaxed max-w-2xl">
                        {classData.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 border border-indigo-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Giảng viên
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {classData?.teacherName || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-4 border border-pink-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Học kỳ
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {classData?.semester ? `Học kỳ ${classData.semester}` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 border border-emerald-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Ngày tạo
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {formatDate(classData?.createdAt || "")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Student Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Thành phần lớp học
              </h2>
              <p className="text-slate-600">
                Chọn một thành phần để bắt đầu học tập
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSectionClick(section.href)}
                    className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 text-left"
                  >
                    {/* Gradient Background on Hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                    />

                    {/* Icon */}
                    <div className="relative mb-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${section.color} ${section.hoverColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {section.label}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {section.description}
                      </p>
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Error Message (if any) */}
          {error && classData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center"
            >
              <p className="text-amber-600 text-sm">{error}</p>
            </motion.div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

