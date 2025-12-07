"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Home,
  Search,
  Upload,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  FileText,
  File,
  FileVideo,
  FileImage,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const DOCUMENTS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/documents/class/${classId}`;

const UPDATE_DOCUMENT_API = (documentId: number) =>
  `${BASE_HTTP}/api/documents/${documentId}`;

const DELETE_DOCUMENT_API = (documentId: number) =>
  `${BASE_HTTP}/api/documents/${documentId}`;

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

interface Document {
  id: number;
  title: string;
  filePath: string;
  uploadedAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

const ITEMS_PER_PAGE = 5;

export default function DocumentManagementPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(
    new Set()
  );
  const [viewingDocument, setViewingDocument] = useState<Document | null>(
    null
  );
  const [editingDocument, setEditingDocument] = useState<Document | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editFilePath, setEditFilePath] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(
    null
  );
  const [uploaderName, setUploaderName] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    const userRaw = window.localStorage.getItem("user");
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      setError("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      router.push("/login");
    }

    // Get uploader name from user info
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const fullName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || "Người dùng";
        setUploaderName(fullName);
      } catch {
        setUploaderName("Người dùng");
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

  const fetchDocuments = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(DOCUMENTS_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Document[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải danh sách tài liệu. Vui lòng thử lại."
          );
        }

        setDocuments(data.result || []);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách tài liệu. Vui lòng thử lại sau."
        );
        setDocuments([]);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchDocuments(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchDocuments]);

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
      return;
    }

    if (!authToken) {
      alert("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    setDeletingDocumentId(documentId);
    try {
      const response = await fetch(DELETE_DOCUMENT_API(documentId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa tài liệu.");
      }

      await fetchDocuments(authToken, classId);
      alert("Xóa tài liệu thành công!");
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể xóa tài liệu. Vui lòng thử lại."
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setEditTitle(document.title);
    setEditFilePath(document.filePath);
  };

  const handleSaveEdit = async () => {
    if (!authToken || !editingDocument) return;
    if (!editTitle.trim() || !editFilePath.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(UPDATE_DOCUMENT_API(editingDocument.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          filePath: editFilePath.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể cập nhật tài liệu.");
      }

      await fetchDocuments(authToken, classId);
      setEditingDocument(null);
      setEditTitle("");
      setEditFilePath("");
      alert("Cập nhật tài liệu thành công!");
    } catch (err) {
      console.error("Failed to update document:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật tài liệu. Vui lòng thử lại."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);
  };

  const handleDownloadDocument = (document: Document) => {
    window.open(document.filePath, "_blank");
  };

  const toggleDocumentSelection = (documentId: number) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const getFileType = (filePath: string, title: string): string => {
    const path = filePath.toLowerCase();
    const titleLower = title.toLowerCase();

    if (path.includes(".pdf") || titleLower.includes(".pdf")) return "PDF";
    if (path.includes(".docx") || titleLower.includes(".docx")) return "DOCX";
    if (path.includes(".doc") || titleLower.includes(".doc")) return "DOC";
    if (path.includes(".pptx") || titleLower.includes(".pptx")) return "PPTX";
    if (path.includes(".ppt") || titleLower.includes(".ppt")) return "PPT";
    if (path.includes(".mp4") || titleLower.includes(".mp4")) return "MP4";
    if (path.includes(".mp3") || titleLower.includes(".mp3")) return "MP3";
    if (path.includes(".jpg") || path.includes(".jpeg") || titleLower.includes(".jpg"))
      return "JPG";
    if (path.includes(".png") || titleLower.includes(".png")) return "PNG";
    if (path.includes("drive.google.com")) return "GOOGLE DRIVE";
    return "FILE";
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="w-4 h-4" />;
      case "MP4":
      case "MP3":
        return <FileVideo className="w-4 h-4" />;
      case "JPG":
      case "PNG":
        return <FileImage className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
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

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;

    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        getFileType(doc.filePath, doc.title).toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
            <span className="text-slate-900 font-semibold">Quản lý tài liệu</span>
          </motion.nav>

          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl font-bold text-slate-900 mb-8"
          >
            Quản lý tài liệu {classData?.name || ""}
          </motion.h1>

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
          >
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium">
              <Filter className="w-4 h-4" />
              Lọc
            </button>

            {/* Upload Button */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
              <Upload className="w-4 h-4" />
              Tải lên tài liệu mới
            </button>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Documents Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={
                          paginatedDocuments.length > 0 &&
                          paginatedDocuments.every((doc) =>
                            selectedDocuments.has(doc.id)
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocuments(
                              new Set(paginatedDocuments.map((doc) => doc.id))
                            );
                          } else {
                            setSelectedDocuments(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      TÊN TÀI LIỆU
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      LOẠI TỆP
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      NGÀY TẢI LÊN
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      NGƯỜI TẢI LÊN
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {searchQuery
                          ? "Không tìm thấy tài liệu nào"
                          : "Chưa có tài liệu nào"}
                      </td>
                    </tr>
                  ) : (
                    paginatedDocuments.map((document) => {
                      const fileType = getFileType(document.filePath, document.title);
                      return (
                        <tr
                          key={document.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={selectedDocuments.has(document.id)}
                              onChange={() =>
                                toggleDocumentSelection(document.id)
                              }
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-medium text-slate-900">
                              {document.title}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="text-slate-600">
                                {getFileIcon(fileType)}
                              </div>
                              <span className="text-sm text-slate-600">
                                {fileType}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {formatDate(document.uploadedAt)}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {uploaderName || "—"}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Tải xuống"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xem"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditDocument(document)}
                                className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(document.id)}
                                disabled={deletingDocumentId === document.id}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Xóa"
                              >
                                {deletingDocumentId === document.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDocuments.length > 0 && (
              <div className="mt-6 px-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-600">
                  Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)}{" "}
                  trên {filteredDocuments.length} tài liệu
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &lt;
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
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      </div>

      <Footer />

      {/* PDF Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">
                {viewingDocument.title}
              </h3>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingDocument.filePath.includes("drive.google.com") ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-slate-600">
                      Tài liệu được lưu trữ trên Google Drive
                    </p>
                    <a
                      href={viewingDocument.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mở trong Google Drive
                    </a>
                  </div>
                </div>
              ) : viewingDocument.filePath.toLowerCase().endsWith(".pdf") ||
                viewingDocument.filePath.includes(".pdf") ? (
                <iframe
                  src={viewingDocument.filePath}
                  className="w-full h-full min-h-[600px] border-0 rounded-lg"
                  title={viewingDocument.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-slate-600">
                      Không thể xem trước loại tệp này
                    </p>
                    <a
                      href={viewingDocument.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống để xem
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDocument && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Sửa tài liệu
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên tài liệu
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tên tài liệu"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đường dẫn tệp
                </label>
                <input
                  type="text"
                  value={editFilePath}
                  onChange={(e) => setEditFilePath(e.target.value)}
                  placeholder="Nhập đường dẫn tệp"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setEditingDocument(null);
                  setEditTitle("");
                  setEditFilePath("");
                }}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

