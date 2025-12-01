"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Home, Video, X } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClassDetailInfo from "@/components/ClassDetailInfo";
import ClassManagement from "@/components/ClassManagement";
import DashboardClass from "@/components/DashboardClass";

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;
const CREATE_ROOM_API = `http://localhost:8080/education/api/rooms/create`;
const SAVE_ROOM_PATH_API = (roomId: string | number, path: string) =>
  `http://localhost:8080/education/api/rooms/${roomId}/save-path?path=${encodeURIComponent(path)}`;
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

interface MeetingData {
  roomName: string;
  subject: string;
  startTime: string;
  description: string;
}

interface RoomResponse {
  roomCode: string;
  roomName: string;
  teacherId: number;
  classId: number;
  subject: string;
  startTime: string;
  description: string;
  status: string;
  isActive: boolean;
  createdBy: string;
  id?: number; // Room ID if available
  classRoomPath?: string;
  finishTime?: string | null;
}

interface RoomInfo {
  roomCode: string;
  roomName: string;
  classRoomPath: string;
  status: string;
  roomId?: number; // Room ID from API response
}

interface CheckRoomsResponse {
  hasRoom: boolean;
  listRooms: RoomResponse[] | null;
}

export default function ClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("id");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RoomInfo | null>(null);
  const [showRoomBanner, setShowRoomBanner] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const storedUser = window.localStorage.getItem("user");
    
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      setError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      router.push("/login");
    }

    // Check if user is a teacher
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userRole = typeof user?.role === "string" ? user.role.toUpperCase() : null;
        setIsTeacher(userRole === "TEACHER");
      } catch (error) {
        console.warn("Failed to parse stored user", error);
        setIsTeacher(false);
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
            // Get the first active room
            const room = result.listRooms[0];
            if (room.classRoomPath) {
              setActiveRoom({
                roomCode: room.roomCode,
                roomName: room.roomName,
                classRoomPath: room.classRoomPath,
                status: room.status,
                roomId: (room as any).id || undefined, // Try to get id from response
              });
            }
          } else {
            setActiveRoom(null);
          }
        }
      } catch (err) {
        console.warn("Failed to check active rooms:", err);
        // Don't set error, just silently fail
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      checkActiveRooms(authToken, classId);
      // Poll every 30 seconds to check for new rooms
      const interval = setInterval(() => {
        checkActiveRooms(authToken, classId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authToken, classId, checkActiveRooms]);

  const handleCreateMeeting = useCallback(async (meetingData: MeetingData) => {
    if (!authToken || !classId || !classData) {
      setError("Thiếu thông tin cần thiết để tạo cuộc họp");
      return;
    }

    setIsCreatingMeeting(true);
    setError(null);

    try {
      // Get current user info
      const storedUser = window.localStorage.getItem("user");
      let userId = classData.teacherId;
      let userName = classData.teacherName || "Giáo viên";

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userId = user.id || classData.teacherId;
          userName = user.name || user.email || classData.teacherName || "Giáo viên";
        } catch (error) {
          console.warn("Failed to parse user info", error);
        }
      }

      // Prepare room data from form
      const roomData = {
        roomName: meetingData.roomName,
        teacherId: userId,
        classId: parseInt(classId),
        subject: meetingData.subject,
        startTime: meetingData.startTime,
        description: meetingData.description,
      };

      const response = await fetch(CREATE_ROOM_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(
          data?.message || "Không thể tạo cuộc họp. Vui lòng thử lại."
        );
      }

      const roomResult = data.result as RoomResponse;
      const roomCode = roomResult.roomCode;
      
      // Create room URL (same format as in classRoom page)
      const currentUrl = typeof window !== "undefined" 
        ? window.location.origin 
        : "http://localhost:3000";
      const roomUrl = `${currentUrl}/classRoom?roomCode=${roomCode}&roomId=${roomCode}&userId=${userId}&userName=${encodeURIComponent(userName)}`;

      // Save room path to database
      // Check if response has id field, otherwise we might need to extract from roomCode or use roomCode directly
      // Based on the API example, roomId in the path is a number, so we check for id first
      const roomIdForPath = (roomResult as any).id || roomCode;
      
      try {
        const savePathResponse = await fetch(
          SAVE_ROOM_PATH_API(roomIdForPath, roomUrl),
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const savePathData = await savePathResponse.json();
        
        if (!savePathResponse.ok || savePathData.code !== 1000) {
          console.warn(
            "Không thể lưu đường dẫn phòng họp:",
            savePathData?.message || "Unknown error"
          );
          // Don't throw error, just log warning - room is already created
        }
      } catch (savePathError) {
        console.warn("Lỗi khi lưu đường dẫn phòng họp:", savePathError);
        // Don't throw error, just log warning - room is already created
      }

      // Redirect to room page
      router.push(`/classRoom?roomCode=${roomCode}&roomId=${roomCode}&userId=${userId}&userName=${encodeURIComponent(userName)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo cuộc họp. Vui lòng thử lại sau."
      );
    } finally {
      setIsCreatingMeeting(false);
    }
  }, [authToken, classId, classData, router]);

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

          {/* Active Room Banner */}
          {activeRoom && showRoomBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 p-5 shadow-lg"
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
                            // Get userId from localStorage
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

                            // Get roomId - try from activeRoom
                            // Note: roomId should come from the API response (check rooms API)
                            // If not available, we'll skip the join API call but still redirect
                            const roomId = activeRoom.roomId;

                            if (userId && roomId) {
                              // Call join room API
                              const response = await fetch(JOIN_ROOM_API, {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${authToken}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  roomId: roomId,
                                  userId: userId,
                                }),
                              });

                              const data = await response.json();
                              
                              // Even if API fails, still redirect (don't block user)
                              if (!response.ok || data.code !== 1000) {
                                console.warn("Failed to save join room history:", data?.message);
                              }
                            } else {
                              console.warn("Missing userId or roomId for join room API");
                            }
                          } catch (error) {
                            console.warn("Error calling join room API:", error);
                            // Continue with redirect even if API fails
                          }

                          // Redirect to classRoom page
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

          <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              {/* Class Detail Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <ClassDetailInfo classData={classData} loading={loading} />
              </motion.div>

              {/* Dashboard */}
              <DashboardClass
                classId={classId}
                authToken={authToken}
                className={classData?.name}
                canCreate={isTeacher}
              />
            </div>

            <div className="space-y-8">
              {/* Class Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <ClassManagement
                  classId={classId}
                  onCreateMeeting={handleCreateMeeting}
                  isTeacher={isTeacher}
                  isCreatingMeeting={isCreatingMeeting}
                  className={classData?.name}
                />
              </motion.div>
            </div>
          </div>

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

