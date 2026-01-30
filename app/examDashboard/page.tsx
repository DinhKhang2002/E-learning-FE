"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Loader2,
  Users,
  Award,
  Clock,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const SCORE_DISTRIBUTION_API = (examId: string | number) =>
  `${BASE_HTTP}/api/dashboard/score-distribution/exam/${examId}`;
const QUESTION_ANALYSIS_API = (examId: string | number) =>
  `${BASE_HTTP}/api/dashboard/question-analysis/exam/${examId}`;

interface ScoreDistributionItem {
  examId: number;
  examTitle: string;
  className: string;
  score: number;
  scoreRange: string;
  startedAt: string;
  completedAt: string;
  timeSpentMinutes: number;
}

interface QuestionAnalysisItem {
  examId: number;
  examTitle: string;
  questionId: number;
  questionContent: string;
  correctAnswer: string;
  difficultyLevel: string;
  totalResponses: number;
  totalCorrect: number;
  totalIncorrect: number;
  errorRate: number;
  mostCommonWrongAnswer: string | null;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

const SCORE_RANGE_ORDER = ["0-1", "1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"];
const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "#22c55e",
  MEDIUM: "#f59e0b",
  HARD: "#ef4444",
};

export default function ExamDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  const classId = searchParams.get("classId");

  const [scoreData, setScoreData] = useState<ScoreDistributionItem[]>([]);
  const [questionData, setQuestionData] = useState<QuestionAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!examId) {
        setError("Không tìm thấy ID kỳ thi");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const headers = { Authorization: `Bearer ${token}` };
        const [scoreRes, questionRes] = await Promise.all([
          fetch(SCORE_DISTRIBUTION_API(examId), { headers }),
          fetch(QUESTION_ANALYSIS_API(examId), { headers }),
        ]);
        const scoreJson: ApiResponse<ScoreDistributionItem[]> = await scoreRes.json();
        const questionJson: ApiResponse<QuestionAnalysisItem[]> = await questionRes.json();
        if (scoreJson.code === 1000) setScoreData(scoreJson.result || []);
        if (questionJson.code === 1000) setQuestionData(questionJson.result || []);
        if (scoreJson.code !== 1000 && questionJson.code !== 1000) {
          throw new Error(scoreJson.message || questionJson.message);
        }
      } catch {
        setError("Lỗi tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId]);

  const summary = useMemo(() => {
    if (!scoreData.length) return null;
    const total = scoreData.length;
    const avgScore =
      total > 0 ? scoreData.reduce((a, b) => a + b.score, 0) / total : 0;
    const avgTime =
      total > 0
        ? scoreData.reduce((a, b) => a + b.timeSpentMinutes, 0) / total
        : 0;
    return {
      totalSubmissions: total,
      avgScore: avgScore.toFixed(2),
      avgTimeMinutes: Math.round(avgTime * 10) / 10,
      totalQuestions: questionData.length,
    };
  }, [scoreData, questionData]);

  const scoreRangeChartData = useMemo(() => {
    const byRange: Record<string, number> = {};
    SCORE_RANGE_ORDER.forEach((r) => (byRange[r] = 0));
    scoreData.forEach((item) => {
      if (byRange[item.scoreRange] !== undefined) byRange[item.scoreRange]++;
    });
    return Object.entries(byRange).map(([name, count]) => ({ name, count, fill: "#3b82f6" }));
  }, [scoreData]);

  const questionErrorChartData = useMemo(() => {
    return questionData.map((q, i) => ({
      name: `Câu ${i + 1}`,
      errorRate: q.errorRate,
      fullKey: q.questionId,
    }));
  }, [questionData]);

  const difficultyPieData = useMemo(() => {
    const byDiff: Record<string, number> = {};
    questionData.forEach((q) => {
      byDiff[q.difficultyLevel] = (byDiff[q.difficultyLevel] || 0) + 1;
    });
    return Object.entries(byDiff).map(([name, value]) => ({
      name: name === "EASY" ? "Dễ" : name === "MEDIUM" ? "TB" : "Khó",
      value,
      fill: DIFFICULTY_COLORS[name] || "#94a3b8",
    }));
  }, [questionData]);

  const examTitle = scoreData[0]?.examTitle || questionData[0]?.examTitle || "Kỳ thi";
  const className = scoreData[0]?.className || "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-sky-600 mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thống kê...</p>
      </div>
    );
  }

  if (error || (!scoreData.length && !questionData.length)) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
          >
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {error || "Chưa có dữ liệu thống kê"}
            </h2>
            <button
              onClick={() => (classId ? router.push(`/classPage/exams?classId=${classId}`) : router.back())}
              className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <button
            onClick={() =>
              classId ? router.push(`/classPage/exams?classId=${classId}`) : router.back()
            }
            className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại quản lý đề thi
          </button>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Thống kê chi tiết kỳ thi
              </h1>
              <p className="text-slate-600 mt-1 font-medium line-clamp-1">
                {examTitle}
              </p>
              {className && (
                <p className="text-slate-500 text-sm mt-0.5">{className}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            {[
              {
                icon: Users,
                label: "Số bài nộp",
                value: summary.totalSubmissions,
                color: "from-sky-500 to-blue-600",
                bg: "bg-sky-50",
                iconColor: "text-sky-600",
              },
              {
                icon: Award,
                label: "Điểm trung bình",
                value: summary.avgScore,
                color: "from-emerald-500 to-teal-600",
                bg: "bg-emerald-50",
                iconColor: "text-emerald-600",
              },
              {
                icon: Clock,
                label: "Thời gian TB (phút)",
                value: summary.avgTimeMinutes,
                color: "from-amber-500 to-orange-600",
                bg: "bg-amber-50",
                iconColor: "text-amber-600",
              },
              {
                icon: HelpCircle,
                label: "Số câu hỏi",
                value: summary.totalQuestions,
                color: "from-violet-500 to-purple-600",
                bg: "bg-violet-50",
                iconColor: "text-violet-600",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.35 }}
                whileHover={{ y: -4 }}
                className={`${card.bg} rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  {card.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Score distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Phân bố điểm theo khoảng
                  </h3>
                  <p className="text-sm text-slate-500">
                    Số thí sinh theo từng khoảng điểm
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scoreRangeChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                    }}
                    formatter={(value: number | undefined) => [`${value ?? 0} thí sinh`, "Số lượng"]}
                    labelFormatter={(label) => `Khoảng ${label}`}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {scoreRangeChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? "#0ea5e9" : "#e2e8f0"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Difficulty pie */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Độ khó câu hỏi
                  </h3>
                  <p className="text-sm text-slate-500">
                    Phân bố theo mức độ
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 h-[320px] flex items-center justify-center">
              {difficultyPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent = 0 }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {difficultyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                      }}
                      formatter={(value: number | undefined) => [`${value ?? 0} câu`, "Số câu"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400">Chưa có dữ liệu độ khó</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Question error rate chart - full width */}
        {questionErrorChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-10"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Tỷ lệ sai theo từng câu
                  </h3>
                  <p className="text-sm text-slate-500">
                    Câu nào thí sinh sai nhiều nhất
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={questionErrorChartData}
                  margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={45}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                    }}
                    formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, "Tỷ lệ sai"]}
                  />
                  <Bar dataKey="errorRate" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {questionErrorChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.errorRate >= 50
                            ? "#ef4444"
                            : entry.errorRate >= 20
                              ? "#f59e0b"
                              : "#22c55e"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Question analysis table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Chi tiết từng câu hỏi
                </h3>
                <p className="text-sm text-slate-500">
                  Đáp án đúng, tỷ lệ sai, đáp án sai phổ biến
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nội dung câu hỏi
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Độ khó
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Đáp án đúng
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Đúng / Tổng
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tỷ lệ sai
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sai phổ biến
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {questionData.map((q, index) => (
                    <motion.tr
                      key={q.questionId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * index }}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-slate-600">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-800 max-w-xs line-clamp-2">
                        {q.questionContent}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor:
                              q.difficultyLevel === "EASY"
                                ? "#dcfce7"
                                : q.difficultyLevel === "MEDIUM"
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              q.difficultyLevel === "EASY"
                                ? "#166534"
                                : q.difficultyLevel === "MEDIUM"
                                  ? "#b45309"
                                  : "#b91c1c",
                          }}
                        >
                          {q.difficultyLevel === "EASY"
                            ? "Dễ"
                            : q.difficultyLevel === "MEDIUM"
                              ? "TB"
                              : "Khó"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> {q.correctAnswer}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {q.totalCorrect} / {q.totalResponses}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-semibold ${
                            q.errorRate >= 50
                              ? "text-red-600"
                              : q.errorRate >= 20
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {q.errorRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {q.mostCommonWrongAnswer ? (
                          <span className="text-sm text-slate-600 font-medium">
                            {q.mostCommonWrongAnswer}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
