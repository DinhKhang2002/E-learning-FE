"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Home,
  Plus,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrimaryRoadmap from "./components/PrimaryRoadmap";
import ChildRoadmap from "./components/ChildRoadmap";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

const ROADMAPS_API = (classId: string | number) =>
  `${BASE_HTTP}/api/learning-roadmaps/class/${classId}`;

const CREATE_ROADMAP_API = `${BASE_HTTP}/api/learning-roadmaps`;

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

interface Roadmap {
  id: number;
  title: string;
  description: string;
  fileRecord: FileRecord | null;
  backgroundImage: string;
  iconImage: string;
  children: Roadmap[];
  roadmapIndex: number;
  createdBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

interface RoadmapPosition {
  [key: number]: { x: number; y: number };
}

export default function LearningRoadmapPage({
  classId,
}: {
  classId: string;
}) {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Set<number>>(
    new Set()
  );
  const [positions, setPositions] = useState<RoadmapPosition>({});
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFilePath, setFormFilePath] = useState("");
  const [formBackgroundImage, setFormBackgroundImage] = useState("");
  const [formIconImage, setFormIconImage] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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

  const fetchRoadmaps = useCallback(
    async (token: string, id: string) => {
      try {
        const response = await fetch(ROADMAPS_API(id), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data: ApiResponse<Roadmap[]> = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(
            data?.message || "Không thể tải lộ trình học tập. Vui lòng thử lại."
          );
        }

        const fetchedRoadmaps = data.result || [];
        setRoadmaps(fetchedRoadmaps);

        // Initialize positions for roadmaps
        const initialPositions: RoadmapPosition = {};
        let primaryY = 100;
        fetchedRoadmaps.forEach((roadmap, index) => {
          initialPositions[roadmap.id] = {
            x: 100 + index * 350,
            y: primaryY,
          };

          // Position children if expanded
          if (roadmap.children && roadmap.children.length > 0) {
            roadmap.children.forEach((child, childIndex) => {
              initialPositions[child.id] = {
                x: 100 + index * 350 + 50,
                y: primaryY + 250 + childIndex * 200,
              };
            });
          }
        });
        setPositions(initialPositions);
      } catch (err) {
        console.error("Failed to fetch roadmaps:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải lộ trình học tập. Vui lòng thử lại sau."
        );
        setRoadmaps([]);
      }
    },
    []
  );

