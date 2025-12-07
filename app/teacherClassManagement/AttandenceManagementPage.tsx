"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const ATTENDANCE_OVERVIEW_API = (classId: string | number) =>
  `${BASE_HTTP}/api/class-students/students/attendance/${classId}`;

const STUDENTS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/class-students/students/${classId}`;

const CREATE_ATTENDANCE_API = `${BASE_HTTP}/api/attendance`;

const ATTENDANCE_HISTORY_API = (classId: string | number, date: string) =>
  `${BASE_HTTP}/api/attendance/class?classId=${classId}&attendanceDate=${date}`;

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

interface Student {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: string;
  role: string;
  primarySubject: string;
  avatar: string;
  dob: string;
}

interface AttendanceOverview {
  presentNumber: number;
  lateNumber: number;
  absenceNumber: number;
  userResponse: Student;
}

interface AttendanceHistoryItem {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED_ABSENCE" | "LATE";
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED_ABSENCE" | "LATE";

export default function AttandenceManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [attendanceOverview, setAttendanceOverview] = useState<
    AttendanceOverview[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [studentAttendance, setStudentAttendance] = useState<
    Record<number, AttendanceStatus>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyDate, setHistoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceHistory, setAttendanceHistory] = useState<
    AttendanceHistoryItem[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const fetchAttendanceOverview = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(ATTENDANCE_OVERVIEW_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<AttendanceOverview[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải tổng quan điểm danh. Vui lòng thử lại."
          );
        }

        setAttendanceOverview(data.result || []);
      } catch (err) {
        console.error("Failed to fetch attendance overview:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải tổng quan điểm danh. Vui lòng thử lại sau."
        );
        setAttendanceOverview([]);
      }
    },
    []
  );

  const fetchStudents = useCallback(async (token: string, id: string) => {
    try {
      const response = await fetch(STUDENTS_API(id), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: ApiResponse<Student[]> = await response.json();
      if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
        throw new Error(
          data?.message || "Không thể tải danh sách học sinh. Vui lòng thử lại."
        );
      }

      setStudents(data.result || []);
      // Initialize all students as PRESENT by default
      const initialAttendance: Record<number, AttendanceStatus> = {};
      (data.result || []).forEach((student) => {
        initialAttendance[student.id] = "PRESENT";
      });
      setStudentAttendance(initialAttendance);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách học sinh. Vui lòng thử lại."
      );
      setStudents([]);
    }
  }, []);

  const fetchAttendanceHistory = useCallback(
    async (token: string, id: string, date: string) => {
      setLoadingHistory(true);
      try {
        const response = await fetch(ATTENDANCE_HISTORY_API(id, date), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<AttendanceHistoryItem[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải lịch sử điểm danh. Vui lòng thử lại."
          );
        }

        setAttendanceHistory(data.result || []);
      } catch (err) {
        console.error("Failed to fetch attendance history:", err);
        setAttendanceHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchAttendanceOverview(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchAttendanceOverview]);

  useEffect(() => {
    if (authToken && classId && historyDate) {
      fetchAttendanceHistory(authToken, classId, historyDate);
    }
  }, [authToken, classId, historyDate, fetchAttendanceHistory]);

  const handleOpenAddModal = async () => {
    if (!authToken) return;
    setShowAddModal(true);
    await fetchStudents(authToken, classId);
  };

  const handleSubmitAttendance = async () => {
    if (!authToken) {
      alert("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    if (!attendanceDate) {
      alert("Vui lòng chọn ngày điểm danh");
      return;
    }

    if (students.length === 0) {
      alert("Không có học sinh nào trong lớp");
      return;
    }

    setIsSubmitting(true);
    try {
      const attendances = students.map((student) => ({
        studentId: student.id.toString(),
        status: studentAttendance[student.id] || "PRESENT",
      }));

      const response = await fetch(CREATE_ATTENDANCE_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          attendanceDate: attendanceDate,
          attendances: attendances,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể lưu điểm danh.");
      }

      // Refresh data
      await fetchAttendanceOverview(authToken, classId);
      await fetchAttendanceHistory(authToken, classId, attendanceDate);

      setShowAddModal(false);
      setStudentAttendance({});
      alert("Điểm danh thành công!");
    } catch (err) {
      console.error("Failed to submit attendance:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể lưu điểm danh. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: AttendanceStatus): string => {
    switch (status) {
      case "PRESENT":
        return "Có mặt";
      case "ABSENT":
        return "Nghỉ học";
      case "EXCUSED_ABSENCE":
        return "Có phép";
      case "LATE":
        return "Muộn";
      default:
        return status;
    }
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-700 border-green-300";
      case "ABSENT":
        return "bg-red-100 text-red-700 border-red-300";
      case "EXCUSED_ABSENCE":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "LATE":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle2 className="w-4 h-4" />;
      case "ABSENT":
        return <XCircle className="w-4 h-4" />;
      case "EXCUSED_ABSENCE":
        return <UserCheck className="w-4 h-4" />;
      case "LATE":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100 via-white to-transparent" />

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
            <span className="text-slate-900 font-semibold">Điểm danh</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 flex items-center justify-between"
          >
            <h1 className="text-3xl font-bold text-slate-900">Điểm danh</h1>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm điểm danh mới
            </button>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Attendance Overview Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                Tổng quan điểm danh
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      HỌ VÀ TÊN
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      CÓ MẶT
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      MUỘN
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      NGHỈ HỌC
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      TỔNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceOverview.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        Chưa có dữ liệu điểm danh
                      </td>
                    </tr>
                  ) : (
                    attendanceOverview.map((item) => {
                      const total =
                        item.presentNumber +
                        item.lateNumber +
                        item.absenceNumber;
                      return (
                        <tr
                          key={item.userResponse.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  item.userResponse.avatar ||
                                  "/avatar-default.png"
                                }
                                alt={`${item.userResponse.firstName} ${item.userResponse.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/avatar-default.png";
                                }}
                              />
                              <span className="text-sm font-medium text-slate-900">
                                {item.userResponse.firstName}{" "}
                                {item.userResponse.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-semibold text-green-600">
                              {item.presentNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-semibold text-yellow-600">
                              {item.lateNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-semibold text-red-600">
                              {item.absenceNumber}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm font-semibold text-slate-900">
                              {total}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Attendance History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Lịch sử điểm danh
                </h2>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      HỌ VÀ TÊN
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                      TRẠNG THÁI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                      </td>
                    </tr>
                  ) : attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-slate-500">
                        Không có dữ liệu điểm danh cho ngày này
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-slate-900">
                            {item.studentName}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getStatusIcon(item.status)}
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>
      </div>

      <Footer />

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Thêm điểm danh mới
            </h3>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ngày điểm danh
              </label>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-500" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Danh sách học sinh
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar || "/avatar-default.png"}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/avatar-default.png";
                        }}
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                    <select
                      value={studentAttendance[student.id] || "PRESENT"}
                      onChange={(e) =>
                        setStudentAttendance((prev) => ({
                          ...prev,
                          [student.id]: e.target.value as AttendanceStatus,
                        }))
                      }
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PRESENT">Có mặt</option>
                      <option value="ABSENT">Nghỉ học</option>
                      <option value="EXCUSED_ABSENCE">Có phép</option>
                      <option value="LATE">Muộn</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setStudentAttendance({});
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitAttendance}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

