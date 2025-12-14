"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  FileText,
  Edit,
  Trash2,
  X,
  Eye,
  Play,
  Calendar,
  Clock,
  GraduationCap,
  AlertCircle,
  List,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const EXAMS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/exams/${classId}/class`;

const EXAM_DETAIL_API = (examId: number) =>
  `${BASE_HTTP}/api/exams/${examId}`;

const UPDATE_EXAM_API = (examId: number) =>
  `${BASE_HTTP}/api/exams/${examId}`;

const DELETE_EXAM_API = (examId: number) =>
  `${BASE_HTTP}/api/exams/${examId}`;

const START_EXAM_API = (examId: number) =>
  `${BASE_HTTP}/api/exams/${examId}/start`;

const EXAM_QUESTIONS_API = (examId: number, page: number, size: number) =>
  `${BASE_HTTP}/api/exams/${examId}/questions?page=${page}&size=${size}`;

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

interface Exam {
  id: number;
  title: string;
  description: string;
  classId: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface ExamDetail extends Exam {
  questions?: any[];
  totalQuestions?: number;
}

interface ExamQuestion {
  questionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface PaginatedQuestionsResponse {
  content: ExamQuestion[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

export default function ExamManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  
  // Questions modal states
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [questionsPage, setQuestionsPage] = useState(0);
  const [questionsPageSize, setQuestionsPageSize] = useState(10);
  const [questionsTotalPages, setQuestionsTotalPages] = useState(0);
  const [questionsTotalElements, setQuestionsTotalElements] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

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
    async (token: string, id: string) => {
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
        console.error("Failed to fetch class detail:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin lớp học. Vui lòng thử lại sau."
        );
      }
    },
    []
  );

  const fetchExams = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(EXAMS_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Exam[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải danh sách đề thi. Vui lòng thử lại."
          );
        }

        setExams(data.result || []);
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách đề thi. Vui lòng thử lại sau."
        );
        setExams([]);
      }
    },
    []
  );

  const fetchExamDetail = useCallback(
    async (token: string, examId: number) => {
      try {
        const response = await fetch(EXAM_DETAIL_API(examId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ExamDetail> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải chi tiết đề thi. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch exam detail:", err);
        throw err;
      }
    },
    []
  );

  const fetchExamQuestions = useCallback(
    async (token: string, examId: number, page: number, size: number) => {
      try {
        const response = await fetch(EXAM_QUESTIONS_API(examId, page, size), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<PaginatedQuestionsResponse> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải danh sách câu hỏi. Vui lòng thử lại."
          );
        }

        setExamQuestions(data.result.content || []);
        setQuestionsTotalPages(data.result.totalPages || 0);
        setQuestionsTotalElements(data.result.totalElements || 0);
      } catch (err) {
        console.error("Failed to fetch exam questions:", err);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchExams(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchExams]);

  const handleViewDetail = async (exam: Exam) => {
    if (!authToken) return;
    try {
      const detail = await fetchExamDetail(authToken, exam.id);
      setSelectedExam(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert("Không thể tải chi tiết đề thi. Vui lòng thử lại.");
    }
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam as ExamDetail);
    setEditTitle(exam.title);
    setEditDescription(exam.description);
    // Format datetime for input
    const formatForInput = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    setEditStartTime(formatForInput(exam.startTime));
    setEditEndTime(formatForInput(exam.endTime));
    setShowEditModal(true);
  };

  const handleUpdateExam = async () => {
    if (!authToken || !selectedExam) return;
    if (!editTitle.trim() || !editStartTime || !editEndTime) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(UPDATE_EXAM_API(selectedExam.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          title: editTitle.trim(),
          description: editDescription.trim() || "",
          startTime: new Date(editStartTime).toISOString(),
          endTime: new Date(editEndTime).toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể cập nhật đề thi.");
      }

      await fetchExams(authToken, classId);
      setShowEditModal(false);
      setSelectedExam(null);
      alert("Cập nhật đề thi thành công!");
    } catch (err) {
      console.error("Failed to update exam:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật đề thi. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này?")) {
      return;
    }

    setDeletingId(examId);
    try {
      const response = await fetch(DELETE_EXAM_API(examId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa đề thi.");
      }

      await fetchExams(authToken, classId);
      alert("Xóa đề thi thành công!");
    } catch (err) {
      console.error("Failed to delete exam:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa đề thi. Vui lòng thử lại."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartExam = async (examId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn bắt đầu bài thi này?")) {
      return;
    }

    setStartingId(examId);
    try {
      const response = await fetch(START_EXAM_API(examId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể bắt đầu bài thi.");
      }

      await fetchExams(authToken, classId);
      
      // Lấy classRoomPath từ response và chuyển hướng
      const classRoomPath = data.result?.room?.classRoomPath;
      if (classRoomPath) {
        // Chuyển hướng đến classRoom với full URL
        window.location.href = classRoomPath;
      } else {
        alert("Bắt đầu bài thi thành công!");
      }
    } catch (err) {
      console.error("Failed to start exam:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể bắt đầu bài thi. Vui lòng thử lại."
      );
    } finally {
      setStartingId(null);
    }
  };

  const handleViewQuestions = async (exam: Exam) => {
    if (!authToken) return;
    setSelectedExam(exam as ExamDetail);
    setShowQuestionsModal(true);
    setQuestionsPage(0);
    setLoadingQuestions(true);
    try {
      await fetchExamQuestions(authToken, exam.id, 0, questionsPageSize);
    } catch (err) {
      alert("Không thể tải danh sách câu hỏi. Vui lòng thử lại.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (showQuestionsModal && selectedExam && authToken) {
      setLoadingQuestions(true);
      fetchExamQuestions(authToken, selectedExam.id, questionsPage, questionsPageSize)
        .finally(() => {
          setLoadingQuestions(false);
        });
    }
  }, [showQuestionsModal, questionsPage, questionsPageSize, selectedExam, authToken, fetchExamQuestions]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExamStatus = (exam: Exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return {
        label: "Chưa bắt đầu",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      };
    } else if (now >= startTime && now <= endTime) {
      return {
        label: "Đang diễn ra",
        color: "bg-green-100 text-green-800 border-green-300",
      };
    } else {
      return {
        label: "Đã kết thúc",
        color: "bg-slate-100 text-slate-800 border-slate-300",
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
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
            <Link
              href={`/classPage?id=${classId}`}
              className="text-slate-600 hover:text-slate-900 transition"
            >
              {classData?.name || "Lớp học"}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Quản lý đề thi</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">
                  Quản lý đề thi
                </h1>
                <p className="text-slate-600 mt-1">
                  Quản lý và theo dõi các đề thi trong lớp học
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 p-4 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-6">
              <div>
                <span className="text-sm text-slate-600">Tổng số đề thi:</span>
                <span className="ml-2 text-lg font-bold text-sky-600">
                  {exams.length}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Đang diễn ra:</span>
                <span className="ml-2 text-lg font-bold text-green-600">
                  {
                    exams.filter(
                      (exam) =>
                        new Date() >= new Date(exam.startTime) &&
                        new Date() <= new Date(exam.endTime)
                    ).length
                  }
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Đã kết thúc:</span>
                <span className="ml-2 text-lg font-bold text-slate-600">
                  {
                    exams.filter(
                      (exam) => new Date() > new Date(exam.endTime)
                    ).length
                  }
                </span>
              </div>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {exams.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-12 text-center"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Chưa có đề thi nào</p>
                </motion.div>
              ) : (
                exams.map((exam, index) => {
                  const status = getExamStatus(exam);
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="relative group rounded-2xl bg-white p-6 shadow-lg border-2 border-slate-200 hover:border-sky-300 transition-all duration-300 overflow-hidden"
                    >
                      {/* Gradient Background */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400" />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                              {exam.title}
                            </h3>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {exam.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {exam.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="w-4 h-4 text-sky-600" />
                            <span className="font-medium">Bắt đầu:</span>
                            <span>{formatDateTime(exam.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-sky-600" />
                            <span className="font-medium">Kết thúc:</span>
                            <span>{formatDateTime(exam.endTime)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-xs text-slate-500">
                            ID: {exam.id}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewQuestions(exam);
                              }}
                              className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Xem câu hỏi"
                            >
                              <List className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(exam);
                              }}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(exam);
                              }}
                              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartExam(exam.id);
                              }}
                              disabled={startingId === exam.id}
                              className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Bắt đầu bài thi"
                            >
                              {startingId === exam.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExam(exam.id);
                              }}
                              disabled={deletingId === exam.id}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa"
                            >
                              {deletingId === exam.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <Footer />

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowDetailModal(false);
              setSelectedExam(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedExam(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Chi tiết đề thi
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getExamStatus(selectedExam).color}`}
                    >
                      {getExamStatus(selectedExam).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Tiêu đề
                    </h3>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-slate-900 font-semibold text-lg">
                        {selectedExam.title}
                      </p>
                    </div>
                  </div>

                  {selectedExam.description && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Mô tả
                      </h3>
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <p className="text-slate-700 leading-relaxed">
                          {selectedExam.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Thời gian bắt đầu
                      </h3>
                      <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <p className="text-slate-900 font-semibold">
                            {formatDateTime(selectedExam.startTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Thời gian kết thúc
                      </h3>
                      <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-red-600" />
                          <p className="text-slate-900 font-semibold">
                            {formatDateTime(selectedExam.endTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedExam.totalQuestions !== undefined && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Số lượng câu hỏi
                      </h3>
                      <div className="rounded-xl bg-green-50 p-4 border border-green-200">
                        <p className="text-slate-900 font-semibold text-lg">
                          {selectedExam.totalQuestions} câu hỏi
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Thông tin khác
                    </h3>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">ID đề thi:</span>
                          <span className="font-semibold text-slate-900">
                            {selectedExam.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Ngày tạo:</span>
                          <span className="font-semibold text-slate-900">
                            {formatDateTime(selectedExam.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions Modal */}
      <AnimatePresence>
        {showQuestionsModal && selectedExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowQuestionsModal(false);
              setSelectedExam(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <button
                  onClick={() => {
                    setShowQuestionsModal(false);
                    setSelectedExam(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Danh sách câu hỏi
                  </h2>
                  <p className="text-sm text-slate-600">
                    Đề thi: <span className="font-semibold">{selectedExam.title}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Tổng cộng: <span className="font-semibold text-purple-600">{questionsTotalElements}</span> câu hỏi
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingQuestions ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : examQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Chưa có câu hỏi nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examQuestions.map((question, index) => (
                      <motion.div
                        key={question.questionId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl bg-slate-50 p-5 border border-slate-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {questionsPage * questionsPageSize + index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-slate-900 mb-3">
                              {question.question}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                                <span className="font-bold text-slate-600 min-w-[20px]">A.</span>
                                <span className="text-slate-700">{question.optionA}</span>
                              </div>
                              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                                <span className="font-bold text-slate-600 min-w-[20px]">B.</span>
                                <span className="text-slate-700">{question.optionB}</span>
                              </div>
                              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                                <span className="font-bold text-slate-600 min-w-[20px]">C.</span>
                                <span className="text-slate-700">{question.optionC}</span>
                              </div>
                              <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                                <span className="font-bold text-slate-600 min-w-[20px]">D.</span>
                                <span className="text-slate-700">{question.optionD}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {questionsTotalPages > 0 && (
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-700">
                        Số câu hỏi/trang:
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={questionsPageSize}
                        onChange={(e) => {
                          const size = parseInt(e.target.value) || 10;
                          setQuestionsPageSize(Math.max(5, Math.min(50, size)));
                          setQuestionsPage(0);
                        }}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-sm text-slate-600">
                      Trang {questionsPage + 1} / {questionsTotalPages} ({questionsTotalElements} câu hỏi)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuestionsPage(0)}
                        disabled={questionsPage === 0}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Đầu
                      </button>
                      <button
                        onClick={() => setQuestionsPage((prev) => Math.max(0, prev - 1))}
                        disabled={questionsPage === 0}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, questionsTotalPages) }, (_, i) => {
                        let pageNum;
                        if (questionsTotalPages <= 5) {
                          pageNum = i;
                        } else if (questionsPage < 3) {
                          pageNum = i;
                        } else if (questionsPage > questionsTotalPages - 4) {
                          pageNum = questionsTotalPages - 5 + i;
                        } else {
                          pageNum = questionsPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setQuestionsPage(pageNum)}
                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                              questionsPage === pageNum
                                ? "bg-purple-600 text-white border-purple-600"
                                : "border-slate-300 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          setQuestionsPage((prev) => Math.min(questionsTotalPages - 1, prev + 1))
                        }
                        disabled={questionsPage === questionsTotalPages - 1}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQuestionsPage(questionsTotalPages - 1)}
                        disabled={questionsPage === questionsTotalPages - 1}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cuối
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowEditModal(false);
              setSelectedExam(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExam(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  Chỉnh sửa đề thi
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Nhập tiêu đề đề thi"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Nhập mô tả đề thi"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExam(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateExam}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl font-semibold hover:from-sky-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

