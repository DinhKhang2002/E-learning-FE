"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Plus,
  Loader2,
  FileText,
  Edit,
  Trash2,
  X,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  Shuffle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;

const QUESTIONS_API = (classId: string | number, page: number, size: number) =>
  `http://localhost:8080/education/api/questions?classId=${classId}&page=${page}&size=${size}`;

const QUESTION_DETAIL_API = (questionId: number) =>
  `http://localhost:8080/education/api/questions/${questionId}`;

const CREATE_QUESTION_API = "http://localhost:8080/education/api/questions";

const UPDATE_QUESTION_API = (questionId: number) =>
  `http://localhost:8080/education/api/questions/${questionId}`;

const DELETE_QUESTION_API = (questionId: number) =>
  `http://localhost:8080/education/api/questions/${questionId}`;

const CREATE_EXAM_FROM_QUESTIONS_API =
  "http://localhost:8080/education/api/exams/choose";

const CREATE_RANDOM_EXAM_API =
  "http://localhost:8080/education/api/exams/random";

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

interface Question {
  id: number;
  classId: number;
  chapter: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: "A" | "B" | "C" | "D";
  level: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
}

interface PaginatedResponse {
  content: Question[];
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

type QuestionLevel = "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";

export default function QuestionManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showRandomExamModal, setShowRandomExamModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptionA, setFormOptionA] = useState("");
  const [formOptionB, setFormOptionB] = useState("");
  const [formOptionC, setFormOptionC] = useState("");
  const [formOptionD, setFormOptionD] = useState("");
  const [formAnswer, setFormAnswer] = useState<"A" | "B" | "C" | "D">("A");
  const [formLevel, setFormLevel] = useState<QuestionLevel>("EASY");
  const [formChapter, setFormChapter] = useState(1);

  // Exam form states
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examStartTime, setExamStartTime] = useState("");
  const [examEndTime, setExamEndTime] = useState("");
  const [randomEasy, setRandomEasy] = useState(0);
  const [randomMedium, setRandomMedium] = useState(0);
  const [randomHard, setRandomHard] = useState(0);
  const [randomVeryHard, setRandomVeryHard] = useState(0);

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

  const fetchQuestions = useCallback(
    async (token: string, id: string, page: number, size: number) => {
      try {
        const response = await fetch(QUESTIONS_API(id, page, size), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<PaginatedResponse> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải danh sách câu hỏi. Vui lòng thử lại."
          );
        }

        setQuestions(data.result.content || []);
        setTotalPages(data.result.totalPages || 0);
        setTotalElements(data.result.totalElements || 0);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách câu hỏi. Vui lòng thử lại sau."
        );
        setQuestions([]);
      }
    },
    []
  );

  const fetchQuestionDetail = useCallback(
    async (token: string, questionId: number) => {
      try {
        const response = await fetch(QUESTION_DETAIL_API(questionId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Question> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải chi tiết câu hỏi. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch question detail:", err);
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
        fetchQuestions(authToken, classId, currentPage, pageSize),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, currentPage, pageSize, fetchClassDetail, fetchQuestions]);

  const handleCreateQuestion = async () => {
    if (!authToken) return;
    if (
      !formQuestion.trim() ||
      !formOptionA.trim() ||
      !formOptionB.trim() ||
      !formOptionC.trim() ||
      !formOptionD.trim()
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(CREATE_QUESTION_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          question: formQuestion.trim(),
          optionA: formOptionA.trim(),
          optionB: formOptionB.trim(),
          optionC: formOptionC.trim(),
          optionD: formOptionD.trim(),
          answer: formAnswer,
          level: formLevel,
          chapter: formChapter,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể tạo câu hỏi.");
      }

      await fetchQuestions(authToken, classId, currentPage, pageSize);
      setShowAddModal(false);
      resetForm();
      alert("Tạo câu hỏi thành công!");
    } catch (err) {
      console.error("Failed to create question:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tạo câu hỏi. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!authToken || !selectedQuestion) return;
    if (
      !formQuestion.trim() ||
      !formOptionA.trim() ||
      !formOptionB.trim() ||
      !formOptionC.trim() ||
      !formOptionD.trim()
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(UPDATE_QUESTION_API(selectedQuestion.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          question: formQuestion.trim(),
          optionA: formOptionA.trim(),
          optionB: formOptionB.trim(),
          optionC: formOptionC.trim(),
          optionD: formOptionD.trim(),
          answer: formAnswer,
          level: formLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể cập nhật câu hỏi.");
      }

      await fetchQuestions(authToken, classId, currentPage, pageSize);
      setShowEditModal(false);
      setSelectedQuestion(null);
      resetForm();
      alert("Cập nhật câu hỏi thành công!");
    } catch (err) {
      console.error("Failed to update question:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật câu hỏi. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      return;
    }

    setDeletingId(questionId);
    try {
      const response = await fetch(DELETE_QUESTION_API(questionId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa câu hỏi.");
      }

      await fetchQuestions(authToken, classId, currentPage, pageSize);
      alert("Xóa câu hỏi thành công!");
    } catch (err) {
      console.error("Failed to delete question:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa câu hỏi. Vui lòng thử lại."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetail = async (question: Question) => {
    if (!authToken) return;
    try {
      const detail = await fetchQuestionDetail(authToken, question.id);
      setSelectedQuestion(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert("Không thể tải chi tiết câu hỏi. Vui lòng thử lại.");
    }
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setFormQuestion(question.question);
    setFormOptionA(question.optionA);
    setFormOptionB(question.optionB);
    setFormOptionC(question.optionC);
    setFormOptionD(question.optionD);
    setFormAnswer(question.answer);
    setFormLevel(question.level);
    setFormChapter(question.chapter);
    setShowEditModal(true);
  };

  const handleCreateExamFromSelected = async () => {
    if (!authToken) return;
    if (selectedQuestions.size === 0) {
      alert("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }
    if (!examTitle.trim() || !examStartTime || !examEndTime) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(CREATE_EXAM_FROM_QUESTIONS_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          title: examTitle.trim(),
          questionIds: Array.from(selectedQuestions),
          description: examDescription.trim() || "",
          startTime: new Date(examStartTime).toISOString(),
          endTime: new Date(examEndTime).toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể tạo đề thi.");
      }

      setShowCreateExamModal(false);
      setSelectedQuestions(new Set());
      resetExamForm();
      alert("Tạo đề thi thành công!");
    } catch (err) {
      console.error("Failed to create exam:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tạo đề thi. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRandomExam = async () => {
    if (!authToken) return;
    if (
      randomEasy + randomMedium + randomHard + randomVeryHard === 0
    ) {
      alert("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }
    if (!examTitle.trim() || !examStartTime || !examEndTime) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(CREATE_RANDOM_EXAM_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          title: examTitle.trim(),
          numberOfEasyQuestions: randomEasy.toString(),
          numberOfMediumQuestions: randomMedium.toString(),
          numberOfHardQuestions: randomHard.toString(),
          numberOfVeryHardQuestions: randomVeryHard.toString(),
          description: examDescription.trim() || "",
          startTime: new Date(examStartTime).toISOString(),
          endTime: new Date(examEndTime).toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể tạo đề thi ngẫu nhiên.");
      }

      setShowRandomExamModal(false);
      resetExamForm();
      alert("Tạo đề thi ngẫu nhiên thành công!");
    } catch (err) {
      console.error("Failed to create random exam:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tạo đề thi ngẫu nhiên. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormQuestion("");
    setFormOptionA("");
    setFormOptionB("");
    setFormOptionC("");
    setFormOptionD("");
    setFormAnswer("A");
    setFormLevel("EASY");
    setFormChapter(1);
  };

  const resetExamForm = () => {
    setExamTitle("");
    setExamDescription("");
    setExamStartTime("");
    setExamEndTime("");
    setRandomEasy(0);
    setRandomMedium(0);
    setRandomHard(0);
    setRandomVeryHard(0);
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map((q) => q.id)));
    }
  };

  const getLevelInfo = (level: QuestionLevel) => {
    switch (level) {
      case "EASY":
        return {
          label: "Dễ",
          color: "bg-green-100 text-green-800 border-green-300",
        };
      case "MEDIUM":
        return {
          label: "Trung bình",
          color: "bg-blue-100 text-blue-800 border-blue-300",
        };
      case "HARD":
        return {
          label: "Khó",
          color: "bg-orange-100 text-orange-800 border-orange-300",
        };
      case "VERY_HARD":
        return {
          label: "Rất khó",
          color: "bg-red-100 text-red-800 border-red-300",
        };
      default:
        return {
          label: level,
          color: "bg-slate-100 text-slate-800 border-slate-300",
        };
    }
  };

  const getAnswerLabel = (answer: "A" | "B" | "C" | "D") => {
    switch (answer) {
      case "A":
        return "A";
      case "B":
        return "B";
      case "C":
        return "C";
      case "D":
        return "D";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
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
            <span className="text-slate-900 font-semibold">Ngân hàng câu hỏi</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Ngân hàng câu hỏi
              </h1>
              <p className="text-slate-600">
                Quản lý và tạo đề thi từ ngân hàng câu hỏi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (selectedQuestions.size === 0) {
                    alert("Vui lòng chọn ít nhất một câu hỏi");
                    return;
                  }
                  resetExamForm();
                  setShowCreateExamModal(true);
                }}
                disabled={selectedQuestions.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <CheckSquare className="w-5 h-5" />
                Tạo đề thi ({selectedQuestions.size})
              </button>
              <button
                onClick={() => {
                  resetExamForm();
                  setShowRandomExamModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Tạo đề ngẫu nhiên
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Thêm câu hỏi
              </button>
            </div>
          </motion.div>

          {/* Stats and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                Tổng cộng: <span className="font-bold text-violet-600">{totalElements}</span> câu hỏi
              </span>
              <span className="text-sm font-medium text-slate-700">
                Đã chọn: <span className="font-bold text-pink-600">{selectedQuestions.size}</span> câu hỏi
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Số câu hỏi/trang:
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={pageSize}
                onChange={(e) => {
                  const size = parseInt(e.target.value) || 10;
                  setPageSize(Math.max(5, Math.min(50, size)));
                  setCurrentPage(0);
                }}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Questions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {questions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-12 text-center"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Chưa có câu hỏi nào</p>
                </motion.div>
              ) : (
                questions.map((question, index) => {
                  const levelInfo = getLevelInfo(question.level);
                  const isSelected = selectedQuestions.has(question.id);
                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className={`relative group rounded-2xl bg-white p-6 shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                        isSelected
                          ? "border-violet-500 bg-violet-50"
                          : "border-slate-200 hover:border-violet-300"
                      }`}
                    >
                      {/* Gradient Background */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400" />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start gap-4 mb-4">
                          <button
                            onClick={() => toggleQuestionSelection(question.id)}
                            className={`mt-1 p-1 rounded transition-colors ${
                              isSelected
                                ? "text-violet-600"
                                : "text-slate-400 hover:text-violet-600"
                            }`}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-base font-bold text-slate-900 line-clamp-2 flex-1">
                                {question.question}
                              </h3>
                              <span
                                className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${levelInfo.color}`}
                              >
                                {levelInfo.label}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-slate-600 min-w-[20px]">
                                  A.
                                </span>
                                <span
                                  className={`${
                                    question.answer === "A"
                                      ? "font-bold text-green-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {question.optionA}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-slate-600 min-w-[20px]">
                                  B.
                                </span>
                                <span
                                  className={`${
                                    question.answer === "B"
                                      ? "font-bold text-green-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {question.optionB}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-slate-600 min-w-[20px]">
                                  C.
                                </span>
                                <span
                                  className={`${
                                    question.answer === "C"
                                      ? "font-bold text-green-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {question.optionC}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-semibold text-slate-600 min-w-[20px]">
                                  D.
                                </span>
                                <span
                                  className={`${
                                    question.answer === "D"
                                      ? "font-bold text-green-600"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {question.optionD}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Chương {question.chapter}</span>
                            <span>•</span>
                            <span>ID: {question.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(question);
                              }}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(question);
                              }}
                              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(question.id);
                              }}
                              disabled={deletingId === question.id}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa"
                            >
                              {deletingId === question.id ? (
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

          {/* Pagination */}
          {totalPages > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p className="text-sm text-slate-600">
                Trang {currentPage + 1} / {totalPages} ({totalElements} câu hỏi)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Đầu
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-violet-600 text-white border-violet-600"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cuối
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </div>

      <Footer />

      {/* Add/Edit Question Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
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
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  {showEditModal ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Câu hỏi *
                    </label>
                    <textarea
                      value={formQuestion}
                      onChange={(e) => setFormQuestion(e.target.value)}
                      placeholder="Nhập nội dung câu hỏi"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Mức độ *
                      </label>
                      <select
                        value={formLevel}
                        onChange={(e) =>
                          setFormLevel(e.target.value as QuestionLevel)
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                        <option value="VERY_HARD">Rất khó</option>
                      </select>
                    </div>
                    {showAddModal && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Chương
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formChapter}
                          onChange={(e) =>
                            setFormChapter(parseInt(e.target.value) || 1)
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đáp án A *
                    </label>
                    <input
                      type="text"
                      value={formOptionA}
                      onChange={(e) => setFormOptionA(e.target.value)}
                      placeholder="Nhập đáp án A"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đáp án B *
                    </label>
                    <input
                      type="text"
                      value={formOptionB}
                      onChange={(e) => setFormOptionB(e.target.value)}
                      placeholder="Nhập đáp án B"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đáp án C *
                    </label>
                    <input
                      type="text"
                      value={formOptionC}
                      onChange={(e) => setFormOptionC(e.target.value)}
                      placeholder="Nhập đáp án C"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đáp án D *
                    </label>
                    <input
                      type="text"
                      value={formOptionD}
                      onChange={(e) => setFormOptionD(e.target.value)}
                      placeholder="Nhập đáp án D"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Đáp án đúng *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["A", "B", "C", "D"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormAnswer(option)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            formAnswer === option
                              ? "bg-violet-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={
                    showEditModal ? handleUpdateQuestion : handleCreateQuestion
                  }
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting
                    ? "Đang lưu..."
                    : showEditModal
                    ? "Cập nhật"
                    : "Tạo mới"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowDetailModal(false);
              setSelectedQuestion(null);
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
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedQuestion(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Chi tiết câu hỏi
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getLevelInfo(selectedQuestion.level).color}`}
                    >
                      {getLevelInfo(selectedQuestion.level).label}
                    </span>
                    <span className="text-sm text-slate-600">
                      Chương {selectedQuestion.chapter}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Câu hỏi
                    </h3>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed">
                        {selectedQuestion.question}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Các đáp án
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "A", value: selectedQuestion.optionA },
                        { label: "B", value: selectedQuestion.optionB },
                        { label: "C", value: selectedQuestion.optionC },
                        { label: "D", value: selectedQuestion.optionD },
                      ].map((option) => (
                        <div
                          key={option.label}
                          className={`rounded-xl p-4 border-2 ${
                            selectedQuestion.answer === option.label
                              ? "bg-green-50 border-green-300"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`font-bold ${
                                selectedQuestion.answer === option.label
                                  ? "text-green-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {option.label}.
                            </span>
                            <span
                              className={`${
                                selectedQuestion.answer === option.label
                                  ? "font-semibold text-green-700"
                                  : "text-slate-700"
                              }`}
                            >
                              {option.value}
                            </span>
                            {selectedQuestion.answer === option.label && (
                              <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded">
                                Đúng
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Exam from Selected Questions Modal */}
      <AnimatePresence>
        {showCreateExamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowCreateExamModal(false);
              resetExamForm();
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
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <button
                  onClick={() => {
                    setShowCreateExamModal(false);
                    resetExamForm();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  Tạo đề thi từ câu hỏi đã chọn
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Đã chọn {selectedQuestions.size} câu hỏi
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tiêu đề đề thi *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="Nhập tiêu đề đề thi"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="Nhập mô tả đề thi"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        value={examStartTime}
                        onChange={(e) => setExamStartTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        value={examEndTime}
                        onChange={(e) => setExamEndTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateExamModal(false);
                    resetExamForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateExamFromSelected}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Đang tạo..." : "Tạo đề thi"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Random Exam Modal */}
      <AnimatePresence>
        {showRandomExamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowRandomExamModal(false);
              resetExamForm();
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
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <button
                  onClick={() => {
                    setShowRandomExamModal(false);
                    resetExamForm();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  Tạo đề thi ngẫu nhiên
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Hệ thống sẽ tự động chọn câu hỏi ngẫu nhiên
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tiêu đề đề thi *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="Nhập tiêu đề đề thi"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="Nhập mô tả đề thi"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        value={examStartTime}
                        onChange={(e) => setExamStartTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Thời gian kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        value={examEndTime}
                        onChange={(e) => setExamEndTime(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-4">
                      Số lượng câu hỏi theo mức độ
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-green-50 p-4 border border-green-200">
                        <label className="block text-sm font-medium text-green-700 mb-2">
                          Câu hỏi Dễ
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={randomEasy}
                          onChange={(e) =>
                            setRandomEasy(parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Câu hỏi Trung bình
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={randomMedium}
                          onChange={(e) =>
                            setRandomMedium(parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="rounded-xl bg-orange-50 p-4 border border-orange-200">
                        <label className="block text-sm font-medium text-orange-700 mb-2">
                          Câu hỏi Khó
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={randomHard}
                          onChange={(e) =>
                            setRandomHard(parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                        <label className="block text-sm font-medium text-red-700 mb-2">
                          Câu hỏi Rất khó
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={randomVeryHard}
                          onChange={(e) =>
                            setRandomVeryHard(parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Tổng:{" "}
                      <span className="font-bold text-violet-600">
                        {randomEasy + randomMedium + randomHard + randomVeryHard}
                      </span>{" "}
                      câu hỏi
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowRandomExamModal(false);
                    resetExamForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateRandomExam}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Đang tạo..." : "Tạo đề thi ngẫu nhiên"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

