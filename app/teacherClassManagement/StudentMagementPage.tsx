"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Search,
  Plus,
  Eye,
  MessageSquare,
  Trash2,
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  BookOpen,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MessagingModal from "@/components/MessagingModal";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const STUDENTS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/class-students/students/${classId}`;

const ADD_STUDENT_API = `${BASE_HTTP}/api/class-students`;

const DELETE_STUDENT_API = (classId: string | number, studentId: string | number) =>
  `${BASE_HTTP}/api/class-students?classId=${classId}&studentId=${studentId}`;

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

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

const ITEMS_PER_PAGE = 10;

export default function StudentManagementPage({ classId }: { classId: string }) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentIdToAdd, setStudentIdToAdd] = useState("");
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedStudentForMessaging, setSelectedStudentForMessaging] = useState<Student | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

    // Get current user ID
    const userRaw = window.localStorage.getItem("user");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.id) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
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

  const fetchStudents = useCallback(
    async (token: string, id: string) => {
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
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách học sinh. Vui lòng thử lại sau."
        );
        setStudents([]);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchStudents(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchStudents]);

  const handleAddStudent = async () => {
    if (!authToken || !studentIdToAdd.trim()) {
      alert("Vui lòng nhập mã học sinh");
      return;
    }

    setIsAddingStudent(true);
    try {
      const response = await fetch(ADD_STUDENT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: classId,
          studentId: studentIdToAdd.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể thêm học sinh vào lớp.");
      }

      if (authToken) {
        await fetchStudents(authToken, classId);
      }
      setShowAddModal(false);
      setStudentIdToAdd("");
      alert("Thêm học sinh thành công!");
    } catch (err) {
      console.error("Failed to add student:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể thêm học sinh. Vui lòng thử lại."
      );
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?")) {
      return;
    }

    if (!authToken) {
      alert("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    setDeletingStudentId(studentId);
    try {
      const response = await fetch(DELETE_STUDENT_API(classId, studentId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa học sinh khỏi lớp.");
      }

      await fetchStudents(authToken, classId);
      alert("Xóa học sinh khỏi lớp thành công!");
    } catch (err) {
      console.error("Failed to delete student:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa học sinh. Vui lòng thử lại."
      );
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleViewDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  const handleOpenMessaging = (student: Student) => {
    setSelectedStudentForMessaging(student);
    setShowMessagingModal(true);
  };

  const handleCloseMessaging = () => {
    setShowMessagingModal(false);
    setSelectedStudentForMessaging(null);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(query) ||
        student.username.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        `HS-${student.id.toString().padStart(3, "0")}`.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const formatStudentId = (id: number) => {
    return `HS-${id.toString().padStart(3, "0")}`;
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
            <span className="text-slate-900 font-semibold">Quản lý học sinh</span>
          </motion.nav>

          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl font-bold text-slate-900 mb-8"
          >
            Quản lý học sinh
          </motion.h1>

          {/* General Class Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Thông tin chung lớp học
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tên lớp học</p>
                  <p className="text-base font-semibold text-slate-900">
                    {classData?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Sĩ số hiện tại</p>
                  <p className="text-base font-semibold text-slate-900">
                    {students.length} học sinh
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Mã lớp</p>
                  <p className="text-base font-semibold text-slate-900">
                    {classData?.code || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Giáo viên chủ nhiệm</p>
                  <p className="text-base font-semibold text-slate-900">
                    {classData?.teacherName || "—"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Student List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900">Danh sách học sinh</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Thêm học sinh
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh theo tên hoặc mã số..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-red-600 font-semibold">{error}</p>
              </div>
            )}

            {/* Student Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      STT
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      HỌ VÀ TÊN
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      MÃ HỌC SINH
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      NGÀY SINH
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        {searchQuery
                          ? "Không tìm thấy học sinh nào"
                          : "Chưa có học sinh nào trong lớp"}
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-4 px-4">
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
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {formatStudentId(student.id)}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">
                          {formatDate(student.dob)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewDetail(student)}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMessaging(student)}
                              className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Nhắn tin"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              disabled={deletingStudentId === student.id}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Xóa"
                            >
                              {deletingStudentId === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredStudents.length)}{" "}
                  của {filteredStudents.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      </div>

      <Footer />

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Thêm học sinh vào lớp
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mã học sinh (ID)
              </label>
              <input
                type="text"
                value={studentIdToAdd}
                onChange={(e) => setStudentIdToAdd(e.target.value)}
                placeholder="Nhập mã học sinh"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setStudentIdToAdd("");
                }}
                disabled={isAddingStudent}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAddStudent}
                disabled={isAddingStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isAddingStudent && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isAddingStudent ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailOpen && selectedStudent && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center p-4 bg-opacity-60 backdrop-blur-sm">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 space-y-6">
              <div className="relative flex items-center w-full h-24">
                {/* Nút quay lại ở bên trái */}
                <button
                  onClick={() => {
                    setDetailOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Div avatar + thông tin học sinh ở giữa */}
                <div className="flex items-center gap-6 mx-auto">
                  <img
                    src={selectedStudent.avatar || "/avatar-default.png"}
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="w-24 h-24 rounded-3xl object-cover shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/avatar-default.png";
                    }}
                  />
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Mã học sinh:</span>
                        <span className="text-lg font-mono font-bold text-slate-900">
                          {formatStudentId(selectedStudent.id)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Họ và tên:</span>
                        <span className="text-lg font-medium text-slate-900">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin cơ bản */}
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Thông tin cơ bản
                  </h4>
                  <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex-shrink-0">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email</p>
                        <p className="text-slate-900 font-medium break-all">{selectedStudent.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 flex-shrink-0">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Số điện thoại</p>
                        <p className="text-slate-900 font-medium">{selectedStudent.phoneNumber || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 flex-shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Địa chỉ</p>
                        <p className="text-slate-900 font-medium">{selectedStudent.address || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 flex-shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ngày sinh</p>
                        <p className="text-slate-900 font-medium">{formatDate(selectedStudent.dob)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin hệ thống */}
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Thông tin hệ thống
                  </h4>
                  <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 flex-shrink-0">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tên đăng nhập</p>
                        <p className="text-slate-900 font-medium font-mono">{selectedStudent.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-5 border-2 border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 text-pink-600 flex-shrink-0">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Môn học chính</p>
                        <p className="text-slate-900 font-medium">
                          {selectedStudent.primarySubject === "ENGLISH" ? "Tiếng Anh" :
                           selectedStudent.primarySubject === "COMPUTER_SCIENCE" ? "Tin học" :
                           selectedStudent.primarySubject || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging Modal */}
      {showMessagingModal && selectedStudentForMessaging && currentUserId && authToken && (
        <MessagingModal
          isOpen={showMessagingModal}
          onClose={handleCloseMessaging}
          currentUserId={currentUserId}
          toUserId={selectedStudentForMessaging.id}
          toUserName={`${selectedStudentForMessaging.firstName} ${selectedStudentForMessaging.lastName}`}
          toUserAvatar={selectedStudentForMessaging.avatar || "/default-avatar.png"}
          authToken={authToken}
        />
      )}
    </main>
  );
}