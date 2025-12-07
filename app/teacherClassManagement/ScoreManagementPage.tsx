"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  Star,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const SCORES_SUMMARY_API = (classId: string | number) =>
  `${BASE_HTTP}/api/scores/summary?classId=${classId}`;

const SCORES_BY_EXAM_API = (classId: string | number, examId: number) =>
  `${BASE_HTTP}/api/scores/classes?classId=${classId}&examId=${examId}`;

const EXPORT_SCORES_API = (classId: string | number) =>
  `${BASE_HTTP}/api/scores/classes/${classId}/scores/export`;

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
  examId: number;
  name: string;
}

interface StudentScore {
  studentId: number;
  fullName: string;
  dob: string;
  scores: { [examId: string]: number };
  averageScore: number;
}

interface ScoreSummary {
  classId: number;
  exams: Exam[];
  students: StudentScore[];
}

interface ScoreByExam {
  studentId: number;
  studentName: string;
  classId: number;
  score: number;
  examId: number;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

export default function ScoreManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [scoresByExam, setScoresByExam] = useState<ScoreByExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [loadingScoresByExam, setLoadingScoresByExam] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "byExam">("summary");

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

  const fetchScoreSummary = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(SCORES_SUMMARY_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ScoreSummary> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải bảng điểm. Vui lòng thử lại."
          );
        }

        setScoreSummary(data.result);
      } catch (err) {
        console.error("Failed to fetch score summary:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải bảng điểm. Vui lòng thử lại sau."
        );
        setScoreSummary(null);
      }
    },
    []
  );

  const fetchScoresByExam = useCallback(
    async (token: string, id: string, examId: number) => {
      setLoadingScoresByExam(true);
      try {
        const response = await fetch(SCORES_BY_EXAM_API(id, examId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<ScoreByExam[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải điểm theo kỳ thi. Vui lòng thử lại."
          );
        }

        setScoresByExam(data.result || []);
      } catch (err) {
        console.error("Failed to fetch scores by exam:", err);
        alert(
          err instanceof Error
            ? err.message
            : "Không thể tải điểm theo kỳ thi. Vui lòng thử lại."
        );
        setScoresByExam([]);
      } finally {
        setLoadingScoresByExam(false);
      }
    },
    []
  );

  const handleExportExcel = async () => {
    if (!authToken) return;
    setExporting(true);
    try {
      const response = await fetch(EXPORT_SCORES_API(classId), {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể xuất file Excel.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BangDiem_${classData?.name || classId}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert("Xuất file Excel thành công!");
    } catch (err) {
      console.error("Failed to export Excel:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xuất file Excel. Vui lòng thử lại."
      );
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchScoreSummary(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchScoreSummary]);

  useEffect(() => {
    if (selectedExamId && authToken && viewMode === "byExam") {
      fetchScoresByExam(authToken, classId, selectedExamId);
    }
  }, [selectedExamId, viewMode, authToken, classId, fetchScoresByExam]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 font-bold";
    if (score >= 6.5) return "text-blue-600 font-semibold";
    if (score >= 5) return "text-orange-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-50 border-green-200";
    if (score >= 6.5) return "bg-blue-50 border-blue-200";
    if (score >= 5) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-yellow-50 to-amber-50">
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
            <span className="text-slate-900 font-semibold">Quản lý điểm</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">
                    Quản lý điểm số
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Xem và quản lý điểm số của học sinh trong lớp học
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportExcel}
                disabled={exporting || !scoreSummary}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {exporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
                {exporting ? "Đang xuất..." : "Xuất Excel"}
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          {scoreSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tổng số học sinh</p>
                    <p className="text-xl font-bold text-slate-900">
                      {scoreSummary.students.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Tổng số kỳ thi</p>
                    <p className="text-xl font-bold text-slate-900">
                      {scoreSummary.exams.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Điểm TB cao nhất</p>
                    <p className="text-xl font-bold text-green-600">
                      {scoreSummary.students.length > 0
                        ? Math.max(
                            ...scoreSummary.students.map((s) => s.averageScore)
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Star className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Điểm TB trung bình</p>
                    <p className="text-xl font-bold text-orange-600">
                      {scoreSummary.students.length > 0
                        ? (
                            scoreSummary.students.reduce(
                              (sum, s) => sum + s.averageScore,
                              0
                            ) / scoreSummary.students.length
                          ).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* View Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-6 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => {
                  setViewMode("summary");
                  setSelectedExamId(null);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === "summary"
                    ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tổng hợp
              </button>
              <button
                onClick={() => {
                  setViewMode("byExam");
                  if (scoreSummary && scoreSummary.exams.length > 0) {
                    setSelectedExamId(scoreSummary.exams[0].examId);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  viewMode === "byExam"
                    ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Theo kỳ thi
              </button>
            </div>
            {viewMode === "byExam" && scoreSummary && (
              <select
                value={selectedExamId || ""}
                onChange={(e) => setSelectedExamId(Number(e.target.value))}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-medium"
              >
                <option value="">Chọn kỳ thi...</option>
                {scoreSummary.exams.map((exam) => (
                  <option key={exam.examId} value={exam.examId}>
                    {exam.name}
                  </option>
                ))}
              </select>
            )}
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Summary Table */}
          {viewMode === "summary" && scoreSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-gradient-to-r from-yellow-500 to-amber-600 z-10">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left font-semibold sticky left-12 bg-gradient-to-r from-yellow-500 to-amber-600 z-10 min-w-[200px]">
                        Họ và tên
                      </th>
                      <th className="px-4 py-3 text-left font-semibold sticky left-[200px] bg-gradient-to-r from-yellow-500 to-amber-600 z-10 min-w-[120px]">
                        Ngày sinh
                      </th>
                      {scoreSummary.exams.map((exam) => (
                        <th
                          key={exam.examId}
                          className="px-4 py-3 text-center font-semibold min-w-[120px]"
                        >
                          {exam.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-semibold bg-gradient-to-r from-yellow-600 to-amber-700 min-w-[120px]">
                        Điểm TB
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreSummary.students.map((student, index) => (
                      <motion.tr
                        key={student.studentId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-600 sticky left-0 bg-white z-10">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 sticky left-12 bg-white z-10">
                          {student.fullName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 sticky left-[200px] bg-white z-10">
                          {formatDate(student.dob)}
                        </td>
                        {scoreSummary.exams.map((exam) => {
                          const score = student.scores[exam.examId.toString()];
                          return (
                            <td
                              key={exam.examId}
                              className={`px-4 py-3 text-center ${
                                score !== undefined
                                  ? getScoreColor(score)
                                  : "text-slate-400"
                              }`}
                            >
                              {score !== undefined ? score.toFixed(2) : "-"}
                            </td>
                          );
                        })}
                        <td
                          className={`px-4 py-3 text-center font-bold ${
                            student.averageScore > 0
                              ? getScoreColor(student.averageScore)
                              : "text-slate-400"
                          }`}
                        >
                          {student.averageScore > 0
                            ? student.averageScore.toFixed(2)
                            : "-"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Scores By Exam Table */}
          {viewMode === "byExam" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              {loadingScoresByExam ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
                </div>
              ) : !selectedExamId ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Vui lòng chọn kỳ thi để xem điểm</p>
                </div>
              ) : scoresByExam.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Chưa có điểm số cho kỳ thi này</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">STT</th>
                        <th className="px-4 py-3 text-left font-semibold min-w-[200px]">
                          Họ và tên
                        </th>
                        <th className="px-4 py-3 text-center font-semibold min-w-[150px]">
                          Điểm số
                        </th>
                        <th className="px-4 py-3 text-center font-semibold min-w-[150px]">
                          Xếp loại
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoresByExam
                        .sort((a, b) => b.score - a.score)
                        .map((score, index) => (
                          <motion.tr
                            key={score.studentId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-slate-600">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {score.studentName}
                            </td>
                            <td
                              className={`px-4 py-3 text-center font-bold text-lg ${getScoreColor(
                                score.score
                              )}`}
                            >
                              {score.score.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getScoreBgColor(
                                  score.score
                                )} ${getScoreColor(score.score)}`}
                              >
                                {score.score >= 8
                                  ? "Giỏi"
                                  : score.score >= 6.5
                                  ? "Khá"
                                  : score.score >= 5
                                  ? "Trung bình"
                                  : "Yếu"}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

