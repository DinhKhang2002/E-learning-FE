"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  Award,
  FileText,
  Download,
  Eye,
  X,
  Star,
  MessageSquare,
  User,
  Calendar,
  File,
  CheckCircle2,
  Send,
  Search,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const SUBMISSIONS_API = (assignmentId: string | number) =>
  `${BASE_HTTP}/api/submissions/assignment/${assignmentId}`;

const SUBMISSION_DETAIL_API = (submissionId: string | number) =>
  `${BASE_HTTP}/api/submissions/${submissionId}`;

const GRADE_SUBMISSION_API = (submissionId: string | number) =>
  `${BASE_HTTP}/api/submissions/${submissionId}/grade`;

const FILE_DOWNLOAD_BASE = `${BASE_HTTP}/api/files`;

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

function getGradeColor(grade: number | null): string {
  if (grade === null) return "text-slate-500";
  if (grade >= 9) return "text-emerald-600";
  if (grade >= 8) return "text-blue-600";
  if (grade >= 7) return "text-cyan-600";
  if (grade >= 6) return "text-amber-600";
  if (grade >= 5) return "text-orange-600";
  return "text-red-600";
}

function getGradeBadgeColor(grade: number | null): string {
  if (grade === null) return "bg-slate-100 text-slate-700 border-slate-300";
  if (grade >= 9) return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (grade >= 8) return "bg-blue-100 text-blue-700 border-blue-300";
  if (grade >= 7) return "bg-cyan-100 text-cyan-700 border-cyan-300";
  if (grade >= 6) return "bg-amber-100 text-amber-700 border-amber-300";
  if (grade >= 5) return "bg-orange-100 text-orange-700 border-orange-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default function GradeStudentSubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // Grade form state
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchSubmissions = useCallback(
    async (token: string, aId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(SUBMISSIONS_API(aId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Submission[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách bài nộp. Vui lòng thử lại."
          );
        }

        setSubmissions(data.result || []);
      } catch (err) {
        console.error("Failed to fetch submissions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách bài nộp. Vui lòng thử lại sau."
        );
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchSubmissionDetail = useCallback(
    async (token: string, submissionId: number) => {
      try {
        const response = await fetch(SUBMISSION_DETAIL_API(submissionId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Submission> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải chi tiết bài nộp. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch submission detail:", err);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && assignmentId) {
      fetchSubmissions(authToken, assignmentId);
    }
  }, [authToken, assignmentId, fetchSubmissions]);

  const handleViewDetail = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowGradeModal(false);
    if (authToken) {
      try {
        const detail = await fetchSubmissionDetail(authToken, submission.id);
        setSelectedSubmission(detail);
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      }
    }
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
    setShowGradeModal(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission || !authToken || !grade.trim()) {
      alert("Vui lòng nhập điểm số");
      return;
    }

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
      alert("Điểm số phải từ 0 đến 10");
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch(GRADE_SUBMISSION_API(selectedSubmission.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: gradeValue.toString(),
          feedback: feedback.trim() || "",
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể chấm điểm. Vui lòng thử lại."
        );
      }

      // Refresh submissions
      if (assignmentId) {
        await fetchSubmissions(authToken, assignmentId);
      }

      setShowGradeModal(false);
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
      alert("Chấm điểm thành công!");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể chấm điểm. Vui lòng thử lại sau."
      );
    } finally {
      setIsGrading(false);
    }
  };

  const handleDownloadFile = (downloadUrl: string, fileName: string) => {
    const fullUrl = downloadUrl.startsWith("http")
      ? downloadUrl
      : `${FILE_DOWNLOAD_BASE}${downloadUrl}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const filteredSubmissions = submissions.filter((submission) =>
    submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gradedCount = submissions.filter((s) => s.grade !== null).length;
  const ungradedCount = submissions.filter((s) => s.grade === null).length;

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải bài nộp...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-purple-100/80 via-pink-100/60 to-rose-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
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
              className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/classPage?id=${classId}`}
              className="text-slate-600 hover:text-purple-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/classPage/assignments?classId=${classId}`}
              className="text-slate-600 hover:text-purple-600 transition-colors font-medium"
            >
              Bài tập
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Chấm bài</span>
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
                  Chấm bài tập
                </h1>
                <p className="text-slate-600">
                  Xem và chấm điểm các bài nộp của học sinh
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm bài nộp..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition w-64"
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
          {submissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số bài nộp</p>
                    <p className="text-2xl font-bold text-slate-900">{submissions.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Đã chấm</p>
                    <p className="text-2xl font-bold text-emerald-600">{gradedCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Chưa chấm</p>
                    <p className="text-2xl font-bold text-amber-600">{ungradedCount}</p>
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
              <p className="text-red-600 font-semibold mb-2">Không thể tải bài nộp</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && assignmentId) {
                    fetchSubmissions(authToken, assignmentId);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </motion.div>
          )}

          {/* Submissions Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {filteredSubmissions.length === 0 ? (
                <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    {searchQuery ? "Không tìm thấy bài nộp nào" : "Chưa có bài nộp nào"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Bài nộp sẽ được hiển thị tại đây khi học sinh nộp bài"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSubmissions.map((submission, index) => {
                    const gradeColor = getGradeColor(submission.grade);
                    const gradeBadgeColor = getGradeBadgeColor(submission.grade);
                    return (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                {submission.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <User className="w-3 h-3" />
                                <span>Học sinh ID: {submission.studentId}</span>
                              </div>
                            </div>
                            {submission.grade !== null && (
                              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${submission.grade >= 8 ? "from-emerald-500 to-teal-500" : submission.grade >= 6 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500"} shadow-lg flex-shrink-0 ml-3`}>
                                <Star className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Content Preview */}
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {submission.content}
                          </p>

                          {/* Grade Display */}
                          {submission.grade !== null ? (
                            <div className={`p-4 rounded-xl border-2 ${gradeBadgeColor} mb-4`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                    Điểm số
                                  </p>
                                  <p className={`text-3xl font-bold ${gradeColor}`}>
                                    {submission.grade.toFixed(2)}
                                  </p>
                                </div>
                                {submission.feedback && (
                                  <div className="text-right">
                                    <MessageSquare className="w-5 h-5 text-slate-400 mb-1" />
                                  </div>
                                )}
                              </div>
                              {submission.feedback && (
                                <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                                  {submission.feedback}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 mb-4">
                              <p className="text-sm font-semibold text-amber-700">
                                Chưa chấm điểm
                              </p>
                            </div>
                          )}

                          {/* Info */}
                          <div className="space-y-2 mb-4 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>Nộp lúc: {formatDate(submission.submittedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <File className="w-3 h-3" />
                              <span>{submission.files.length} tệp đính kèm</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetail(submission)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                            >
                              <Eye className="w-4 h-4" />
                              Xem chi tiết
                            </button>
                            <button
                              onClick={() => handleGrade(submission)}
                              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                            >
                              <Award className="w-4 h-4" />
                              {submission.grade !== null ? "Sửa điểm" : "Chấm điểm"}
                            </button>
                          </div>
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

      {/* Submission Detail Modal */}
      <AnimatePresence>
        {selectedSubmission && !showGradeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedSubmission(null)}
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
                  <h2 className="text-2xl font-bold text-slate-900">Chi tiết bài nộp</h2>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {selectedSubmission && (
                  <div className="space-y-6">
                    {/* Title and Student Info */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {selectedSubmission.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Học sinh ID: {selectedSubmission.studentId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Nộp lúc: {formatDate(selectedSubmission.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Nội dung bài làm
                      </h4>
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedSubmission.content}
                        </p>
                      </div>
                    </div>

                    {/* Grade Display */}
                    {selectedSubmission.grade !== null && (
                      <div className={`p-6 rounded-xl border-2 ${getGradeBadgeColor(selectedSubmission.grade)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                              Điểm số
                            </p>
                            <p className={`text-4xl font-bold ${getGradeColor(selectedSubmission.grade)}`}>
                              {selectedSubmission.grade.toFixed(2)}
                            </p>
                          </div>
                          <Award className="w-12 h-12 text-slate-400 opacity-50" />
                        </div>
                        {selectedSubmission.feedback && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                              Nhận xét
                            </p>
                            <p className="text-slate-700">{selectedSubmission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Files */}
                    {selectedSubmission.files.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                          Tệp đính kèm
                        </h4>
                        <div className="space-y-2">
                          {selectedSubmission.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
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
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                title="Tải xuống"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setShowGradeModal(true);
                          setGrade(selectedSubmission.grade?.toString() || "");
                          setFeedback(selectedSubmission.feedback || "");
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Award className="w-5 h-5" />
                        {selectedSubmission.grade !== null ? "Sửa điểm" : "Chấm điểm"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Grade Modal */}
      <AnimatePresence>
        {showGradeModal && selectedSubmission && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => {
                setShowGradeModal(false);
                setSelectedSubmission(null);
                setGrade("");
                setFeedback("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedSubmission.grade !== null ? "Sửa điểm" : "Chấm điểm"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowGradeModal(false);
                      setSelectedSubmission(null);
                      setGrade("");
                      setFeedback("");
                    }}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Submission Info */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      {selectedSubmission.title}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Học sinh ID: {selectedSubmission.studentId} • Nộp lúc: {formatDate(selectedSubmission.submittedAt)}
                    </p>
                  </div>

                  {/* Grade Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Điểm số <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="Nhập điểm từ 0 đến 10"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Điểm số từ 0.0 đến 10.0
                    </p>
                  </div>

                  {/* Feedback Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nhận xét
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      placeholder="Nhập nhận xét cho học sinh..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        setShowGradeModal(false);
                        setSelectedSubmission(null);
                        setGrade("");
                        setFeedback("");
                      }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitGrade}
                      disabled={isGrading || !grade.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGrading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {selectedSubmission.grade !== null ? "Cập nhật điểm" : "Chấm điểm"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

