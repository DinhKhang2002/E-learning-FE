"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  X,
  ArrowLeft,
  Check,
  Ban,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;

const LEAVE_REQUESTS_API = (classId: string | number) =>
  `http://localhost:8080/education/api/leave-request/class/${classId}`;

const APPROVE_LEAVE_REQUEST_API = (requestId: number) =>
  `http://localhost:8080/education/api/leave-request/${requestId}/approve`;

const REJECT_LEAVE_REQUEST_API = (requestId: number) =>
  `http://localhost:8080/education/api/leave-request/${requestId}/reject`;

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

interface LeaveRequest {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  leaveDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function LeaveRequestManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchLeaveRequests = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(LEAVE_REQUESTS_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<LeaveRequest[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message ||
              "Không thể tải danh sách đơn xin nghỉ. Vui lòng thử lại."
          );
        }

        setLeaveRequests(data.result || []);
      } catch (err) {
        console.error("Failed to fetch leave requests:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách đơn xin nghỉ. Vui lòng thử lại sau."
        );
        setLeaveRequests([]);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchLeaveRequests(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchLeaveRequests]);

  const handleApprove = async (requestId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn phê duyệt đơn xin nghỉ này?")) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(APPROVE_LEAVE_REQUEST_API(requestId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể phê duyệt đơn xin nghỉ.");
      }

      await fetchLeaveRequests(authToken, classId);
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      alert("Phê duyệt đơn xin nghỉ thành công!");
    } catch (err) {
      console.error("Failed to approve leave request:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể phê duyệt đơn xin nghỉ. Vui lòng thử lại."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn từ chối đơn xin nghỉ này?")) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(REJECT_LEAVE_REQUEST_API(requestId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể từ chối đơn xin nghỉ.");
      }

      await fetchLeaveRequests(authToken, classId);
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      alert("Từ chối đơn xin nghỉ thành công!");
    } catch (err) {
      console.error("Failed to reject leave request:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể từ chối đơn xin nghỉ. Vui lòng thử lại."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Chờ duyệt",
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: Clock,
        };
      case "APPROVED":
        return {
          label: "Đã duyệt",
          color: "bg-green-100 text-green-800 border-green-300",
          icon: CheckCircle2,
        };
      case "REJECTED":
        return {
          label: "Từ chối",
          color: "bg-red-100 text-red-800 border-red-300",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-800 border-slate-300",
          icon: FileText,
        };
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.studentName.toLowerCase().includes(query) ||
          req.reason.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [leaveRequests, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      ALL: leaveRequests.length,
      PENDING: leaveRequests.filter((r) => r.status === "PENDING").length,
      APPROVED: leaveRequests.filter((r) => r.status === "APPROVED").length,
      REJECTED: leaveRequests.filter((r) => r.status === "REJECTED").length,
    };
  }, [leaveRequests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
            <span className="text-slate-900 font-semibold">Đơn xin nghỉ học</span>
          </motion.nav>

          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-4xl font-bold text-slate-900 mb-2"
          >
            Đơn xin nghỉ học
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-slate-600 mb-8"
          >
            Quản lý và xử lý các đơn xin nghỉ học của học sinh
          </motion.p>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: "Tất cả", count: statusCounts.ALL, color: "from-blue-500 to-cyan-500" },
              {
                label: "Chờ duyệt",
                count: statusCounts.PENDING,
                color: "from-yellow-500 to-amber-500",
              },
              {
                label: "Đã duyệt",
                count: statusCounts.APPROVED,
                color: "from-green-500 to-emerald-500",
              },
              {
                label: "Từ chối",
                count: statusCounts.REJECTED,
                color: "from-red-500 to-rose-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border border-slate-200 cursor-pointer"
                onClick={() =>
                  setStatusFilter(
                    stat.label === "Tất cả"
                      ? "ALL"
                      : (stat.label === "Chờ duyệt"
                          ? "PENDING"
                          : stat.label === "Đã duyệt"
                          ? "APPROVED"
                          : "REJECTED") as StatusFilter
                  )
                }
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-16 -mt-16`}
                />
                <div className="relative">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stat.count}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-6 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên học sinh hoặc lý do..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Leave Requests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredRequests.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-12 text-center"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">
                    {searchQuery || statusFilter !== "ALL"
                      ? "Không tìm thấy đơn xin nghỉ nào"
                      : "Chưa có đơn xin nghỉ nào"}
                  </p>
                </motion.div>
              ) : (
                filteredRequests.map((request, index) => {
                  const statusInfo = getStatusInfo(request.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => setSelectedRequest(request)}
                      className="relative group cursor-pointer rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Gradient Background */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
                          request.status === "PENDING"
                            ? "from-yellow-400 to-amber-500"
                            : request.status === "APPROVED"
                            ? "from-green-400 to-emerald-500"
                            : "from-red-400 to-rose-500"
                        }`}
                      />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {request.studentName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(request.leaveDate)}</span>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                          {request.reason}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            ID: {request.id}
                          </span>
                          <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                            Xem chi tiết →
                          </span>
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
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div
                className={`relative p-6 border-b border-slate-200 ${
                  selectedRequest.status === "PENDING"
                    ? "bg-gradient-to-r from-yellow-50 to-amber-50"
                    : selectedRequest.status === "APPROVED"
                    ? "bg-gradient-to-r from-green-50 to-emerald-50"
                    : "bg-gradient-to-r from-red-50 to-rose-50"
                }`}
              >
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-12">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <User className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedRequest.studentName}
                      </h2>
                      <p className="text-sm text-slate-600">Học sinh</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        Ngày nghỉ: {formatDate(selectedRequest.leaveDate)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusInfo(selectedRequest.status).color}`}
                    >
                      {(() => {
                        const StatusIcon = getStatusInfo(selectedRequest.status)
                          .icon;
                        return <StatusIcon className="w-4 h-4" />;
                      })()}
                      {getStatusInfo(selectedRequest.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Lý do xin nghỉ
                  </h3>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.reason}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      Mã đơn
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      #{selectedRequest.id}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      Mã học sinh
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      #{selectedRequest.studentId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              {selectedRequest.status === "PENDING" && (
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Ban className="w-5 h-5" />
                        Từ chối
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Phê duyệt
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

