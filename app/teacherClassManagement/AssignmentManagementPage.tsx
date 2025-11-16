"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Plus,
  Loader2,
  Calendar,
  FileText,
  Download,
  Edit,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  File,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CLASS_DETAIL_API = (classId: string | number) =>
  `http://localhost:8080/education/api/classes/${classId}`;

const ASSIGNMENTS_API = (classId: string | number) =>
  `http://localhost:8080/education/api/assignments/${classId}/class`;

const ASSIGNMENT_DETAIL_API = (assignmentId: number) =>
  `http://localhost:8080/education/api/assignments/${assignmentId}`;

const CREATE_ASSIGNMENT_API = "http://localhost:8080/education/api/assignments";

const UPDATE_ASSIGNMENT_API = (assignmentId: number) =>
  `http://localhost:8080/education/api/assignments/${assignmentId}`;

const DELETE_ASSIGNMENT_API = (assignmentId: number) =>
  `http://localhost:8080/education/api/assignments/${assignmentId}`;

const FILE_DOWNLOAD_BASE = "http://localhost:8080";

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

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

export default function AssignmentManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formFiles, setFormFiles] = useState<File[]>([]);

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

  const fetchAssignments = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(ASSIGNMENTS_API(id), {
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

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchAssignments(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchAssignments]);

  const handleCreateAssignment = async () => {
    if (!authToken) return;
    if (!formTitle.trim() || !formContent.trim() || !formStartAt || !formEndAt) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("content", formContent.trim());
      formData.append("classId", classId);
      // Convert datetime-local format to ISO format
      formData.append("startAt", new Date(formStartAt).toISOString());
      formData.append("endAt", new Date(formEndAt).toISOString());

      formFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(CREATE_ASSIGNMENT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể tạo bài tập.");
      }

      await fetchAssignments(authToken, classId);
      setShowAddModal(false);
      resetForm();
      alert("Tạo bài tập thành công!");
    } catch (err) {
      console.error("Failed to create assignment:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tạo bài tập. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!authToken || !selectedAssignment) return;
    if (!formTitle.trim() || !formContent.trim() || !formStartAt || !formEndAt) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("content", formContent.trim());
      // Convert datetime-local format to ISO format
      formData.append("startAt", new Date(formStartAt).toISOString());
      formData.append("endAt", new Date(formEndAt).toISOString());

      formFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(UPDATE_ASSIGNMENT_API(selectedAssignment.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể cập nhật bài tập.");
      }

      await fetchAssignments(authToken, classId);
      setShowEditModal(false);
      setSelectedAssignment(null);
      resetForm();
      alert("Cập nhật bài tập thành công!");
    } catch (err) {
      console.error("Failed to update assignment:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật bài tập. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này?")) {
      return;
    }

    setDeletingId(assignmentId);
    try {
      const response = await fetch(DELETE_ASSIGNMENT_API(assignmentId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa bài tập.");
      }

      await fetchAssignments(authToken, classId);
      alert("Xóa bài tập thành công!");
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa bài tập. Vui lòng thử lại."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewDetail = async (assignment: Assignment) => {
    if (!authToken) return;
    try {
      const detail = await fetchAssignmentDetail(authToken, assignment.id);
      setSelectedAssignment(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert("Không thể tải chi tiết bài tập. Vui lòng thử lại.");
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormTitle(assignment.title);
    setFormContent(assignment.content);
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForInput = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    setFormStartAt(formatForInput(assignment.startAt));
    setFormEndAt(formatForInput(assignment.endAt));
    setFormFiles([]);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormStartAt("");
    setFormEndAt("");
    setFormFiles([]);
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusInfo = (status: string) => {
    if (status.includes("hết hạn") || status.includes("expired")) {
      return {
        label: "Đã hết hạn",
        color: "bg-red-100 text-red-800 border-red-300",
        icon: AlertCircle,
      };
    }
    return {
      label: status,
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle2,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormFiles(Array.from(e.target.files));
    }
  };

  const handleDownloadFile = (downloadUrl: string, fileName: string) => {
    window.open(`${FILE_DOWNLOAD_BASE}${downloadUrl}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50">
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
            <span className="text-slate-900 font-semibold">Bài tập về nhà</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Bài tập về nhà
              </h1>
              <p className="text-slate-600">
                Quản lý và theo dõi các bài tập về nhà của lớp học
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Thêm bài tập mới
            </button>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {assignments.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full py-12 text-center"
                >
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Chưa có bài tập nào</p>
                </motion.div>
              ) : (
                assignments.map((assignment, index) => {
                  const statusInfo = getStatusInfo(assignment.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="relative group cursor-pointer rounded-2xl bg-white p-6 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Gradient Background */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500" />

                      {/* Content */}
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-2">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                              <Calendar className="w-3 h-3" />
                              <span>Bắt đầu: {formatDate(assignment.startAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span>Hết hạn: {formatDate(assignment.endAt)}</span>
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
                          {assignment.content}
                        </p>

                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {assignment.files.length} tệp đính kèm
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            ID: {assignment.id}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(assignment);
                              }}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(assignment);
                              }}
                              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAssignment(assignment.id);
                              }}
                              disabled={deletingId === assignment.id}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa"
                            >
                              {deletingId === assignment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  {showEditModal ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Nhập tiêu đề bài tập"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nội dung *
                    </label>
                    <textarea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Nhập nội dung bài tập"
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        value={formStartAt}
                        onChange={(e) => setFormStartAt(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Hết hạn *
                      </label>
                      <input
                        type="datetime-local"
                        value={formEndAt}
                        onChange={(e) => setFormEndAt(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tệp đính kèm
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-pink-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600">
                          Click để chọn tệp hoặc kéo thả tệp vào đây
                        </span>
                      </label>
                      {formFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded"
                            >
                              <span className="text-sm text-slate-700 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={
                    showEditModal ? handleUpdateAssignment : handleCreateAssignment
                  }
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting
                    ? "Đang lưu..."
                    : showEditModal
                    ? "Cập nhật"
                    : "Tạo mới"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              setShowDetailModal(false);
              setSelectedAssignment(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="pr-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedAssignment.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusInfo(selectedAssignment.status).color}`}
                    >
                      {(() => {
                        const StatusIcon = getStatusInfo(selectedAssignment.status)
                          .icon;
                        return <StatusIcon className="w-4 h-4" />;
                      })()}
                      {getStatusInfo(selectedAssignment.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Nội dung
                    </h3>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedAssignment.content}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                        Bắt đầu
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {formatDate(selectedAssignment.startAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                        Hết hạn
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {formatDate(selectedAssignment.endAt)}
                      </p>
                    </div>
                  </div>

                  {selectedAssignment.files.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Tệp đính kèm
                      </h3>
                      <div className="space-y-2">
                        {selectedAssignment.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <File className="w-5 h-5 text-pink-600" />
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
                              onClick={() =>
                                handleDownloadFile(file.downloadUrl, file.fileName)
                              }
                              className="p-2 text-slate-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                              title="Tải xuống"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

