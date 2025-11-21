"use client";

import {
  BookOpen,
  CheckSquare,
  FileText,
  GraduationCap,
  PenTool,
  Star,
  Users,
  ClipboardList,
  Video,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const managementItems = [
  {
    id: 1,
    label: "Quản lý học sinh",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    href: "/classPage/students",
  },
  {
    id: 2,
    label: "Quản lý tài liệu",
    icon: BookOpen,
    color: "from-indigo-500 to-purple-500",
    href: "/classPage/documents",
  },
  {
    id: 3,
    label: "Điểm danh",
    icon: CheckSquare,
    color: "from-emerald-500 to-teal-500",
    href: "/classPage/attendance",
  },
  {
    id: 4,
    label: "Đơn xin nghỉ học",
    icon: ClipboardList,
    color: "from-amber-500 to-orange-500",
    href: "/classPage/leave-requests",
  },
  {
    id: 5,
    label: "Bài tập về nhà",
    icon: FileText,
    color: "from-pink-500 to-rose-500",
    href: "/classPage/assignments",
  },
  {
    id: 6,
    label: "Ngân hàng câu hỏi",
    icon: PenTool,
    color: "from-violet-500 to-purple-500",
    href: "/classPage/question-bank",
  },
  {
    id: 7,
    label: "Quản lý đề thi",
    icon: GraduationCap,
    color: "from-sky-500 to-blue-500",
    href: "/classPage/exams",
  },
  {
    id: 8,
    label: "Quản lý điểm",
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    href: "/classPage/grades",
  },
];

export default function ClassManagement({ classId }) {
  const router = useRouter();
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Form states
  const [roomName, setRoomName] = useState("");
  const [subject, setSubject] = useState("MATH");
  const [startTime, setStartTime] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");

    if (token) {
      setAuthToken(token);
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.id) {
          setTeacherId(user.id);
        }
      } catch (err) {
        console.error("Không thể đọc thông tin người dùng", err);
      }
    }
  }, []);

  const handleClick = (href) => {
    if (classId) {
      router.push(`${href}?classId=${classId}`);
    } else {
      router.push(href);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !startTime || !teacherId || !classId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/education/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          teacherId: teacherId,
          classId: parseInt(classId),
          subject: subject,
          startTime: startTime,
          description: description.trim() || "",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(data.message || "Không thể tạo cuộc họp. Vui lòng thử lại.");
      }

      // Chuyển hướng đến trang classroom với roomCode
      router.push(`/classRoom/${data.result.roomCode}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenModal = () => {
    // Set default startTime to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const defaultTime = now.toISOString().slice(0, 16);
    setStartTime(defaultTime);
    setShowCreateRoomModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowCreateRoomModal(false);
    setRoomName("");
    setSubject("MATH");
    setStartTime("");
    setDescription("");
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Thành phần quản lý lớp học
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn một thành phần để quản lý lớp học của bạn
          </p>
        </div>
        <motion.button
          onClick={handleOpenModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Video className="w-5 h-5" />
          <span>Tạo Cuộc họp</span>
        </motion.button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {managementItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(item.href)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 group"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Tạo Cuộc họp</h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tên cuộc họp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Lớp Toán 10A1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="MATH">Toán</option>
                  <option value="PHYSICS">Vật lý</option>
                  <option value="CHEMISTRY">Hóa học</option>
                  <option value="BIOLOGY">Sinh học</option>
                  <option value="LITERATURE">Ngữ văn</option>
                  <option value="HISTORY">Lịch sử</option>
                  <option value="GEOGRAPHY">Địa lý</option>
                  <option value="ENGLISH">Tiếng Anh</option>
                  <option value="COMPUTER_SCIENCE">Tin học</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả cho cuộc họp..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCloseModal}
                disabled={isCreating}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating || !roomName.trim() || !startTime}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Đang tạo..." : "Tạo cuộc họp"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

