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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function ClassManagement({ classId, onCreateMeeting, isTeacher, isCreatingMeeting, className }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    // Set default values
    const now = new Date();
    const defaultTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
    const defaultDateTime = defaultTime.toISOString().slice(0, 16); // Format for datetime-local input
    
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
    
    if (!validateForm()) {
      return;
    }

    // Convert datetime-local to ISO string
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Thành phần quản lý lớp học
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chọn một thành phần để quản lý lớp học của bạn
          </p>
        </div>
        {isTeacher && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenModal}
            disabled={isCreatingMeeting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="w-5 h-5" />
            {isCreatingMeeting ? "Đang tạo..." : "Tạo cuộc họp"}
          </motion.button>
        )}
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

      {/* Create Meeting Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <button
                    onClick={handleCloseModal}
                    className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

