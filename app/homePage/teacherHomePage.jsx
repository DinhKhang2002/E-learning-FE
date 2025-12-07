"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Layers,
  MessageCircle,
  PenSquare,
  X,
  BookOpen,
  Hash,
  FileText,
  GraduationCap as GraduationCapIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeacherCourseCard from "@/components/TeacherCourseCard";
import TeacherQuickActionCard from "@/components/TeacherQuickActionCard";
import TeacherStatCard from "@/components/TeacherStatCard";
import TeacherScheduleItem from "@/components/TeacherScheduleItem";
import TeacherTodoItem from "@/components/TeacherTodoItem";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASSES_API = `${BASE_HTTP}/api/classes/teacher`;
const CREATE_CLASS_API = `${BASE_HTTP}/api/classes`;
const NOTICES_API = (userId) =>
  `${BASE_HTTP}/api/notices/user/${userId}`;

const scheduleItems = [
  {
    id: 1,
    day: "THỨ 2",
    date: 15,
    title: "Quantum Physics - Lecture",
    time: "10:00 AM - 11:30 AM",
  },
  {
    id: 2,
    day: "THỨ 3",
    date: 16,
    title: "Organic Chemistry - Lab Session",
    time: "01:00 PM - 03:00 PM",
  },
  {
    id: 3,
    day: "THỨ 5",
    date: 18,
    title: "Office Hours",
    time: "02:00 PM - 04:00 PM",
  },
];

const todoItems = [
  {
    id: 1,
    label: "Hoàn thiện đề thi giữa kỳ môn Quantum Physics",
    completed: true,
  },
  {
    id: 2,
    label: "Chấm điểm bài tập 3 cho lớp Quantum Physics",
    completed: false,
  },
  {
    id: 3,
    label: "Chuẩn bị bài giảng về Ancient Rome",
    completed: false,
  },
];

