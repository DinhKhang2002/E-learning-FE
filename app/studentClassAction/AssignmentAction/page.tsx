"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  FileText,
  CalendarDays,
  Download,
  Eye,
  Upload,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  File,
  Send,
  Search,
  Award,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const ASSIGNMENTS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/assignments/${classId}/class`;

const ASSIGNMENT_DETAIL_API = (assignmentId: string | number) =>
  `${BASE_HTTP}/api/assignments/${assignmentId}`;

const SUBMISSIONS_API = (submissionId: string | number) =>
  `${BASE_HTTP}/api/submissions/${submissionId}`;

const SUBMISSIONS_BY_ASSIGNMENT_API = (assignmentId: string | number, studentId: string | number) =>
  `${BASE_HTTP}/api/submissions/assignment/${assignmentId}/student/${studentId}`;

const SUBMIT_ASSIGNMENT_API = `${BASE_HTTP}/api/submissions`;

const FILE_DOWNLOAD_BASE = `${BASE_HTTP}/api/files`;

interface AssignmentFile {
  fileName: string;
  fileType: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface Assignment {
  id: number;
  title: string;
  content: string;
  classId: number;
  files: AssignmentFile[];
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

interface SubmissionFile {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  downloadUrl: string;
  fileSize: number;
  uploadedAt: string;
}

interface Submission {
  id: number;
  title: string;
  content: string;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  assignmentId: number;
  studentId: number;
  files: SubmissionFile[];
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

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

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case "Đang diễn ra":
      return {
        label: "Đang diễn ra",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
        icon: Clock,
        bgGradient: "from-emerald-500 to-teal-500",
      };
    case "Đã hết hạn":
      return {
        label: "Đã hết hạn",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: AlertCircle,
        bgGradient: "from-red-500 to-rose-500",
      };
    default:
      return {
        label: status,
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: Clock,
        bgGradient: "from-slate-500 to-slate-600",
      };
  }
};

export default function AssignmentAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Submit form state
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  const [submitFiles, setSubmitFiles] = useState<File[]>([]);

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

  const fetchAssignments = useCallback(
    async (token: string, cId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(ASSIGNMENTS_API(cId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Assignment[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách bài tập. Vui lòng thử lại."
          );
        }

        setAssignments(data.result || []);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách bài tập. Vui lòng thử lại sau."
        );
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchAssignmentDetail = useCallback(
    async (token: string, assignmentId: number) => {
      try {
        const response = await fetch(ASSIGNMENT_DETAIL_API(assignmentId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Assignment> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải chi tiết bài tập. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch assignment detail:", err);
        throw err;
      }
    },
    []
  );

  const fetchSubmission = useCallback(
    async (token: string, assignmentId: number, sId: number) => {
      try {
        // Try to get submission by assignmentId and studentId
        const response = await fetch(SUBMISSIONS_BY_ASSIGNMENT_API(assignmentId, sId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Submission> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          return null;
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch submission:", err);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      fetchAssignments(authToken, classId);
    }
  }, [authToken, classId, fetchAssignments]);

  const handleViewAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmission(null);
    setShowSubmitForm(false);
    
    // Try to fetch submission if assignment is active
    if (assignment.status === "Đang diễn ra" && authToken && studentId) {
      const submissionData = await fetchSubmission(authToken, assignment.id, studentId);
      if (submissionData) {
        setSubmission(submissionData);
      }
    }
  };

  const handleDownloadFile = (downloadUrl: string, fileName: string) => {
    const fullUrl = downloadUrl.startsWith("http")
      ? downloadUrl
      : `${FILE_DOWNLOAD_BASE}${downloadUrl}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submitTitle.trim() || !submitContent.trim() || !studentId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("studentId", studentId.toString());
      formData.append("assignmentId", selectedAssignment.id.toString());
      formData.append("title", submitTitle.trim());
      formData.append("content", submitContent.trim());

      submitFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(SUBMIT_ASSIGNMENT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể nộp bài tập. Vui lòng thử lại."
        );
      }

      // Show success message
      setSuccessMessage("Nộp bài tập thành công! Bài làm của bạn đã được gửi.");

      // Try to fetch submission if response contains submissionId
      if (data.result && data.result.id && authToken) {
        setTimeout(async () => {
          try {
            const response = await fetch(SUBMISSIONS_API(data.result.id), {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            });
            const submissionData: ApiResponse<Submission> = await response.json();
            if (response.ok && submissionData.code === 1000 && submissionData.result) {
              setSubmission(submissionData.result);
            }
          } catch (err) {
            console.error("Failed to fetch submission after submit:", err);
            // Try alternative API
            if (selectedAssignment && studentId) {
              const altSubmission = await fetchSubmission(
                authToken,
                selectedAssignment.id,
                studentId
              );
              if (altSubmission) {
                setSubmission(altSubmission);
              }
            }
          }
        }, 500);
      } else if (selectedAssignment && studentId && authToken) {
        // Fallback: try to fetch by assignmentId and studentId
        setTimeout(async () => {
          const submissionData = await fetchSubmission(
            authToken,
            selectedAssignment.id,
            studentId
          );
          if (submissionData) {
            setSubmission(submissionData);
          }
        }, 500);
      }

      // Reset form
      setSubmitTitle("");
      setSubmitContent("");
      setSubmitFiles([]);

      // Close form after delay
      setTimeout(() => {
        setShowSubmitForm(false);
        // Refresh assignments
        if (authToken && classId) {
          fetchAssignments(authToken, classId);
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể nộp bài tập. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải bài tập...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-blue-100/80 via-cyan-100/60 to-sky-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
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
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/studentClassPage?id=${classId}`}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Bài tập được giao</span>
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
                  Bài tập được giao
                </h1>
                <p className="text-slate-600">
                  Xem và nộp bài tập về nhà
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài tập..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition w-64"
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
          {assignments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số bài tập</p>
                      <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Đang diễn ra</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {assignments.filter((a) => a.status === "Đang diễn ra").length}
                      </p>
                    </div>
                  </div>
                  {searchQuery && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Tìm thấy</span>
                      <span className="font-semibold text-blue-600">{filteredAssignments.length}</span>
                      <span>kết quả</span>
                    </div>
                  )}
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
              <p className="text-red-600 font-semibold mb-2">Không thể tải bài tập</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId) {
                    fetchAssignments(authToken, classId);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </motion.div>
          )}

          {/* Assignments Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {filteredAssignments.length === 0 ? (
                <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    {searchQuery ? "Không tìm thấy bài tập nào" : "Chưa có bài tập nào"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Bài tập sẽ được hiển thị tại đây khi giáo viên giao bài"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAssignments
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((assignment, index) => {
                      const statusInfo = getStatusInfo(assignment.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <motion.div
                          key={assignment.id}
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
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {assignment.title}
                            </h3>

                            {/* Content Preview */}
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                              {assignment.content}
                            </p>

                            {/* Info */}
                            <div className="space-y-2 mb-4 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-3 h-3" />
                                <span>Bắt đầu: {formatDate(assignment.startAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Hết hạn: {formatDate(assignment.endAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <File className="w-3 h-3" />
                                <span>{assignment.files.length} tệp đính kèm</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <button
                              onClick={() => handleViewAssignment(assignment)}
                              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                            >
                              <Eye className="w-4 h-4" />
                              Xem chi tiết
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

      {/* Assignment Detail Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setSelectedAssignment(null);
                setSubmission(null);
                setShowSubmitForm(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-4xl rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Chi tiết bài tập</h2>
                  <button
                    onClick={() => {
                      setSelectedAssignment(null);
                      setSubmission(null);
                      setShowSubmitForm(false);
                    }}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {selectedAssignment && (
                  <div className="space-y-6">
                    {/* Title and Status */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900">
                          {selectedAssignment.title}
                        </h3>
                        {(() => {
                          const statusInfo = getStatusInfo(selectedAssignment.status);
                          const StatusIcon = statusInfo.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-slate-600">{selectedAssignment.content}</p>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Bắt đầu
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(selectedAssignment.startAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Hết hạn
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(selectedAssignment.endAt)}
                        </p>
                      </div>
                    </div>

                    {/* Assignment Files */}
                    {selectedAssignment.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                          Tệp đính kèm bài tập
                        </h4>
                        <div className="space-y-2">
                          {selectedAssignment.files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {file.fileName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatFileSize(file.fileSize)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadFile(file.downloadUrl, file.fileName)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Tải xuống"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submission Section */}
                    {selectedAssignment.status === "Đang diễn ra" && (
                      <div className="pt-6 border-t border-slate-200">
                        {submission ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-bold text-slate-900">Bài làm đã nộp</h4>
                              {submission.grade !== null && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                                  <Award className="w-5 h-5 text-yellow-600" />
                                  <span className="text-sm font-bold text-yellow-700">
                                    Điểm: {submission.grade}/10
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl">
                              <p className="text-sm font-semibold text-slate-700 mb-2">
                                {submission.title}
                              </p>
                              <p className="text-sm text-slate-600 mb-3">{submission.content}</p>
                              <p className="text-xs text-slate-500">
                                Nộp lúc: {formatDateTime(submission.submittedAt)}
                              </p>
                            </div>

                            {submission.grade !== null && submission.feedback && (
                              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <Star className="w-5 h-5 text-emerald-600" />
                                  <span className="text-sm font-bold text-emerald-700">
                                    Đã được chấm điểm
                                  </span>
                                </div>
                                <div className="mb-3">
                                  <p className="text-2xl font-bold text-emerald-700 mb-1">
                                    {submission.grade}/10
                                  </p>
                                  <p className="text-sm text-emerald-600">
                                    {submission.feedback}
                                  </p>
                                </div>
                              </div>
                            )}

                            {submission.files.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-slate-700 mb-2">
                                  Tệp đã nộp
                                </h5>
                                <div className="space-y-2">
                                  {submission.files.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <File className="w-4 h-4 text-slate-400" />
                                        <p className="text-sm text-slate-700 truncate">
                                          {file.fileName}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDownloadFile(file.downloadUrl, file.fileName)
                                        }
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h4 className="text-lg font-bold text-slate-900 mb-4">
                              Nộp bài làm
                            </h4>
                            {!showSubmitForm ? (
                              <button
                                onClick={() => setShowSubmitForm(true)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                              >
                                <Upload className="w-5 h-5" />
                                Nộp bài làm
                              </button>
                            ) : (
                              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                {error && (
                                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                  </div>
                                )}

                                {successMessage && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                      <p className="text-emerald-700 text-sm font-medium">
                                        {successMessage}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tiêu đề bài làm <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={submitTitle}
                                    onChange={(e) => setSubmitTitle(e.target.value)}
                                    placeholder="Nhập tiêu đề bài làm..."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nội dung bài làm <span className="text-red-500">*</span>
                                  </label>
                                  <textarea
                                    value={submitContent}
                                    onChange={(e) => setSubmitContent(e.target.value)}
                                    rows={4}
                                    placeholder="Nhập nội dung bài làm của bạn..."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tệp đính kèm
                                  </label>
                                  <div className="space-y-2">
                                    <input
                                      type="file"
                                      multiple
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          setSubmitFiles(Array.from(e.target.files));
                                        }
                                      }}
                                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                                    />
                                    {submitFiles.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {submitFiles.map((file, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
                                          >
                                            <File className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs text-blue-700">
                                              {file.name}
                                            </span>
                                            <button
                                              onClick={() => {
                                                setSubmitFiles(
                                                  submitFiles.filter((_, i) => i !== idx)
                                                );
                                              }}
                                              className="p-0.5 hover:bg-blue-100 rounded"
                                            >
                                              <X className="w-3 h-3 text-blue-600" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                  <button
                                    onClick={() => {
                                      setShowSubmitForm(false);
                                      setSubmitTitle("");
                                      setSubmitContent("");
                                      setSubmitFiles([]);
                                      setError(null);
                                      setSuccessMessage(null);
                                    }}
                                    className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    onClick={handleSubmitAssignment}
                                    disabled={
                                      isSubmitting ||
                                      !submitTitle.trim() ||
                                      !submitContent.trim()
                                    }
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang nộp...
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        Nộp bài
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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

