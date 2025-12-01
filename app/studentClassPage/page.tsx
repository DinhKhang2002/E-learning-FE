"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  CalendarDays,
  User,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardClass from "@/components/DashboardClass";
import StudentClassManagement from "@/components/StudentClassManagement"; // Import Sidebar mới

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;
const CHECK_ROOMS_API = (classId: string | number) =>
  `http://localhost:8080/education/api/rooms/class/${classId}/check`;
const JOIN_ROOM_API = `http://localhost:8080/education/api/rooms/join`;

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

interface RoomResponse {
  roomCode: string;
  roomName: string;
  teacherId: number;
  classId: number;
  subject: string;
  startTime: string;
  finishTime: string | null;
  description: string;
  status: string;
  classRoomPath: string;
  isActive: boolean;
  createdBy: string;
}

interface RoomInfo {
  roomCode: string;
  roomName: string;
  classRoomPath: string;
  status: string;
  roomId?: number;
}

interface CheckRoomsResponse {
  hasRoom: boolean;
  listRooms: RoomResponse[] | null;
}

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
  const [activeRoom, setActiveRoom] = useState<RoomInfo | null>(null);
  const [showRoomBanner, setShowRoomBanner] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      setError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      router.push("/login");
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

  useEffect(() => {
    if (authToken && classId) {
      fetchClassDetail(authToken, classId);
    }
  }, [authToken, classId, fetchClassDetail]);

  const checkActiveRooms = useCallback(
    async (token: string, id: string | null) => {
      if (!id) return;

      try {
        const response = await fetch(CHECK_ROOMS_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (response.ok && data.code === 1000 && data.result) {
          const result = data.result as CheckRoomsResponse;
          if (result.hasRoom && result.listRooms && result.listRooms.length > 0) {
            const room = result.listRooms[0];
            if (room.classRoomPath) {
              setActiveRoom({
                roomCode: room.roomCode,
                roomName: room.roomName,
                classRoomPath: room.classRoomPath,
                status: room.status,
                roomId: (room as any).id || undefined,
              });
            }
          } else {
            setActiveRoom(null);
          }
        }
      } catch (err) {
        console.warn("Failed to check active rooms:", err);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      checkActiveRooms(authToken, classId);
      const interval = setInterval(() => {
        checkActiveRooms(authToken, classId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authToken, classId, checkActiveRooms]);

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

        {/* Thanh bên cho học sinh (Sidebar) */}
        <StudentClassManagement classId={classId} />

        {/* Nội dung chính: Thêm padding-left để tránh sidebar */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-8 pl-24">
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

          {/* Active Room Banner */}
          {activeRoom && showRoomBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 p-5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Cuộc họp đang diễn ra
                    </h3>
                    <p className="text-sm text-slate-700 mb-3">
                      {activeRoom.roomName}
                    </p>
                    <button
                      onClick={async () => {
                        if (activeRoom.classRoomPath && authToken) {
                          try {
                            const storedUser = window.localStorage.getItem("user");
                            let userId: number | null = null;
                            if (storedUser) {
                                try {
                                    const user = JSON.parse(storedUser);
                                    userId = user.id || null;
                                } catch (error) {
                                    console.warn("Failed to parse user info", error);
                                }
                            }
                            const roomId = activeRoom.roomId;
                            if (userId && roomId) {
                              const response = await fetch(JOIN_ROOM_API, {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${authToken}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ roomId: roomId, userId: userId }),
                              });
                              const data = await response.json();
                              if (!response.ok || data.code !== 1000) {
                                console.warn("Failed to save join room history:", data?.message);
                              }
                            }
                          } catch (error) {
                            console.warn("Error calling join room API:", error);
                          }
                          window.location.href = activeRoom.classRoomPath;
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                      <Video className="w-4 h-4" />
                      Tham gia ngay
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoomBanner(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Main Content Area (Center Column) */}
          <div className="max-w-5xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="space-y-8"
            >
              {/* Class Information Card */}
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
                            Mã lớp:{" "}
                            <span className="font-mono font-semibold text-indigo-600">
                              {classData?.code}
                            </span>
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

              {/* Dashboard */}
              <DashboardClass
                classId={classId}
                authToken={authToken}
                className={classData?.name}
                canCreate={false} // Học sinh không được tạo bài đăng (tùy logic business)
              />
            </motion.div>
          </div>

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