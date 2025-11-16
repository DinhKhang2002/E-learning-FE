"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MessageSquare,
  NotebookPen,
  Trophy,
  Loader2,
  ChevronDown,
  Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClassCard from "@/components/ClassCard";
import SuggestClassCard from "@/components/SuggestClassCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import ScheduleCard from "@/components/ScheduleCard";

const STUDENT_CLASSES_API = (studentId: string | number) =>
  `http://localhost:8080/education/api/class-students/classes/${studentId}`;

interface ClassData {
  id: number;
  name: string;
  code: string;
  description: string;
  semester: string;
  teacherId: number;
  teacherName: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

// Helper function to get class illustration from name
function getClassIllustration(name: string): string {
  if (!name) return "CL";
  const firstTwo = name.substring(0, 2).toUpperCase();
  return firstTwo;
}

// Helper function to get accent color based on index
function getAccentColor(index: number): "default" | "green" | "purple" | "orange" {
  const colors: ("default" | "green" | "purple" | "orange")[] = ["default", "green", "purple", "orange"];
  return colors[index % colors.length];
}

const suggestedClasses = [
  {
    id: 1,
    title: "JavaScript nâng cao",
    author: "John Doe",
    accent: "from-cyan-100 to-sky-200",
    illustration: "JS",
  },
  {
    id: 2,
    title: "Khóa học dữ liệu với R",
    author: "Jane Smith",
    accent: "from-emerald-100 to-green-200",
    illustration: "R",
  },
  {
    id: 3,
    title: "Nhập môn Thiết kế đồ họa",
    author: "Alex Ray",
    accent: "from-indigo-100 to-blue-200",
    illustration: "GD",
  },
  {
    id: 4,
    title: "Kỹ năng nói trước công chúng",
    author: "Emily White",
    accent: "from-amber-100 to-orange-200",
    illustration: "SP",
  },
];

const announcements = [
  {
    id: 1,
    title: "Bài tập mới môn Python",
    time: "Hạn chót: 25/9, Thứ Sáu",
    icon: NotebookPen,
  },
  {
    id: 2,
    title: "Giảng viên đã trả lời câu hỏi của bạn",
    time: "2 giờ trước",
    icon: MessageSquare,
  },
  {
    id: 3,
    title: "Thông báo từ khóa Marketing kỹ thuật số",
    time: "1 ngày trước",
    icon: Trophy,
  },
];

const schedules = [
  {
    id: 1,
    day: 28,
    month: "Tháng 10",
    title: "Buổi học trực tuyến UI/UX",
    time: "19:00 - 21:00",
  },
  {
    id: 2,
    day: 30,
    month: "Tháng 10",
    title: "Deadline bài tập Python",
    time: "23:59",
  },
  {
    id: 3,
    day: 5,
    month: "Tháng 11",
    title: "Thảo luận nhóm Marketing",
    time: "09:00 - 10:30",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");
    
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      router.push("/login");
      return;
    }

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.id) {
          setStudentId(user.id);
        } else {
          setError("Không tìm thấy ID học sinh");
          setLoading(false);
        }
      } catch (err) {
        setError("Không thể đọc thông tin người dùng");
        setLoading(false);
      }
    } else {
      setError("Không tìm thấy thông tin người dùng");
      setLoading(false);
    }
  }, [router]);

  const fetchStudentClasses = useCallback(
    async (token: string, id: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(STUDENT_CLASSES_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ClassData[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách lớp học. Vui lòng thử lại."
          );
        }

        setClasses(data.result || []);
      } catch (err) {
        console.error("Failed to fetch student classes:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách lớp học. Vui lòng thử lại sau."
        );
        setClasses([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && studentId) {
      fetchStudentClasses(authToken, studentId);
    }
  }, [authToken, studentId, fetchStudentClasses]);

  // Get unique semesters from classes
  const availableSemesters = useMemo(() => {
    const semesters = new Set<string>();
    classes.forEach((cls) => {
      if (cls.semester) {
        semesters.add(cls.semester);
      }
    });
    return Array.from(semesters).sort().reverse(); // Sort descending (newest first)
  }, [classes]);

  // Filter classes by selected semester
  const filteredClasses = useMemo(() => {
    if (selectedSemester === "all") {
      return classes;
    }
    return classes.filter((cls) => cls.semester === selectedSemester);
  }, [classes, selectedSemester]);

  const handleClassClick = (classId: number) => {
    router.push(`/studentClassPage?id=${classId}`);
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100/80 via-slate-50 to-transparent" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-12 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Xin chào, học viên!
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  Tiếp tục hành trình học tập
                </h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Theo dõi tiến độ, nhận thông báo mới và khám phá khóa học phù
                  hợp với bạn.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Tìm khóa học
              </button>
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
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Khóa học đang theo học
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Semester Filter Dropdown */}
                    {availableSemesters.length > 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                        >
                          <Filter className="w-4 h-4" />
                          <span>
                            {selectedSemester === "all"
                              ? "Tất cả học kỳ"
                              : `Học kỳ ${selectedSemester}`}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isSemesterDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isSemesterDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setIsSemesterDropdownOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 z-20 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSemester("all");
                                  setIsSemesterDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm transition ${
                                  selectedSemester === "all"
                                    ? "bg-sky-50 text-sky-600 font-semibold"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                Tất cả học kỳ
                              </button>
                              {availableSemesters.map((semester) => (
                                <button
                                  key={semester}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSemester(semester);
                                    setIsSemesterDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm transition ${
                                    selectedSemester === semester
                                      ? "bg-sky-50 text-sky-600 font-semibold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  Học kỳ {semester}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Đang tải khóa học...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-600 font-semibold mb-2">
                      Không thể tải khóa học
                    </p>
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                    <button
                      onClick={() => {
                        if (authToken && studentId) {
                          fetchStudentClasses(authToken, studentId);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                    >
                      <Loader2 className="w-4 h-4" />
                      Thử lại
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredClasses.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <p className="text-slate-600 font-medium mb-2">
                      {selectedSemester === "all"
                        ? "Bạn chưa tham gia lớp học nào"
                        : `Không có lớp học nào trong học kỳ ${selectedSemester}`}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Hãy tham gia các khóa học để bắt đầu học tập
                    </p>
                  </div>
                )}

                {/* Classes Grid */}
                {!loading && !error && filteredClasses.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClasses.map((classItem, index) => (
                      <ClassCard
                        key={classItem.id}
                        title={classItem.name}
                        subtitle={classItem.description || `Mã lớp: ${classItem.code}`}
                        progress={0} // Progress can be calculated later if needed
                        accent={getAccentColor(index)}
                        illustration={getClassIllustration(classItem.name)}
                        onAction={() => handleClassClick(classItem.id)}
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
                    Gợi ý cho bạn
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Cá nhân hóa gợi ý
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {suggestedClasses.map((item) => (
                    <SuggestClassCard
                      key={item.id}
                      {...item}
                      onClick={() => {
                        // TODO: Navigate to class details or search page
                        console.log("Suggested class clicked:", item.title);
                      }}
                    />
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
                className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Thông báo mới
                  </h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {announcements.map((item) => (
                    <AnnouncementCard key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lịch trình sắp tới
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <CalendarDays size={16} strokeWidth={1.75} />
                    Xem lịch
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {schedules.map((item) => (
                    <ScheduleCard key={item.id} {...item} />
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
