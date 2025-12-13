"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Loader2,
  BookOpen,
  CalendarDays,
  Download,
  Eye,
  FileText,
  File,
  FileVideo,
  FileImage,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const DOCUMENTS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/documents/class/${classId}`;
const GET_FILE_API = (fileUrl: string) => `${BASE_HTTP}/api/files/get?fileUrl=${encodeURIComponent(fileUrl)}`;

interface FileRecord {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
}

interface Document {
  id: number;
  title: string;
  filePath: string;
  uploadedBy: string;
  fileRecord: FileRecord | null;
  uploadedAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

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

function formatDateTime(input: string) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileType(filePath: string, title: string) {
  if (!filePath) return "unknown";
  
  const lowerPath = filePath.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Check for Google Drive
  if (lowerPath.includes("drive.google.com")) {
    return "drive";
  }
  
  // Check file extension
  if (lowerPath.includes(".pdf") || lowerTitle.includes(".pdf")) {
    return "pdf";
  }
  if (lowerPath.includes(".doc") || lowerPath.includes(".docx") || lowerTitle.includes(".doc")) {
    return "doc";
  }
  if (lowerPath.includes(".ppt") || lowerPath.includes(".pptx") || lowerTitle.includes(".ppt")) {
    return "ppt";
  }
  if (lowerPath.includes(".xls") || lowerPath.includes(".xlsx") || lowerTitle.includes(".xls")) {
    return "xls";
  }
  if (lowerPath.includes(".zip") || lowerPath.includes(".rar") || lowerTitle.includes(".zip")) {
    return "zip";
  }
  if (lowerPath.includes(".jpg") || lowerPath.includes(".jpeg") || lowerPath.includes(".png") || lowerPath.includes(".gif")) {
    return "image";
  }
  if (lowerPath.includes(".mp4") || lowerPath.includes(".avi") || lowerPath.includes(".mov")) {
    return "video";
  }
  
  return "file";
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return { icon: FileText, color: "from-red-500 to-rose-500", label: "PDF" };
    case "doc":
      return { icon: FileText, color: "from-blue-500 to-cyan-500", label: "DOC" };
    case "ppt":
      return { icon: FileText, color: "from-orange-500 to-amber-500", label: "PPT" };
    case "xls":
      return { icon: FileText, color: "from-emerald-500 to-teal-500", label: "XLS" };
    case "zip":
      return { icon: File, color: "from-purple-500 to-pink-500", label: "ZIP" };
    case "image":
      return { icon: FileImage, color: "from-pink-500 to-rose-500", label: "IMG" };
    case "video":
      return { icon: FileVideo, color: "from-indigo-500 to-purple-500", label: "VID" };
    case "drive":
      return { icon: ExternalLink, color: "from-yellow-500 to-orange-500", label: "DRIVE" };
    default:
      return { icon: File, color: "from-slate-500 to-slate-600", label: "FILE" };
  }
}

export default function DocumentAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // File View Modal State
  const [showFileModal, setShowFileModal] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [viewingFileType, setViewingFileType] = useState<string>("");
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      setAuthToken(token);
    } else {
      setLoading(false);
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchDocuments = useCallback(
    async (token: string, cId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(DOCUMENTS_API(cId), {
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
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      fetchDocuments(authToken, classId);
    }
  }, [authToken, classId, fetchDocuments]);

  const handleViewDocument = async (document: Document) => {
    // Nếu có fileRecord và fileUrl, gọi API để lấy file từ S3
    if (document.fileRecord?.fileUrl && authToken) {
      setIsLoadingFile(true);
      setViewingFileUrl(document.fileRecord.fileUrl);
      setViewingFileName(document.fileRecord.fileName || document.title);
      setViewingFileType(document.fileRecord.fileType || "application/octet-stream");
      setShowFileModal(true);

      try {
        const response = await fetch(GET_FILE_API(document.fileRecord.fileUrl), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Không thể tải file");
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setFileBlobUrl(blobUrl);
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi tải file");
        setShowFileModal(false);
      } finally {
        setIsLoadingFile(false);
      }
    } else if (document.filePath) {
      // Fallback: mở filePath trực tiếp nếu không có fileRecord
      window.open(document.filePath, "_blank", "noopener,noreferrer");
    }
  };

  const handleCloseFileModal = () => {
    if (fileBlobUrl) {
      URL.revokeObjectURL(fileBlobUrl);
      setFileBlobUrl(null);
    }
    setShowFileModal(false);
    setViewingFileUrl(null);
    setViewingFileName("");
    setViewingFileType("");
  };

  const handleDownloadDocument = async (doc: Document) => {
    // Ưu tiên sử dụng fileRecord.fileUrl nếu có
    if (doc.fileRecord?.fileUrl && authToken) {
      try {
        const response = await fetch(GET_FILE_API(doc.fileRecord.fileUrl), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Không thể tải file");
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = blobUrl;
        link.download = doc.fileRecord.fileName || doc.title;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi tải file");
      }
    } else if (doc.filePath) {
      // Fallback: sử dụng filePath nếu không có fileRecord
      // For Google Drive links, open in new tab
      if (doc.filePath.includes("drive.google.com")) {
        window.open(doc.filePath, "_blank", "noopener,noreferrer");
      } else {
        // For direct file links, trigger download
        const link = window.document.createElement("a");
        link.href = doc.filePath;
        link.download = doc.title;
        link.target = "_blank";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải tài liệu...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-indigo-100/80 via-purple-100/60 to-pink-100/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />
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
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link
              href={`/studentClassPage?id=${classId}`}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              Lớp học
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">Tài liệu lớp học</span>
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
                  Tài liệu lớp học
                </h1>
                <p className="text-slate-600">
                  Xem và tải xuống tài liệu học tập của lớp
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tài liệu..."
                    className="pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition w-64"
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
            </div>
          </motion.div>

          {/* Statistics */}
          {documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <div className="rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg p-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Tổng số tài liệu</p>
                      <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
                    </div>
                  </div>
                  {searchQuery && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Tìm thấy</span>
                      <span className="font-semibold text-indigo-600">{filteredDocuments.length}</span>
                      <span>kết quả</span>
                    </div>
                  )}
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
              <p className="text-red-600 font-semibold mb-2">Không thể tải tài liệu</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  if (authToken && classId) {
                    fetchDocuments(authToken, classId);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <Loader2 className="w-4 h-4" />
                Thử lại
              </button>
            </motion.div>
          )}

          {/* Documents Grid */}
          {!loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {filteredDocuments.length === 0 ? (
                <div className="rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">
                    {searchQuery ? "Không tìm thấy tài liệu nào" : "Chưa có tài liệu nào"}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Tài liệu sẽ được hiển thị tại đây khi giáo viên tải lên"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments
                    .sort(
                      (a, b) =>
                        new Date(b.uploadedAt).getTime() -
                        new Date(a.uploadedAt).getTime()
                    )
                    .map((document, index) => {
                      const fileType = getFileType(document.filePath, document.title);
                      const fileInfo = getFileIcon(fileType);
                      const FileIcon = fileInfo.icon;
                      return (
                        <motion.div
                          key={document.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        >
                          <div className="p-6">
                            {/* File Icon */}
                            <div className="flex items-start gap-4 mb-4">
                              <div
                                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${fileInfo.color} shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                              >
                                <FileIcon className="w-7 h-7 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                  {document.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <CalendarDays className="w-3 h-3" />
                                  <span>{formatDate(document.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>

                            {/* File Type Badge */}
                            <div className="mb-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {fileInfo.label}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                              >
                                <Eye className="w-4 h-4" />
                                Xem
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-all hover:scale-105"
                              >
                                <Download className="w-4 h-4" />
                                Tải về
                              </button>
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

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setSelectedDocument(null)}
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
                  <h2 className="text-2xl font-bold text-slate-900">Chi tiết tài liệu</h2>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {selectedDocument && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Tên tài liệu
                      </label>
                      <p className="text-slate-900 font-medium">{selectedDocument.title}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Ngày tải lên
                      </label>
                      <p className="text-slate-600">{formatDateTime(selectedDocument.uploadedAt)}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Đường dẫn
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-slate-600 text-sm break-all flex-1">
                          {selectedDocument.filePath}
                        </p>
                        <button
                          onClick={() => handleViewDocument(selectedDocument)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Mở trong tab mới"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button
                        onClick={() => {
                          handleViewDocument(selectedDocument);
                          setSelectedDocument(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Xem tài liệu
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadDocument(selectedDocument);
                          setSelectedDocument(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Tải xuống
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FILE VIEW MODAL */}
      <AnimatePresence>
        {showFileModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{viewingFileName}</h2>
                  <p className="text-sm text-slate-500 mt-1">{viewingFileType}</p>
                </div>
                <button 
                  onClick={handleCloseFileModal} 
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6 bg-slate-50">
                {isLoadingFile ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                  </div>
                ) : fileBlobUrl ? (
                  <div className="w-full h-full">
                    {viewingFileType.startsWith("image/") ? (
                      <img 
                        src={fileBlobUrl} 
                        alt={viewingFileName}
                        className="max-w-full max-h-full mx-auto object-contain rounded-lg shadow-lg"
                      />
                    ) : viewingFileType === "application/pdf" ? (
                      <iframe
                        src={fileBlobUrl}
                        className="w-full h-full min-h-[600px] rounded-lg border border-slate-200"
                        title={viewingFileName}
                      />
                    ) : viewingFileType.includes("word") || viewingFileType.includes("document") ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <BookOpen className="w-16 h-16 text-slate-400 mb-4" />
                        <p className="text-slate-600 mb-4">File Word không thể xem trực tiếp trong trình duyệt</p>
                        <a
                          href={fileBlobUrl}
                          download={viewingFileName}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                        >
                          Tải xuống file
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText className="w-16 h-16 text-slate-400 mb-4" />
                        <p className="text-slate-600 mb-4">Loại file này không thể xem trực tiếp</p>
                        <a
                          href={fileBlobUrl}
                          download={viewingFileName}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                        >
                          Tải xuống file
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">Không thể tải file</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}