  useEffect(() => {
    if (authToken && classId) {
      setLoading(true);
      Promise.all([
        fetchClassDetail(authToken, classId),
        fetchRoadmaps(authToken, classId),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [authToken, classId, fetchClassDetail, fetchRoadmaps]);

  const handleAddRoadmap = (parentId: number | null = null) => {
    setParentId(parentId);
    setEditingRoadmap(null);
    setFormTitle("");
    setFormDescription("");
    setFormFilePath("");
    setFormBackgroundImage("");
    setFormIconImage("");
    setFormFile(null);
    setShowAddModal(true);
  };

  const handleEditRoadmap = (roadmap: Roadmap) => {
    setEditingRoadmap(roadmap);
    setParentId(null);
    setFormTitle(roadmap.title);
    setFormDescription(roadmap.description);
    setFormFilePath(roadmap.fileRecord?.fileUrl || "");
    setFormBackgroundImage(roadmap.backgroundImage);
    setFormIconImage(roadmap.iconImage);
    setFormFile(null);
    setShowAddModal(true);
  };

  const handleSaveRoadmap = async () => {
    if (!authToken) return;
    if (!formTitle.trim()) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("classId", classId);
      formData.append("title", formTitle.trim());
      formData.append("description", formDescription.trim() || "");
      if (formFilePath.trim()) {
        formData.append("filePath", formFilePath.trim());
      }
      if (formBackgroundImage.trim()) {
        formData.append("backgroundImage", formBackgroundImage.trim());
      }
      if (formIconImage.trim()) {
        formData.append("iconImage", formIconImage.trim());
      }
      if (formFile) {
        formData.append("file", formFile);
      }
      if (parentId !== null) {
        formData.append("parentId", parentId.toString());
      }

      const response = await fetch(CREATE_ROADMAP_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể tạo lộ trình học tập.");
      }

      await fetchRoadmaps(authToken, classId);
      setShowAddModal(false);
      resetForm();
      alert("Tạo lộ trình học tập thành công!");
    } catch (err) {
      console.error("Failed to create roadmap:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể tạo lộ trình học tập. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoadmap = async (id: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc chắn muốn xóa lộ trình học tập này?")) {
      return;
    }

    // TODO: Implement delete API call
    alert("Chức năng xóa đang được phát triển");
  };

  const handleExpand = (id: number) => {
    setExpandedRoadmaps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePositionChange = (id: number, position: { x: number; y: number }) => {
    setPositions((prev) => ({
      ...prev,
      [id]: position,
    }));
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormFilePath("");
    setFormBackgroundImage("");
    setFormIconImage("");
    setFormFile(null);
    setParentId(null);
    setEditingRoadmap(null);
  };

  // Calculate arrow positions
  const getArrowPath = (
    parentPos: { x: number; y: number },
    childPos: { x: number; y: number }
  ): string => {
    const startX = parentPos.x + 160; // Center of parent (320/2)
    const startY = parentPos.y + 200; // Bottom of parent
    const endX = childPos.x + 128; // Center of child (256/2)
    const endY = childPos.y; // Top of child

    const midY = startY + (endY - startY) / 2;

    return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50">
      <Navbar />

      <div className="relative flex-1 pt-16">
        <section className="mx-auto w-full max-w-[1920px] px-6 pb-16 pt-8 lg:px-8">
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
            <span className="text-slate-900 font-semibold">Lộ trình học tập</span>
          </motion.nav>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Lộ trình học tập
              </h1>
              <p className="text-slate-600">
                Quản lý và xây dựng lộ trình học tập cho lớp học
              </p>
            </div>
            <button
              onClick={() => handleAddRoadmap(null)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Thêm lộ trình chính
            </button>
          </motion.div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Roadmap Canvas */}
          <div
            ref={containerRef}
            className="relative w-full min-h-[800px] bg-white/50 rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            style={{ height: "calc(100vh - 300px)" }}
          >
            {/* SVG for Arrows */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3, 0 6"
                    fill="#8b5cf6"
                    opacity="0.6"
                  />
                </marker>
              </defs>
              {roadmaps.map((roadmap) => {
                if (!expandedRoadmaps.has(roadmap.id)) return null;
                const parentPos = positions[roadmap.id];
                if (!parentPos) return null;

                return roadmap.children.map((child) => {
                  const childPos = positions[child.id];
                  if (!childPos) return null;

                  return (
                    <path
                      key={`${roadmap.id}-${child.id}`}
                      d={getArrowPath(parentPos, childPos)}
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      opacity="0.6"
                      className="drop-shadow-sm"
                    />
                  );
                });
              })}
            </svg>

            {/* Roadmap Nodes */}
            <div className="relative z-10">
              {roadmaps.map((roadmap) => {
                const pos = positions[roadmap.id] || { x: 0, y: 0 };
                return (
                  <div key={roadmap.id}>
                    <PrimaryRoadmap
                      roadmap={roadmap}
                      onAddChild={handleAddRoadmap}
                      onEdit={handleEditRoadmap}
                      onDelete={handleDeleteRoadmap}
                      onExpand={handleExpand}
                      isExpanded={expandedRoadmaps.has(roadmap.id)}
                      position={pos}
                      onPositionChange={handlePositionChange}
                      isDragging={draggingId === roadmap.id}
                      onDragStart={() => setDraggingId(roadmap.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />

                    {/* Render Children */}
                    {expandedRoadmaps.has(roadmap.id) &&
                      roadmap.children.map((child) => {
                        const childPos = positions[child.id] || {
                          x: pos.x + 50,
                          y: pos.y + 250,
                        };
                        return (
                          <ChildRoadmap
                            key={child.id}
                            roadmap={child}
                            parentId={roadmap.id}
                            onAddChild={handleAddRoadmap}
                            onEdit={handleEditRoadmap}
                            onDelete={handleDeleteRoadmap}
                            position={childPos}
                            onPositionChange={handlePositionChange}
                            isDragging={draggingId === child.id}
                            onDragStart={() => setDraggingId(child.id)}
                            onDragEnd={() => setDraggingId(null)}
                          />
                        );
                      })}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {roadmaps.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-12 h-12 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Chưa có lộ trình học tập
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Bắt đầu xây dựng lộ trình học tập cho lớp học của bạn
                  </p>
                  <button
                    onClick={() => handleAddRoadmap(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm lộ trình đầu tiên
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />

      {/* Add/Edit Roadmap Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
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
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900 pr-12">
                  {editingRoadmap
                    ? "Chỉnh sửa lộ trình học tập"
                    : parentId
                    ? "Thêm nhánh con"
                    : "Thêm lộ trình học tập mới"}
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
                      placeholder="Nhập tiêu đề lộ trình"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Nhập mô tả lộ trình"
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Hình nền (URL)
                    </label>
                    <input
                      type="text"
                      value={formBackgroundImage}
                      onChange={(e) => setFormBackgroundImage(e.target.value)}
                      placeholder="https://example.com/background.jpg"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Icon (URL)
                    </label>
                    <input
                      type="text"
                      value={formIconImage}
                      onChange={(e) => setFormIconImage(e.target.value)}
                      placeholder="https://example.com/icon.jpg"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      File (tùy chọn)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-violet-400 transition-colors">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormFile(file);
                          }
                        }}
                        className="hidden"
                        id="roadmap-file-input"
                      />
                      <label
                        htmlFor="roadmap-file-input"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {formFile ? formFile.name : "Click để chọn file"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveRoadmap}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

