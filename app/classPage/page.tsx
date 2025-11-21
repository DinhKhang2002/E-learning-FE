"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Home, Video, Loader2, X } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClassDetailInfo from "@/components/ClassDetailInfo";
import ClassManagement from "@/components/ClassManagement";

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

export default function ClassPage() {
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

        const data = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải thông tin lớp học. Vui lòng thử lại."
          );
        }

        setClassData(data.result as ClassData);
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

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100 via-white to-transparent" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-center gap-2 text-sm"
          >
            <Link
              href="/homePage"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">E-Learning</span>
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
              className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-lg"
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

          {/* Class Detail Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <ClassDetailInfo classData={classData} loading={loading} />
          </motion.div>

          {/* Class Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <ClassManagement classId={classId} />
          </motion.div>

          {/* Error State */}
          {error && !loading && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-600 font-semibold mb-2">
                Không thể tải thông tin lớp học
              </p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId) {
                    fetchClassDetail(authToken, classId);
                  }
                }}
                className="inline-flex items-center rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Thử lại
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

