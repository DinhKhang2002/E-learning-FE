"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  GraduationCap,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Award,
  Search,
  Play,
  Timer,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EXAMS_API = (classId: string | number) =>
  `http://localhost:8080/education/api/exams/class/${classId}/student`;

const EXAM_RESULTS_API = (examId: string | number) =>
  `http://localhost:8080/education/api/exams/${examId}/results`;

const START_EXAM_API = (examId: string | number) =>
  `http://localhost:8080/education/api/exams/${examId}/start`;

interface Exam {
  id: number;
  title: string;
  description: string;
  classId: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface ExamResult {
  studentId: number;
  studentName: string;
  score: number;
  submittedAt: string;
  status: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

type ExamStatus = "upcoming" | "ongoing" | "ended";

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

function formatDateTime(input: string) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExamStatus(exam: Exam): ExamStatus {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);

  if (now < startTime) {
    return "upcoming";
  } else if (now >= startTime && now <= endTime) {
    return "ongoing";
  } else {
    return "ended";
  }
}

function getStatusInfo(status: ExamStatus) {
  switch (status) {
    case "upcoming":
      return {
        label: "Chờ thi",
        color: "bg-amber-100 text-amber-700 border-amber-300",
        icon: Clock,
        bgGradient: "from-amber-500 to-orange-500",
        buttonText: "Chờ thi",
        buttonColor: "from-amber-500 to-orange-600",
      };
    case "ongoing":
      return {
        label: "Đang diễn ra",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
        icon: Play,
        bgGradient: "from-emerald-500 to-teal-500",
        buttonText: "Vào thi",
        buttonColor: "from-emerald-500 to-teal-600",
      };
    case "ended":
      return {
        label: "Đã kết thúc",
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: CheckCircle2,
        bgGradient: "from-slate-500 to-slate-600",
        buttonText: "Xem kết quả thi",
        buttonColor: "from-blue-500 to-cyan-600",
      };
    default:
      return {
        label: "Không xác định",
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: AlertCircle,
        bgGradient: "from-slate-500 to-slate-600",
        buttonText: "Xem chi tiết",
        buttonColor: "from-slate-500 to-slate-600",
      };
  }
}

function calculateTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Đã kết thúc";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

export default function ExamAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

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
        }
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
  }, [router]);

  const fetchExams = useCallback(
    async (token: string, cId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(EXAMS_API(cId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Exam[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách kỳ thi. Vui lòng thử lại."
          );
        }

        setExams(data.result || []);
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách kỳ thi. Vui lòng thử lại sau."
        );
        setExams([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchExamResult = useCallback(
    async (token: string, examId: number, sId: number | null) => {
      setLoadingResult(true);
      setError(null);
      try {
        const response = await fetch(EXAM_RESULTS_API(examId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ExamResult[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải kết quả thi. Vui lòng thử lại."
          );
        }

        // Find the result for the current student
        if (sId && data.result.length > 0) {
          const studentResult = data.result.find((result) => result.studentId === sId);
          if (studentResult) {
            setExamResult(studentResult);
          } else {
            setExamResult(null);
            setError("Bạn chưa có kết quả thi cho kỳ thi này.");
          }
        } else {
          setExamResult(null);
          setError("Không tìm thấy kết quả thi của bạn.");
        }
      } catch (err) {
        console.error("Failed to fetch exam result:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải kết quả thi. Vui lòng thử lại sau."
        );
        setExamResult(null);
      } finally {
        setLoadingResult(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      fetchExams(authToken, classId);
    }
  }, [authToken, classId, fetchExams]);

  const handleStartExam = async (exam: Exam) => {
    if (!authToken) return;
    
    try {
      const response = await fetch(START_EXAM_API(exam.id), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể bắt đầu kỳ thi. Vui lòng thử lại."
        );
      }

      // Navigate to exam online page with endTime
      const endTimeParam = encodeURIComponent(exam.endTime);
      router.push(`/studentClassAction/ExamOnlineAction?examId=${exam.id}&classId=${classId}&endTime=${endTimeParam}`);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể bắt đầu kỳ thi. Vui lòng thử lại sau."
      );
    }
  };

  const handleExamClick = (exam: Exam) => {
    const status = getExamStatus(exam);
    
    if (status === "upcoming") {
      alert("Vui lòng chờ đến thời gian bắt đầu thi.");
      return;
    }
    
    if (status === "ongoing") {
      // Start exam and navigate to exam online page
      if (authToken) {
        handleStartExam(exam);
      }
      return;
    }
    
    if (status === "ended") {
      setSelectedExam(exam);
      setExamResult(null);
      if (authToken) {
        fetchExamResult(authToken, exam.id, studentId);
      }
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: exams.length,
      upcoming: exams.filter((exam) => {
        const start = new Date(exam.startTime);
        return now < start;
      }).length,
      ongoing: exams.filter((exam) => {
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);
        return now >= start && now <= end;
      }).length,
      ended: exams.filter((exam) => {
        const end = new Date(exam.endTime);
        return now > end;
      }).length,
    };
  }, [exams]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải kỳ thi...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-amber-100/80 via-orange-100/60 to-red-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 flex items-center gap-2 text-sm"
          >
            <Link
              href="/homePage"
              className="flex items-center gap-2 text-slate-600 hover:text-amber-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/studentClassPage?id=${classId}`}
              className="text-slate-600 hover:text-amber-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Hệ thống thi online</span>
          </motion.nav>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Hệ thống thi online
                </h1>
                <p className="text-slate-600">
                  Tham gia các kỳ thi trực tuyến và xem kết quả
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm kỳ thi..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Statistics */}
          {exams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Chờ thi</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Đang diễn ra</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.ongoing}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Đã kết thúc</p>
                    <p className="text-2xl font-bold text-slate-600">{stats.ended}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6"
            >
              <p className="text-red-600 font-semibold mb-2">Không thể tải kỳ thi</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId) {
                    fetchExams(authToken, classId);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </motion.div>
          )}

          {/* Exams Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {filteredExams.length === 0 ? (
                <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    {searchQuery ? "Không tìm thấy kỳ thi nào" : "Chưa có kỳ thi nào"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Kỳ thi sẽ được hiển thị tại đây khi giáo viên tạo và kích hoạt"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredExams
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((exam, index) => {
                      const status = getExamStatus(exam);
                      const statusInfo = getStatusInfo(status);
                      const StatusIcon = statusInfo.icon;
                      const now = new Date();
                      const startTime = new Date(exam.startTime);
                      const endTime = new Date(exam.endTime);
                      const isUpcoming = now < startTime;
                      const timeRemaining = isUpcoming
                        ? calculateTimeRemaining(exam.startTime)
                        : status === "ongoing"
                        ? calculateTimeRemaining(exam.endTime)
                        : null;

                      return (
                        <motion.div
                          key={exam.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${statusInfo.bgGradient} shadow-lg flex-shrink-0`}
                              >
                                <GraduationCap className="w-6 h-6 text-white" />
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                              {exam.title}
                            </h3>

                            {/* Description */}
                            {exam.description && (
                              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                {exam.description}
                              </p>
                            )}

                            {/* Time Info */}
                            <div className="space-y-2 mb-4 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-3 h-3" />
                                <span>Bắt đầu: {formatDateTime(exam.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Kết thúc: {formatDateTime(exam.endTime)}</span>
                              </div>
                              {timeRemaining && (
                                <div className="flex items-center gap-2 text-amber-600 font-semibold">
                                  <Timer className="w-3 h-3" />
                                  <span>
                                    {status === "upcoming"
                                      ? `Còn lại: ${timeRemaining}`
                                      : `Còn lại: ${timeRemaining}`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => handleExamClick(exam)}
                              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${statusInfo.buttonColor} px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              {statusInfo.buttonText}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>

      {/* Exam Result Modal */}
      <AnimatePresence>
        {selectedExam && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setSelectedExam(null);
                setExamResult(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Kết quả thi</h2>
                  <button
                    onClick={() => {
                      setSelectedExam(null);
                      setExamResult(null);
                    }}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {selectedExam && (
                  <div className="space-y-6">
                    {/* Exam Info */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {selectedExam.title}
                      </h3>
                      {selectedExam.description && (
                        <p className="text-slate-600 mb-4">{selectedExam.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                            Thời gian bắt đầu
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDateTime(selectedExam.startTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                            Thời gian kết thúc
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDateTime(selectedExam.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Loading Result */}
                    {loadingResult && (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-2" />
                          <p className="text-slate-600 text-sm">Đang tải kết quả thi...</p>
                        </div>
                      </div>
                    )}

                    {/* Error Loading Result */}
                    {error && !loadingResult && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Exam Result */}
                    {examResult && !loadingResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Score Display */}
                        {examResult.score !== undefined && (
                          <div className="p-6 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
                                  <Trophy className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-amber-700 uppercase">
                                    Điểm số
                                  </p>
                                  <p className="text-4xl font-bold text-amber-700">
                                    {examResult.score.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {examResult.status && (
                                <div className="text-right">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    examResult.status === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                      : "bg-slate-100 text-slate-700 border border-slate-300"
                                  }`}>
                                    {examResult.status === "COMPLETED" ? "Hoàn thành" : examResult.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Submission Info */}
                        {examResult.submittedAt && (
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                Nộp bài lúc: {formatDateTime(examResult.submittedAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Student Info */}
                        {examResult.studentName && (
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <h4 className="text-sm font-bold text-blue-900 mb-3">
                              Thông tin học sinh
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700 font-medium">Họ tên:</span>
                                <span className="text-blue-900">{examResult.studentName}</span>
                              </div>
                              {examResult.studentId && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700 font-medium">Mã học sinh:</span>
                                  <span className="text-blue-900">{examResult.studentId}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* No Result Yet */}
                    {!examResult && !loadingResult && !error && (
                      <div className="p-6 bg-slate-50 rounded-xl text-center">
                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">
                          Chưa có kết quả thi
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          Kết quả sẽ được hiển thị sau khi giáo viên chấm bài
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

