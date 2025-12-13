"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  CheckSquare,
  CalendarDays,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  Send,
  AlertCircle,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const ATTENDANCE_API = (studentId: string | number, classId: string | number) =>
  `${BASE_HTTP}/api/attendance/student?studentId=${studentId}&classId=${classId}`;

const LEAVE_REQUEST_API = `${BASE_HTTP}/api/leave-request`;

const LEAVE_REQUESTS_API = (studentId: string | number, classId: string | number) =>
  `${BASE_HTTP}/api/leave-request/student?studentId=${studentId}&classId=${classId}`;

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED_ABSENCE";
}

interface LeaveRequest {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  leaveDate: string;
  reason: string;
  status: "APPROVED" | "REJECTED" | "PENDING";
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED_ABSENCE";
type LeaveRequestStatus = "APPROVED" | "REJECTED" | "PENDING";

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

function formatDateFull(input: string) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const getStatusInfo = (status: AttendanceStatus) => {
  switch (status) {
    case "PRESENT":
      return {
        label: "Có mặt",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
        icon: CheckCircle2,
        bgGradient: "from-emerald-500 to-teal-500",
      };
    case "ABSENT":
      return {
        label: "Nghỉ học",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: XCircle,
        bgGradient: "from-red-500 to-rose-500",
      };
    case "LATE":
      return {
        label: "Muộn",
        color: "bg-amber-100 text-amber-700 border-amber-300",
        icon: Clock,
        bgGradient: "from-amber-500 to-orange-500",
      };
    case "EXCUSED_ABSENCE":
      return {
        label: "Có phép",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: UserCheck,
        bgGradient: "from-blue-500 to-cyan-500",
      };
    default:
      return {
        label: status,
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: AlertCircle,
        bgGradient: "from-slate-500 to-slate-600",
      };
  }
};

const getLeaveStatusInfo = (status: LeaveRequestStatus) => {
  switch (status) {
    case "APPROVED":
      return {
        label: "Đã duyệt",
        color: "bg-emerald-100 text-emerald-700 border-emerald-300",
        icon: CheckCircle2,
      };
    case "REJECTED":
      return {
        label: "Từ chối",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: XCircle,
      };
    case "PENDING":
      return {
        label: "Chờ duyệt",
        color: "bg-amber-100 text-amber-700 border-amber-300",
        icon: Clock,
      };
    default:
      return {
        label: status,
        color: "bg-slate-100 text-slate-700 border-slate-300",
        icon: AlertCircle,
      };
  }
};

export default function AttandenceAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leave request form state
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

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

  const fetchAttendance = useCallback(
    async (token: string, sId: number, cId: string) => {
      try {
        const response = await fetch(ATTENDANCE_API(sId, cId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<AttendanceRecord[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải lịch sử điểm danh. Vui lòng thử lại."
          );
        }

        setAttendanceRecords(data.result || []);
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải lịch sử điểm danh. Vui lòng thử lại sau."
        );
        setAttendanceRecords([]);
      }
    },
    []
  );

