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
  Calendar,
  BookOpen as BookIcon,
  FileText as FileTextIcon,
  ChevronRight,
  Menu,
  Map,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

const managementItems = [
  {
    id: 1,
    label: "Quản lý học sinh",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50",
    href: "/classPage/students",
  },
  {
    id: 2,
    label: "Quản lý tài liệu",
    icon: BookOpen,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    href: "/classPage/documents",
  },
  {
    id: 3,
    label: "Điểm danh",
    icon: CheckSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    href: "/classPage/attendance",
  },
  {
    id: 4,
    label: "Đơn xin nghỉ học",
    icon: ClipboardList,
    color: "text-amber-500",
    bg: "bg-amber-50",
    href: "/classPage/leave-requests",
  },
  {
    id: 5,
    label: "Bài tập về nhà",
    icon: FileText,
    color: "text-pink-500",
    bg: "bg-pink-50",
    href: "/classPage/assignments",
  },
  {
    id: 6,
    label: "Ngân hàng câu hỏi",
    icon: PenTool,
    color: "text-violet-500",
    bg: "bg-violet-50",
    href: "/classPage/question-bank",
  },
  {
    id: 7,
    label: "Quản lý đề thi",
    icon: GraduationCap,
    color: "text-sky-500",
    bg: "bg-sky-50",
    href: "/classPage/exams",
  },
  {
    id: 8,
    label: "Quản lý điểm",
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    href: "/classPage/grades",
  },
  {
    id: 9,
    label: "Lộ trình học tập",
    icon: Map,
    color: "text-purple-500",
    bg: "bg-purple-50",
    href: "/classPage/learning-roadmap",
  },
];

const SUBJECTS = [
  { value: "MATH", label: "Toán học" },
  { value: "PHYSICS", label: "Vật lý" },
  { value: "CHEMISTRY", label: "Hóa học" },
  { value: "BIOLOGY", label: "Sinh học" },
  { value: "LITERATURE", label: "Ngữ văn" },
  { value: "HISTORY", label: "Lịch sử" },
  { value: "GEOGRAPHY", label: "Địa lý" },
  { value: "ENGLISH", label: "Tiếng Anh" },
  { value: "INFORMATICS", label: "Tin học" },
  { value: "GENERAL", label: "Chung" },
];

export default function ClassManagement({
  classId,
  onCreateMeeting,
  isTeacher,
  isCreatingMeeting,
  className,
}) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // State để kiểm soát việc mở rộng sidebar

  const [formData, setFormData] = useState({
    roomName: "",
    subject: "GENERAL",
    startTime: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleClick = (href) => {
    if (classId) {
      router.push(`${href}?classId=${classId}`);
    } else {
      router.push(href);
    }
  };

  const handleOpenModal = () => {
    const now = new Date();
    const defaultTime = new Date(now.getTime() + 5 * 60 * 1000);
    const defaultDateTime = defaultTime.toISOString().slice(0, 16);

    setFormData({
      roomName: className ? `${className} - Cuộc họp` : "Cuộc họp mới",
      subject: "GENERAL",
      startTime: defaultDateTime,
      description: "",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.roomName.trim()) {
      errors.roomName = "Vui lòng nhập tên cuộc họp";
    }
    if (!formData.startTime) {
      errors.startTime = "Vui lòng chọn thời gian bắt đầu";
    } else {
      const selectedTime = new Date(formData.startTime);
      const now = new Date();
      if (selectedTime < now) {
        errors.startTime = "Thời gian bắt đầu phải sau thời điểm hiện tại";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const startTimeISO = new Date(formData.startTime).toISOString();
    onCreateMeeting({
      roomName: formData.roomName.trim(),
      subject: formData.subject,
      startTime: startTimeISO,
      description: formData.description.trim() || `Cuộc họp ${formData.roomName}`,
    });
    handleCloseModal();
  };

  return (
    <>
      {/* Sidebar Container */}
      <motion.div
        initial={{ width: "4.5rem" }}
        animate={{ width: isExpanded ? "18rem" : "4.5rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className="fixed left-4 top-24 bottom-4 z-40 flex flex-col rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Header / Logo Area */}
        <div className="flex items-center h-20 px-5 border-b border-slate-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md">
            <Menu className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="ml-4 font-bold text-slate-800 whitespace-nowrap overflow-hidden"
              >
                Công cụ lớp học
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button (Create Meeting) */}
        {isTeacher && (
          <div className="p-3 border-b border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent closing if sidebar behavior changes
                handleOpenModal();
              }}
              className={`relative flex w-full items-center ${
                isExpanded ? "justify-start px-4" : "justify-center"
              } h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all hover:shadow-blue-500/25 hover:scale-[1.02]`}
            >
              <Video className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 font-semibold whitespace-nowrap overflow-hidden"
                  >
                    Tạo cuộc họp
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        )}

        {/* Scrollable Menu Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-2 px-3 custom-scrollbar">
          {managementItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.href)}
                className={`group flex w-full items-center ${
                  isExpanded ? "justify-start px-3" : "justify-center"
                } h-12 rounded-xl transition-all hover:bg-slate-100/80 relative`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.color} transition-transform group-hover:scale-110 shadow-sm`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 text-sm font-medium text-slate-700 whitespace-nowrap overflow-hidden group-hover:text-slate-900"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -ml-1 -mt-1 h-2 w-2 -rotate-45 bg-slate-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / Toggle Hint */}
        <div className="p-4 border-t border-slate-100 flex justify-center">
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </motion.div>

      {/* Create Meeting Modal - Giữ nguyên logic cũ */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
               {/* Giữ nguyên nội dung form Modal cũ ở đây */}
               {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 pr-12">
                    Tạo cuộc họp mới
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Điền thông tin để tạo cuộc họp cho lớp học
                  </p>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-5">
                    {/* Room Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <Video className="w-4 h-4 text-blue-500" />
                        Tên cuộc họp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.roomName}
                        onChange={(e) =>
                          setFormData({ ...formData, roomName: e.target.value })
                        }
                        placeholder="Nhập tên cuộc họp"
                        className={`w-full rounded-xl border ${
                          formErrors.roomName
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {formErrors.roomName && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.roomName}
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <BookIcon className="w-4 h-4 text-indigo-500" />
                        Môn học
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {SUBJECTS.map((subject) => (
                          <option key={subject.value} value={subject.value}>
                            {subject.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({ ...formData, startTime: e.target.value })
                        }
                        min={new Date().toISOString().slice(0, 16)}
                        className={`w-full rounded-xl border ${
                          formErrors.startTime
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                      {formErrors.startTime && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.startTime}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <FileTextIcon className="w-4 h-4 text-purple-500" />
                        Mô tả
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Nhập mô tả cho cuộc họp (tùy chọn)"
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingMeeting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingMeeting ? "Đang tạo..." : "Tạo cuộc họp"}
                    </button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}