export default function TeacherHomePage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);

  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);

  // Create class modal state
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    semester: "",
    code: "",
    description: "",
    classCode: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const storedUser = window.localStorage.getItem("user");

    if (token) {
      setAuthToken(token);
    } else {
      setClassesLoading(false);
      setClassesError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      setNotificationsError("Thiếu mã xác thực. Vui lòng đăng nhập để xem thông báo.");
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.warn("Failed to parse stored user", error);
        setUser(null);
      }
    }
  }, []);

  const fetchTeacherClasses = useCallback(
    async (token) => {
      setClassesLoading(true);
      setClassesError(null);
      try {
        const response = await fetch(CLASSES_API, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách lớp. Vui lòng thử lại."
          );
        }

        const classList = data.result ?? [];
        setClasses(classList);

        const uniqueSemesters = Array.from(
          new Set(
            classList
              .map((item) => item.semester)
              .filter((semester) => typeof semester === "string" && semester.trim() !== "")
          )
        ).sort((a, b) => Number(b) - Number(a));

        setSemesters(uniqueSemesters);
        setSelectedSemester((prev) => {
          if (prev && uniqueSemesters.includes(prev)) {
            return prev;
          }
          return uniqueSemesters[0] ?? null;
        });
      } catch (error) {
        setClasses([]);
        setSemesters([]);
        setClassesError(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách lớp. Vui lòng thử lại sau."
        );
      } finally {
        setClassesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authToken) return;
    fetchTeacherClasses(authToken);
  }, [authToken, fetchTeacherClasses]);

  const filteredClasses = useMemo(() => {
    if (!selectedSemester) return classes;
    return classes.filter((item) => item.semester === selectedSemester);
  }, [classes, selectedSemester]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const activityStats = useMemo(
    () => [
      {
        id: 1,
        label: "Lớp đang quản lý",
        value: classes.length.toString(),
        icon: Layers,
        description: "Tổng số lớp bạn đang phụ trách",
        accent: "bg-sky-100 text-sky-600",
      },
      {
        id: 2,
        label: "Học kỳ mới nhất",
        value: semesters[0] ?? "—",
        icon: CalendarDays,
        description: "Tự động cập nhật theo học kỳ mới",
        accent: "bg-indigo-100 text-indigo-600",
      },
      {
        id: 3,
        label: "Thông báo chưa đọc",
        value: unreadNotificationCount.toString(),
        icon: MessageCircle,
        description: "Theo dõi hoạt động mới nhất từ lớp học",
        accent: "bg-amber-100 text-amber-600",
      },
    ],
    [classes.length, semesters, unreadNotificationCount]
  );

  const handleRetryClasses = () => {
    if (authToken) {
      fetchTeacherClasses(authToken);
    }
  };

  const handleOpenCreateClassModal = () => {
    // Set default values
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    // Semester format: YYYY + semester number (1 or 2)
    const defaultSemester = `${currentYear}${currentMonth <= 6 ? 1 : 2}`;
    
    setFormData({
      name: "",
      semester: defaultSemester,
      code: "",
      description: "",
      classCode: "",
    });
    setFormErrors({});
    setCreateClassError(null);
    setShowCreateClassModal(true);
  };

  const handleCloseCreateClassModal = () => {
    setShowCreateClassModal(false);
    setFormErrors({});
    setCreateClassError(null);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Vui lòng nhập tên lớp học";
    }
    
    if (!formData.semester.trim()) {
      errors.semester = "Vui lòng nhập học kỳ";
    } else if (!/^\d{5}$/.test(formData.semester)) {
      errors.semester = "Học kỳ phải có định dạng YYYYS (ví dụ: 20251)";
    }
    
    if (!formData.code.trim()) {
      errors.code = "Vui lòng nhập mã lớp học";
    }
    
    if (!formData.classCode.trim()) {
      errors.classCode = "Vui lòng nhập mã lớp (classCode)";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!authToken) {
      setCreateClassError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    setIsCreatingClass(true);
    setCreateClassError(null);

    try {
      const response = await fetch(CREATE_CLASS_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          semester: formData.semester.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || formData.name.trim(),
          classCode: formData.classCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(
          data?.message || "Không thể tạo lớp học. Vui lòng thử lại."
        );
      }

      // Success - redirect to class page
      const newClassId = data.result.id;
      router.push(`/classPage?id=${newClassId}`);
    } catch (err) {
      setCreateClassError(
        err instanceof Error
          ? err.message
          : "Không thể tạo lớp học. Vui lòng thử lại sau."
      );
    } finally {
      setIsCreatingClass(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100 via-white to-transparent" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-12 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Xin chào, giảng viên!
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  Chào mừng trở lại, {user?.firstName ? `${user.firstName}!` : "Professor!"}
                </h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Theo dõi lịch giảng dạy, quản lý lớp học và cập nhật thông báo mới nhất trong một nơi.
                </p>
              </div>
            </div>
          </motion.header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="flex flex-col gap-10">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.1, duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Lớp học của tôi
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Danh sách các lớp bạn đang quản lý theo từng học kỳ.
                    </p>
                  </div>
                  {semesters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {semesters.map((semester) => {
                        const isActive = semester === selectedSemester;
                        return (
                          <button
                            key={semester}
                            type="button"
                            onClick={() => setSelectedSemester(semester)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_12px_34px_rgba(37,99,235,0.35)]"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600"
                            }`}
                          >
                            Học kỳ {semester}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {classesLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        className="h-56 rounded-3xl bg-white/60 shadow-inner animate-pulse"
                      />
                    ))}
                  </div>
                ) : classesError ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                    <p className="font-semibold">Không thể tải danh sách lớp</p>
                    <p className="mt-2">{classesError}</p>
                    <button
                      type="button"
                      onClick={handleRetryClasses}
                      className="mt-4 inline-flex items-center rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : filteredClasses.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    Không có lớp nào trong học kỳ được chọn.
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClasses.map((course) => (
                      <TeacherCourseCard
                        key={course.id}
                        name={course.name}
                        code={course.code}
                        description={course.description}
                        semester={course.semester}
                        createdAt={course.createdAt}
                        onAction={() => {
                          router.push(`/classPage?id=${course.id}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Tổng quan hoạt động
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {activityStats.map((stat) => (
                    <TeacherStatCard key={stat.id} {...stat} />
                  ))}
                </div>
              </motion.section>
            </div>

            <aside className="flex flex-col gap-8">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl"
              >
                <TeacherQuickActionCard
                  title="Tạo khóa học mới"
                  description="Bắt đầu xây dựng khóa học mới và chia sẻ kiến thức của bạn."
                  actionLabel="Bắt đầu tạo"
                  onAction={handleOpenCreateClassModal}
                />
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.3, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lịch giảng dạy
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <BookOpenCheck size={16} strokeWidth={1.75} />
                    Xem toàn bộ
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {scheduleItems.map((item) => (
                    <TeacherScheduleItem key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.4, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Danh sách công việc
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <PenSquare size={16} strokeWidth={1.75} />
                    Quản lý
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {todoItems.map((item) => (
                    <TeacherTodoItem key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>
            </aside>
          </div>
        </section>
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateClassModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleCloseCreateClassModal}
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
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
                  <button
                    onClick={handleCloseCreateClassModal}
                    className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-slate-900 pr-12">
                    Tạo lớp học mới
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Điền thông tin để tạo lớp học mới
                  </p>
                </div>

                {/* Form Content */}
                <form onSubmit={handleCreateClass} className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-5">
                    {/* Class Name */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <BookOpen className="w-4 h-4 text-sky-500" />
                        Tên lớp học <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nhập tên lớp học"
                        className={`w-full rounded-xl border ${
                          formErrors.name
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        Học kỳ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({ ...formData, semester: e.target.value })
                        }
                        placeholder="Ví dụ: 20251 (Năm 2025, Học kỳ 1)"
                        className={`w-full rounded-xl border ${
                          formErrors.semester
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all`}
                      />
                      {formErrors.semester && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.semester}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Định dạng: YYYYS (ví dụ: 20251 cho năm 2025 học kỳ 1, 20252 cho học kỳ 2)
                      </p>
                    </div>

                    {/* Code */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <Hash className="w-4 h-4 text-purple-500" />
                        Mã lớp học <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        placeholder="Nhập mã lớp học"
                        className={`w-full rounded-xl border ${
                          formErrors.code
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all`}
                      />
                      {formErrors.code && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.code}
                        </p>
                      )}
                    </div>

                    {/* Class Code */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <GraduationCapIcon className="w-4 h-4 text-emerald-500" />
                        Mã lớp (Class Code) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.classCode}
                        onChange={(e) =>
                          setFormData({ ...formData, classCode: e.target.value.toUpperCase() })
                        }
                        placeholder="Ví dụ: CNTT, TKPM"
                        className={`w-full rounded-xl border ${
                          formErrors.classCode
                            ? "border-red-300 bg-red-50"
                            : "border-slate-200 bg-white"
                        } px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all uppercase`}
                      />
                      {formErrors.classCode && (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.classCode}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <FileText className="w-4 h-4 text-amber-500" />
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
                        placeholder="Nhập mô tả cho lớp học (tùy chọn)"
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {createClassError && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-600">{createClassError}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCloseCreateClassModal}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingClass}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingClass ? "Đang tạo..." : "Tạo lớp học"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

