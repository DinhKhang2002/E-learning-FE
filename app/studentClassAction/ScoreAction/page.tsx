"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  GraduationCap,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const SCORES_API = (classId: string | number, studentId: string | number) =>
  `${BASE_HTTP}/api/scores/exam-student?classId=${classId}&studentId=${studentId}`;

const EXAMS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/exams/class/${classId}/student`;

interface Score {
  studentId: number;
  studentName: string;
  classId: number;
  score: number;
  examId: number;
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

interface ScoreWithExam extends Score {
  examTitle?: string;
  examDescription?: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

function getScoreColor(score: number): string {
  if (score >= 9) {
    return "text-emerald-600";
  } else if (score >= 8) {
    return "text-blue-600";
  } else if (score >= 7) {
    return "text-cyan-600";
  } else if (score >= 6) {
    return "text-amber-600";
  } else if (score >= 5) {
    return "text-orange-600";
  } else {
    return "text-red-600";
  }
}

function getScoreBgColor(score: number): string {
  if (score >= 9) {
    return "bg-emerald-50 border-emerald-200";
  } else if (score >= 8) {
    return "bg-blue-50 border-blue-200";
  } else if (score >= 7) {
    return "bg-cyan-50 border-cyan-200";
  } else if (score >= 6) {
    return "bg-amber-50 border-amber-200";
  } else if (score >= 5) {
    return "bg-orange-50 border-orange-200";
  } else {
    return "bg-red-50 border-red-200";
  }
}

function getScoreBadgeColor(score: number): string {
  if (score >= 9) {
    return "bg-gradient-to-r from-emerald-500 to-teal-500";
  } else if (score >= 8) {
    return "bg-gradient-to-r from-blue-500 to-cyan-500";
  } else if (score >= 7) {
    return "bg-gradient-to-r from-cyan-500 to-blue-500";
  } else if (score >= 6) {
    return "bg-gradient-to-r from-amber-500 to-yellow-500";
  } else if (score >= 5) {
    return "bg-gradient-to-r from-orange-500 to-amber-500";
  } else {
    return "bg-gradient-to-r from-red-500 to-orange-500";
  }
}

function getScoreLabel(score: number): string {
  if (score >= 9) {
    return "Xuất sắc";
  } else if (score >= 8) {
    return "Giỏi";
  } else if (score >= 7) {
    return "Khá";
  } else if (score >= 6) {
    return "Trung bình khá";
  } else if (score >= 5) {
    return "Trung bình";
  } else {
    return "Yếu";
  }
}

export default function ScoreAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchScores = useCallback(
    async (token: string, cId: string, sId: number) => {
      try {
        const response = await fetch(SCORES_API(cId, sId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Score[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải điểm số. Vui lòng thử lại."
          );
        }

        setScores(data.result || []);
      } catch (err) {
        console.error("Failed to fetch scores:", err);
        throw err;
      }
    },
    []
  );

  const fetchExams = useCallback(
    async (token: string, cId: string) => {
      try {
        const response = await fetch(EXAMS_API(cId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Exam[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          return [];
        }

        return data.result || [];
      } catch (err) {
        console.error("Failed to fetch exams:", err);
        return [];
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId && studentId) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          await fetchScores(authToken, classId, studentId);
          const examsData = await fetchExams(authToken, classId);
          setExams(examsData);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải điểm số. Vui lòng thử lại sau."
          );
          setScores([]);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [authToken, classId, studentId, fetchScores, fetchExams]);

  // Combine scores with exam info
  const scoresWithExam: ScoreWithExam[] = useMemo(() => {
    return scores.map((score) => {
      const exam = exams.find((e) => e.id === score.examId);
      return {
        ...score,
        examTitle: exam?.title || `Kỳ thi #${score.examId}`,
        examDescription: exam?.description,
      };
    });
  }, [scores, exams]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (scores.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        total: 0,
      };
    }

    const scoreValues = scores.map((s) => s.score);
    const sum = scoreValues.reduce((a, b) => a + b, 0);
    const average = sum / scores.length;
    const highest = Math.max(...scoreValues);
    const lowest = Math.min(...scoreValues);

    return {
      average: average,
      highest: highest,
      lowest: lowest,
      total: scores.length,
    };
  }, [scores]);

  // Filter scores by search query
  const filteredScores = useMemo(() => {
    if (!searchQuery.trim()) return scoresWithExam;
    
    const query = searchQuery.toLowerCase();
    return scoresWithExam.filter(
      (score) =>
        score.examTitle?.toLowerCase().includes(query) ||
        score.examDescription?.toLowerCase().includes(query)
    );
  }, [scoresWithExam, searchQuery]);

  // Sort scores by examId (newest first)
  const sortedScores = useMemo(() => {
    return [...filteredScores].sort((a, b) => b.examId - a.examId);
  }, [filteredScores]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-yellow-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải điểm số...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-yellow-100/80 via-amber-100/60 to-orange-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
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
              className="flex items-center gap-2 text-slate-600 hover:text-yellow-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/studentClassPage?id=${classId}`}
              className="text-slate-600 hover:text-yellow-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Xem điểm</span>
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
                  Xem điểm
                </h1>
                <p className="text-slate-600">
                  Xem điểm số các kỳ thi và bài tập
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm kỳ thi..."
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition w-64"
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
          {scores.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Điểm trung bình</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.average.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Điểm cao nhất</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {stats.highest.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Điểm thấp nhất</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.lowest.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số kỳ thi</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
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
              <p className="text-red-600 font-semibold mb-2">Không thể tải điểm số</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId && studentId) {
                    const loadData = async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        await fetchScores(authToken, classId, studentId);
                        const examsData = await fetchExams(authToken, classId);
                        setExams(examsData);
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Không thể tải điểm số. Vui lòng thử lại sau."
                        );
                      } finally {
                        setLoading(false);
                      }
                    };
                    loadData();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </motion.div>
          )}

          {/* Scores List */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {sortedScores.length === 0 ? (
                <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center">
                  <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    {searchQuery ? "Không tìm thấy kỳ thi nào" : "Chưa có điểm số nào"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Điểm số sẽ được hiển thị tại đây sau khi bạn hoàn thành các kỳ thi"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedScores.map((score, index) => {
                    const scoreColor = getScoreColor(score.score);
                    const scoreBgColor = getScoreBgColor(score.score);
                    const scoreBadgeColor = getScoreBadgeColor(score.score);
                    const scoreLabel = getScoreLabel(score.score);
                    // Compare with previous exam (index - 1 since sorted newest first)
                    const isImproving = index > 0 && score.score > sortedScores[index - 1]?.score;

                    return (
                      <motion.div
                        key={`${score.examId}-${score.studentId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                {score.examTitle}
                              </h3>
                              {score.examDescription && (
                                <p className="text-sm text-slate-600 line-clamp-1">
                                  {score.examDescription}
                                </p>
                              )}
                            </div>
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-xl ${scoreBadgeColor} shadow-lg flex-shrink-0 ml-3`}
                            >
                              <Award className="w-6 h-6 text-white" />
                            </div>
                          </div>

                          {/* Score Display */}
                          <div className={`p-6 rounded-xl border-2 ${scoreBgColor} mb-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                  Điểm số
                                </p>
                                <p className={`text-4xl font-bold ${scoreColor}`}>
                                  {score.score.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${scoreBadgeColor} text-white`}>
                                  {scoreLabel}
                                </span>
                              </div>
                            </div>
                            {isImproving && (
                              <div className="flex items-center gap-2 text-xs text-emerald-600 mt-2">
                                <TrendingUp className="w-3 h-3" />
                                <span>Cải thiện so với kỳ trước</span>
                              </div>
                            )}
                          </div>

                          {/* Exam Info */}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Mã kỳ thi: #{score.examId}</span>
                            {index === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                <Trophy className="w-3 h-3" />
                                Mới nhất
                              </span>
                            )}
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

      <Footer />
    </main>
  );
}

