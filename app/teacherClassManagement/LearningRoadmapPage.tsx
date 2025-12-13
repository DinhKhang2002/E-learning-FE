"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Plus,
  Loader2,
  X,
  BookOpen,
  Layout,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TimelineItem from "./components/TimelineItem";
import ChildCard from "./components/ChildCard";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const CLASS_DETAIL_API = (classId: string | number) => `${BASE_HTTP}/api/classes/${classId}`;
const ROADMAPS_API = (classId: string | number) => `${BASE_HTTP}/api/learning-roadmaps/class/${classId}`;
const CREATE_ROADMAP_API = `${BASE_HTTP}/api/learning-roadmaps`;
const UPDATE_ROADMAP_API = (id: number) => `${BASE_HTTP}/api/learning-roadmaps/${id}`;
const DELETE_ROADMAP_API = (id: number) => `${BASE_HTTP}/api/learning-roadmaps/${id}`;
const GET_FILE_API = (fileUrl: string) => `${BASE_HTTP}/api/files/get?fileUrl=${encodeURIComponent(fileUrl)}`;

// --- INTERFACES (Giữ nguyên) ---
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

export default function LearningRoadmapPage({ classId }: { classId: string }) {
  const router = useRouter();
  
  // Data State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  
  // UI State
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Chỉ dùng cho lần load đầu tiên
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBackgroundImage, setFormBackgroundImage] = useState("");
  const [formIconImage, setFormIconImage] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File View Modal State
  const [showFileModal, setShowFileModal] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>("");
  const [viewingFileType, setViewingFileType] = useState<string>("");
  const [fileBlobUrl, setFileBlobUrl] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // 1. Check Auth & Load Data Once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    setAuthToken(token);

    // Fetch Data Function
    const fetchAllData = async () => {
      try {
        setIsInitialLoading(true);
        
        // Parallel Fetch: Class Info + Roadmaps
        const [classRes, roadmapRes] = await Promise.all([
          fetch(CLASS_DETAIL_API(classId), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(ROADMAPS_API(classId), { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const classJson: ApiResponse<ClassData> = await classRes.json();
        const roadmapJson: ApiResponse<Roadmap[]> = await roadmapRes.json();

        if (classJson.code === 1000 && classJson.result) {
          setClassData(classJson.result);
        }

        if (roadmapJson.code === 1000 && Array.isArray(roadmapJson.result)) {
          const sortedRoadmaps = roadmapJson.result.sort((a, b) => 
            (a.roadmapIndex || a.id) - (b.roadmapIndex || b.id)
          );
          setRoadmaps(sortedRoadmaps);
          
          // Tự động chọn roadmap đầu tiên nếu có dữ liệu
          if (sortedRoadmaps.length > 0) {
            setSelectedRoadmapId(sortedRoadmaps[0].id);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu lớp học.");
      } finally {
        setIsInitialLoading(false); // Tắt loading toàn trang
      }
    };

    fetchAllData();
  }, [classId, router]);

  // 2. Logic xử lý dữ liệu Client-side (KHÔNG GỌI API)
  // Tìm roadmap đang được chọn từ mảng `roadmaps` đã fetch từ trước
  const selectedRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);

  // 3. Hàm Refresh dữ liệu (Chỉ gọi khi Thêm/Sửa/Xóa thành công)
  const refreshRoadmaps = async () => {
    if (!authToken) return;
    try {
      const response = await fetch(ROADMAPS_API(classId), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data: ApiResponse<Roadmap[]> = await response.json();
      if (data.code === 1000 && Array.isArray(data.result)) {
        const sorted = data.result.sort((a, b) => (a.roadmapIndex || a.id) - (b.roadmapIndex || b.id));
        setRoadmaps(sorted);
        // Lưu ý: Không reset selectedRoadmapId để người dùng không bị văng ra trang đầu
      }
    } catch (e) { console.error(e); }
  };

  // --- HANDLERS ---
  const handleAddRoadmap = (pid: number | null = null) => {
    setParentId(pid);
    setEditingRoadmap(null);
    setFormTitle(""); setFormDescription(""); setFormBackgroundImage(""); setFormIconImage("");
    setFormFile(null);
    setShowAddModal(true);
  };

  const handleEditRoadmap = (roadmap: Roadmap) => {
    setEditingRoadmap(roadmap);
    setParentId(null);
    setFormTitle(roadmap.title); setFormDescription(roadmap.description);
    setFormBackgroundImage(roadmap.backgroundImage); setFormIconImage(roadmap.iconImage);
    setFormFile(null);
    setShowAddModal(true);
  };

  const handleSaveRoadmap = async () => {
    if (!authToken || !formTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("classId", classId);
      formData.append("title", formTitle);
      formData.append("description", formDescription);
      formData.append("backgroundImage", formBackgroundImage);
      formData.append("iconImage", formIconImage);
      
      // Nếu có parentId, thêm vào formData (để tạo bài học con)
      if (parentId !== null) {
        formData.append("parentId", parentId.toString());
      }
      
      // Thêm file nếu có
      if (formFile) {
        formData.append("file", formFile);
      }
      
      // Phân biệt giữa CREATE và UPDATE
      const isUpdate = editingRoadmap !== null;
      const apiUrl = isUpdate ? UPDATE_ROADMAP_API(editingRoadmap.id) : CREATE_ROADMAP_API;
      const method = isUpdate ? "PUT" : "POST";
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });
      
      const data: ApiResponse<Roadmap> = await response.json();
      
      if (data.code === 1000) {
        await refreshRoadmaps();
        setShowAddModal(false);
        // Tự động chọn roadmap vừa tạo nếu là chương mới (không phải update)
        if (!isUpdate && parentId === null && data.result) {
          setSelectedRoadmapId(data.result.id);
        }
        // Nếu đang update roadmap đang được chọn, giữ nguyên selection
        if (isUpdate && editingRoadmap && selectedRoadmapId === editingRoadmap.id) {
          setSelectedRoadmapId(editingRoadmap.id);
        }
      } else {
        alert(data.message || `Có lỗi xảy ra khi ${isUpdate ? "cập nhật" : "tạo"} roadmap`);
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi kết nối đến server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoadmap = async (id: number) => {
    if (!authToken) return;
    if (!confirm("Bạn có chắc muốn xóa roadmap này? Hành động này không thể hoàn tác.")) return;
    
    try {
      const response = await fetch(DELETE_ROADMAP_API(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      const data: ApiResponse<any> = await response.json();
      
      if (data.code === 1000) {
        // Nếu xóa roadmap đang được chọn, reset selection
        if (selectedRoadmapId === id) {
          setSelectedRoadmapId(null);
        }
        await refreshRoadmaps();
        // Tự động chọn roadmap đầu tiên nếu còn roadmap
        const updatedRoadmaps = roadmaps.filter(r => r.id !== id);
        if (updatedRoadmaps.length > 0 && selectedRoadmapId === id) {
          setSelectedRoadmapId(updatedRoadmaps[0].id);
        }
      } else {
        alert(data.message || "Có lỗi xảy ra khi xóa roadmap");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi kết nối đến server");
    }
  };

  const handleViewFile = async (roadmap: Roadmap) => {
    if (!authToken || !roadmap.fileRecord?.fileUrl) {
      alert("Không có file đính kèm cho bài học này");
      return;
    }

    setIsLoadingFile(true);
    setViewingFileUrl(roadmap.fileRecord.fileUrl);
    setViewingFileName(roadmap.fileRecord.fileName);
    setViewingFileType(roadmap.fileRecord.fileType);
    setShowFileModal(true);

    try {
      const response = await fetch(GET_FILE_API(roadmap.fileRecord.fileUrl), {
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


  // --- RENDER ---
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="flex-1 pt-20 pb-10 px-4 md:px-8 max-w-[1920px] mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Link href="/homePage" className="hover:text-violet-600 transition">E-Learning</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-slate-900">Lộ trình học tập</span>
            </nav>
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{classData?.name || "Lớp học"}</h1>
                    <p className="text-slate-500">{classData?.description || "Quản lý lộ trình học tập"}</p>
                </div>
                <button
                    onClick={() => handleAddRoadmap(null)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition shadow-lg shadow-violet-200"
                >
                    <Plus className="w-5 h-5" />
                    Thêm chương mới
                </button>
            </div>
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] items-start">
            
            {/* LEFT SIDEBAR: Static List (Không reload khi click) */}
            <div className="w-full lg:w-[350px] flex-shrink-0 sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-h-[calc(100vh-150px)] overflow-y-auto custom-scrollbar">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 pb-2">
                        <Layout className="w-5 h-5 text-violet-600" />
                        Mục lục chương
                    </h2>
                    
                    <div className="relative pl-2 space-y-1">
                        {roadmaps.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">Chưa có lộ trình</div>
                        ) : (
                            roadmaps.map((roadmap, index) => (
                                <TimelineItem 
                                    key={roadmap.id}
                                    roadmap={roadmap}
                                    index={index}
                                    isActive={selectedRoadmapId === roadmap.id}
                                    isLast={index === roadmaps.length - 1}
                                    onClick={() => setSelectedRoadmapId(roadmap.id)}
                                    onEdit={handleEditRoadmap}
                                    onDelete={handleDeleteRoadmap}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT CONTENT: Dynamic Content (Animate on change) */}
            <div className="flex-1 w-full">
                <AnimatePresence mode="wait">
                    {selectedRoadmap ? (
                        <motion.div 
                            key={selectedRoadmap.id} // Key change triggers animation
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[600px] flex flex-col"
                        >
                            {/* Chapter Info */}
                            <div className="flex flex-col md:flex-row items-start justify-between mb-8 pb-6 border-b border-slate-100 gap-6">
                                <div className="flex gap-6 items-start">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0 bg-slate-100 border border-slate-200">
                                        {selectedRoadmap.backgroundImage ? (
                                            <img src={selectedRoadmap.backgroundImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-violet-50 text-violet-600">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Chương {selectedRoadmap.roadmapIndex ?? roadmaps.findIndex(r => r.id === selectedRoadmapId) + 1}
                                            </span>
                                            <span className="text-slate-400 text-sm">
                                                {selectedRoadmap.children?.length || 0} bài học
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedRoadmap.title}</h2>
                                        <p className="text-slate-600 leading-relaxed">{selectedRoadmap.description}</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 self-start">
                                    <button 
                                        onClick={() => handleEditRoadmap(selectedRoadmap)}
                                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Children List (Already loaded) */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Danh sách bài học</h3>
                                    <button 
                                        onClick={() => handleAddRoadmap(selectedRoadmap.id)}
                                        className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-lg transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm bài học
                                    </button>
                                </div>

                                {!selectedRoadmap.children || selectedRoadmap.children.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                            <Plus className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Chưa có bài học nào trong chương này</p>
                                        <button 
                                            onClick={() => handleAddRoadmap(selectedRoadmap.id)}
                                            className="mt-4 text-violet-600 hover:underline text-sm font-medium"
                                        >
                                            Tạo bài học đầu tiên
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {selectedRoadmap.children.map((child, index) => (
                                            <ChildCard 
                                                key={child.id}
                                                roadmap={child}
                                                index={index}
                                                onEdit={handleEditRoadmap}
                                                onDelete={handleDeleteRoadmap}
                                                onViewFile={handleViewFile}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 min-h-[400px]">
                            Chọn một chương bên trái để xem chi tiết
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>
      
      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingRoadmap ? "Chỉnh sửa nội dung" : parentId ? "Thêm bài học mới" : "Thêm chương mới"}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề</label>
                    <input 
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition" 
                      placeholder="Nhập tiêu đề..." 
                      value={formTitle} 
                      onChange={e => setFormTitle(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                    <textarea 
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition" 
                      placeholder="Nhập mô tả..." 
                      rows={3}
                      value={formDescription} 
                      onChange={e => setFormDescription(e.target.value)} 
                    />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link ảnh nền</label>
                            <input 
                                className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none" 
                                placeholder="https://..." 
                                value={formBackgroundImage} 
                                onChange={e => setFormBackgroundImage(e.target.value)} 
                            />
                       </div>
                       <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link icon</label>
                            <input 
                                className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none" 
                                placeholder="https://..." 
                                value={formIconImage} 
                                onChange={e => setFormIconImage(e.target.value)} 
                            />
                       </div>
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">File đính kèm (tùy chọn)</label>
                    <input 
                      type="file"
                      className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition" 
                      onChange={e => setFormFile(e.target.files?.[0] || null)} 
                    />
                    {formFile && (
                      <p className="mt-2 text-sm text-slate-500">Đã chọn: {formFile.name}</p>
                    )}
                  </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                  <button 
                    onClick={() => setShowAddModal(false)} 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSaveRoadmap} 
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu thay đổi
                  </button>
              </div>
            </motion.div>
          </div>
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
                    <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
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
                          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition"
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
                          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition"
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