  const fetchLeaveRequests = useCallback(
    async (token: string, sId: number, cId: string) => {
      try {
        const response = await fetch(LEAVE_REQUESTS_API(sId, cId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<LeaveRequest[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách đơn xin nghỉ. Vui lòng thử lại."
          );
        }

        setLeaveRequests(data.result || []);
      } catch (err) {
        console.error("Failed to fetch leave requests:", err);
        // Don't set error for leave requests, just log it
        setLeaveRequests([]);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && studentId && classId) {
      setLoading(true);
      Promise.all([
        fetchAttendance(authToken, studentId, classId),
        fetchLeaveRequests(authToken, studentId, classId),
      ]).finally(() => setLoading(false));
    }
  }, [authToken, studentId, classId, fetchAttendance, fetchLeaveRequests]);

  const handleSubmitLeaveRequest = async () => {
    if (!leaveDate || !leaveReason.trim() || !classId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(LEAVE_REQUEST_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          reason: leaveReason.trim(),
          leaveDate: leaveDate,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(
          data?.message || "Không thể gửi đơn xin nghỉ. Vui lòng thử lại."
        );
      }

      // Show success message
      setSuccessMessage("Đơn xin nghỉ học đã được gửi thành công! Đơn của bạn đang chờ được duyệt.");

      // Reset form
      setLeaveDate("");
      setLeaveReason("");
      
      // Close form after a short delay
      setTimeout(() => {
        setShowLeaveForm(false);
      }, 1500);

      // Refresh leave requests
      if (authToken && studentId && classId) {
        await fetchLeaveRequests(authToken, studentId, classId);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể gửi đơn xin nghỉ. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r) => r.status === "PRESENT").length,
    absent: attendanceRecords.filter((r) => r.status === "ABSENT").length,
    late: attendanceRecords.filter((r) => r.status === "LATE").length,
    attendanceRate:
      attendanceRecords.length > 0
        ? Math.round(
            (attendanceRecords.filter((r) => r.status === "PRESENT").length /
              attendanceRecords.length) *
              100
          )
        : 0,
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
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
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-emerald-100/80 via-teal-100/60 to-cyan-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
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
              className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/studentClassPage?id=${classId}`}
              className="text-slate-600 hover:text-emerald-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Điểm danh & Xin nghỉ</span>
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
                  Điểm danh & Xin nghỉ học
                </h1>
                <p className="text-slate-600">
                  Xem lịch sử điểm danh và quản lý đơn xin nghỉ học
                </p>
              </div>
              <button
                onClick={() => setShowLeaveForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Tạo đơn xin nghỉ
              </button>
            </div>
          </motion.div>

          {/* Statistics Cards */}
          {attendanceRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Có mặt</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Nghỉ học</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Muộn</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Tỷ lệ</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
            {/* Attendance Records */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Lịch sử điểm danh</h2>
                  <CheckSquare className="w-6 h-6 text-emerald-600" />
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium mb-2">
                      Chưa có lịch sử điểm danh
                    </p>
                    <p className="text-slate-500 text-sm">
                      Lịch sử điểm danh sẽ được hiển thị tại đây
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {attendanceRecords
                      .sort(
                        (a, b) =>
                          new Date(b.attendanceDate).getTime() -
                          new Date(a.attendanceDate).getTime()
                      )
                      .map((record, index) => {
                        const statusInfo = getStatusInfo(record.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${statusInfo.bgGradient} shadow-lg`}
                            >
                              <StatusIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-slate-900">
                                  {formatDateFull(record.attendanceDate)}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500">
                                {formatDate(record.attendanceDate)}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Leave Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Đơn xin nghỉ học</h2>
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>

                {leaveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium mb-2">
                      Chưa có đơn xin nghỉ nào
                    </p>
                    <p className="text-slate-500 text-sm">
                      Tạo đơn xin nghỉ học mới bằng nút bên trên
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {leaveRequests
                      .sort(
                        (a, b) =>
                          new Date(b.leaveDate).getTime() -
                          new Date(a.leaveDate).getTime()
                      )
                      .map((request, index) => {
                        const statusInfo = getLeaveStatusInfo(request.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarDays className="w-4 h-4 text-slate-400" />
                                  <p className="font-semibold text-slate-900">
                                    {formatDateFull(request.leaveDate)}
                                  </p>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {request.reason}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} ml-3 flex-shrink-0`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Leave Request Form Modal */}
      <AnimatePresence>
        {showLeaveForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowLeaveForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Tạo đơn xin nghỉ học</h2>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <p className="text-emerald-700 text-sm font-medium">{successMessage}</p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ngày nghỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Lý do xin nghỉ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      rows={6}
                      placeholder="Nhập lý do xin nghỉ học của bạn..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition resize-none"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {leaveReason.length} ký tự
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={() => {
                        setShowLeaveForm(false);
                        setLeaveDate("");
                        setLeaveReason("");
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitLeaveRequest}
                      disabled={isSubmitting || !leaveDate || !leaveReason.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Gửi đơn
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

