"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Trophy,
  X,
  Play,
  Timer,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GET_SUBMISSION_API = (examId: string | number) =>
  `http://localhost:8080/education/api/exams/${examId}/get-submission`;

const EXAM_QUESTIONS_API = (examId: string | number, page: number, size: number) =>
  `http://localhost:8080/education/api/exams/${examId}/questions?page=${page}&size=${size}`;

const SUBMIT_ANSWER_API = (submissionId: string | number) =>
  `http://localhost:8080/education/api/exam-submissions/${submissionId}/answers`;

const SUBMIT_EXAM_API = (submissionId: string | number) =>
  `http://localhost:8080/education/api/exams/${submissionId}/submit`;

const GET_EXAM_RESULT_API = (submissionId: string | number) =>
  `http://localhost:8080/education/api/exams/submission/${submissionId}/result`;

interface Question {
  questionId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface QuestionsResponse {
  content: Question[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

interface AnswerState {
  [questionId: number]: string; // "A", "B", "C", or "D"
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getEncouragementMessage(score: number): string {
  if (score >= 9) {
    return "Xuất sắc! Bạn đã làm rất tốt! 🌟";
  } else if (score >= 8) {
    return "Tuyệt vời! Bạn đã thể hiện kiến thức rất tốt! 👏";
  } else if (score >= 7) {
    return "Tốt lắm! Bạn đã nắm vững kiến thức! 💪";
  } else if (score >= 6) {
    return "Khá tốt! Hãy tiếp tục cố gắng! 📚";
  } else if (score >= 5) {
    return "Đạt yêu cầu! Hãy ôn tập thêm để cải thiện! 📖";
  } else {
    return "Cố gắng hơn nữa! Hãy ôn tập kỹ hơn! 💪";
  }
}

export default function ExamOnlineAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  const classId = searchParams.get("classId");
  const endTimeParam = searchParams.get("endTime");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examEndTime, setExamEndTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
    } else {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchSubmissionId = useCallback(
    async (token: string, eId: string) => {
      try {
        const response = await fetch(GET_SUBMISSION_API(eId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<number | { id: number }> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể lấy thông tin bài thi. Vui lòng thử lại."
          );
        }

        // Handle both number and object response
        let submissionIdValue: number;
        if (typeof data.result === "number") {
          submissionIdValue = data.result;
        } else if (typeof data.result === "object" && data.result !== null && "id" in data.result) {
          submissionIdValue = (data.result as { id: number }).id;
        } else {
          throw new Error("Định dạng dữ liệu submission không hợp lệ.");
        }

        setSubmissionId(submissionIdValue);
        return submissionIdValue;
      } catch (err) {
        console.error("Failed to fetch submission ID:", err);
        throw err;
      }
    },
    []
  );

  const fetchQuestions = useCallback(
    async (token: string, eId: string, page: number) => {
      try {
        const response = await fetch(EXAM_QUESTIONS_API(eId, page, 100), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<QuestionsResponse> = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải câu hỏi. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        throw err;
      }
    },
    []
  );

  const fetchAllQuestions = useCallback(
    async (token: string, eId: string) => {
      try {
        const firstPage = await fetchQuestions(token, eId, 0);
        setTotalPages(firstPage.totalPages);
        setTotalQuestions(firstPage.totalElements);
        
        let allQuestions = [...firstPage.content];
        
        // Fetch remaining pages if any
        for (let page = 1; page < firstPage.totalPages; page++) {
          const pageData = await fetchQuestions(token, eId, page);
          allQuestions = [...allQuestions, ...pageData.content];
        }
        
        setQuestions(allQuestions);
        return allQuestions;
      } catch (err) {
        throw err;
      }
    },
    [fetchQuestions]
  );

  useEffect(() => {
    if (authToken && examId) {
      const initializeExam = async () => {
        setLoading(true);
        setError(null);
        try {
          const subId = await fetchSubmissionId(authToken, examId);
          await fetchAllQuestions(authToken, examId);
          
          // Calculate end time from exam endTime or use provided endTime
          let endTime: Date;
          if (endTimeParam) {
            endTime = new Date(decodeURIComponent(endTimeParam));
          } else {
            // Fallback: default 2 hours if no endTime provided
            endTime = new Date();
            endTime.setHours(endTime.getHours() + 2);
          }
          setExamEndTime(endTime);
          
          const remaining = Math.floor((endTime.getTime() - new Date().getTime()) / 1000);
          setTimeRemaining(Math.max(0, remaining));
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể khởi tạo bài thi. Vui lòng thử lại sau."
          );
        } finally {
          setLoading(false);
        }
      };

      initializeExam();
    }
  }, [authToken, examId, fetchSubmissionId, fetchAllQuestions]);

  const handleSubmitExam = async () => {
    if (!submissionId || !authToken) return;

    // Check for unanswered questions (only count submitted answers)
    const unansweredQuestions = questions.filter(
      (q) => !submittedAnswers.has(q.questionId)
    );

    if (unansweredQuestions.length > 0) {
      const confirmMessage = `Bạn còn ${unansweredQuestions.length} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      // Submit all remaining answers first (only submit if not already submitted)
      for (const question of questions) {
        if (answers[question.questionId] && !submittedAnswers.has(question.questionId) && submissionId) {
          try {
            const response = await fetch(SUBMIT_ANSWER_API(submissionId), {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                questionId: question.questionId.toString(),
                answerOption: answers[question.questionId],
              }),
            });

            const data = await response.json();
            if (response.ok && data.code === 1000) {
              // Mark as submitted on success
              setSubmittedAnswers((prev) => {
                const newSet = new Set(prev);
                newSet.add(question.questionId);
                return newSet;
              });
            }
          } catch (err) {
            console.error(`Failed to submit answer for question ${question.questionId}:`, err);
          }
        }
      }

      // Submit exam
      const response = await fetch(SUBMIT_EXAM_API(submissionId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể nộp bài thi. Vui lòng thử lại."
        );
      }

      // Get exam result
      if (submissionId) {
        const resultResponse = await fetch(GET_EXAM_RESULT_API(submissionId), {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        const resultData: ApiResponse<number> = await resultResponse.json();
        if (resultResponse.ok && resultData.code === 1000 && resultData.result !== undefined) {
          setExamScore(resultData.result);
          setShowResult(true);
          
          // Clear timer
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
        }
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể nộp bài thi. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (examEndTime && timeRemaining > 0 && !showResult && !isSubmitting) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.floor(
          (examEndTime.getTime() - new Date().getTime()) / 1000
        );
        if (remaining <= 0) {
          setTimeRemaining(0);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          // Auto submit when time runs out
          handleSubmitExam();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [examEndTime, timeRemaining, showResult, isSubmitting, submissionId, authToken, questions, answers]);

  const handleAnswerChange = (questionId: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitAnswer = async (questionId: number) => {
    if (!submissionId || !authToken || !answers[questionId]) {
      alert("Vui lòng chọn đáp án trước khi nộp.");
      return;
    }

    try {
      const response = await fetch(SUBMIT_ANSWER_API(submissionId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: questionId.toString(),
          answerOption: answers[questionId],
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể nộp đáp án. Vui lòng thử lại."
        );
      }

      // Only mark as submitted when API returns success
      setSubmittedAnswers((prev) => {
        const newSet = new Set(prev);
        newSet.add(questionId);
        return newSet;
      });

      // Show success feedback (optional)
      // You can add a toast notification here
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể nộp đáp án. Vui lòng thử lại sau."
      );
    }
  };

  const answeredQuestions = submittedAnswers.size;

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải bài thi...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error && !submissionId) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">Lỗi</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push(`/studentClassAction/ExamAction?classId=${classId}`)}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Quay lại
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Header with Submit Button */}
        <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="mx-auto w-full max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-slate-900">Thi trực tuyến</h1>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Đã trả lời: {answeredQuestions}/{totalQuestions}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={isSubmitting || showResult}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Nộp bài thi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Question Navigator */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Danh sách câu hỏi
                </h2>
                
                {/* Timer */}
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-5 h-5 text-red-600" />
                    <span className="text-xs font-semibold text-red-700 uppercase">
                      Thời gian còn lại
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-700 font-mono">
                    {formatTime(timeRemaining)}
                  </div>
                </div>

                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                  {questions.map((question, index) => {
                    const isSubmitted = submittedAnswers.has(question.questionId);
                    return (
                      <button
                        key={question.questionId}
                        onClick={() => {
                          const element = document.getElementById(`question-${question.questionId}`);
                          element?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                          isSubmitted
                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span>Đã trả lời</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                    <div className="w-4 h-4 rounded bg-slate-100"></div>
                    <span>Chưa trả lời</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Questions */}
            <div className="lg:col-span-3">
              {showResult && examScore !== null ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Hoàn thành bài thi!
                  </h2>
                  <div className="mb-6">
                    <p className="text-5xl font-bold text-emerald-600 mb-2">
                      {examScore.toFixed(2)} điểm
                    </p>
                    <p className="text-lg text-slate-600">
                      {getEncouragementMessage(examScore)}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/studentClassAction/ExamAction?classId=${classId}`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Quay lại danh sách kỳ thi
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <motion.div
                      key={question.questionId}
                      id={`question-${question.questionId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 flex-1">
                          {question.question}
                        </h3>
                      </div>

                      <div className="space-y-3 mb-6">
                        {["A", "B", "C", "D"].map((option) => {
                          const optionText = question[`option${option}` as keyof Question] as string;
                          const isSelected = answers[question.questionId] === option;
                          return (
                            <label
                              key={option}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${question.questionId}`}
                                value={option}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(question.questionId, option)}
                                className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-semibold text-slate-700 min-w-[24px]">
                                {option}.
                              </span>
                              <span className="text-slate-700 flex-1">{optionText}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleSubmitAnswer(question.questionId)}
                        disabled={!answers[question.questionId] || isSubmitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        Nộp đáp án
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowSubmitModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Xác nhận nộp bài</h2>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600 mb-2">
                      Tổng số câu hỏi: <span className="font-semibold">{totalQuestions}</span>
                    </p>
                    <p className="text-sm text-slate-600 mb-2">
                      Đã trả lời: <span className="font-semibold text-emerald-600">{answeredQuestions}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      Chưa trả lời: <span className="font-semibold text-red-600">{totalQuestions - answeredQuestions}</span>
                    </p>
                  </div>

                  {totalQuestions - answeredQuestions > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                          Bạn còn {totalQuestions - answeredQuestions} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài không?
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-600">
                    Sau khi nộp bài, bạn sẽ không thể thay đổi đáp án.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang nộp...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Xác nhận nộp bài
                      </>
                    )}
                  </button>
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

