"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Layers,
  MessageCircle,
  PenSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeacherCourseCard from "@/components/TeacherCourseCard";
import TeacherQuickActionCard from "@/components/TeacherQuickActionCard";
import TeacherStatCard from "@/components/TeacherStatCard";
import TeacherScheduleItem from "@/components/TeacherScheduleItem";
import TeacherTodoItem from "@/components/TeacherTodoItem";
import TeacherNotificationList from "@/components/TeacherNotificationList";

const CLASSES_API = "http://localhost:8080/education/api/classes/teacher";
const NOTICES_API = (userId) =>
  `http://localhost:8080/education/api/notices/user/${userId}`;

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

  const fetchTeacherNotifications = useCallback(async (token, userId) => {
    if (!userId) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetch(NOTICES_API(userId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
        throw new Error(
          data?.message || "Không thể tải thông báo của bạn. Vui lòng thử lại."
        );
      }

      setNotifications(data.result ?? []);
    } catch (error) {
      setNotifications([]);
      setNotificationsError(
        error instanceof Error
          ? error.message
          : "Không thể tải thông báo. Vui lòng thử lại sau."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authToken) return;
    fetchTeacherClasses(authToken);
  }, [authToken, fetchTeacherClasses]);

  useEffect(() => {
    if (!authToken || !user?.id) return;
    fetchTeacherNotifications(authToken, user.id);
  }, [authToken, user, fetchTeacherNotifications]);

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

  const handleRetryNotifications = () => {
    if (authToken && user?.id) {
      fetchTeacherNotifications(authToken, user.id);
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
                />
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.3, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Thông báo gần đây
                  </h3>
                  <button
                    type="button"
                    onClick={handleRetryNotifications}
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Làm mới
                  </button>
                </div>
                <div className="mt-5">
                  <TeacherNotificationList
                    notifications={notifications}
                    loading={notificationsLoading}
                    error={notificationsError}
                    onRetry={handleRetryNotifications}
                  />
                </div>
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

      <Footer />
    </main>
  );
}

