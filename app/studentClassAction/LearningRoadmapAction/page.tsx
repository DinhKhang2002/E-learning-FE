"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  BookOpen,
  Layout,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link"; 
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StudentTimelineItem from "./components/StudentTimelineItem";
import StudentChildCard from "./components/StudentChildCard";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const CLASS_DETAIL_API = (classId: string | number) => `${BASE_HTTP}/api/classes/${classId}`;
const ROADMAPS_API = (classId: string | number) => `${BASE_HTTP}/api/learning-roadmaps/class/${classId}`;
const GET_FILE_API = (fileUrl: string) => `${BASE_HTTP}/api/files/get?fileUrl=${encodeURIComponent(fileUrl)}`;

// --- INTERFACES ---
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

export default function LearningRoadmapActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");
  
  // Data State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  
  // UI State
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    if (!classId) {
      router.push("/studentClassPage");
      return;
    }
    
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
        setIsInitialLoading(false);
      }
    };

    fetchAllData();
  }, [classId, router]);

  // 2. Logic xử lý dữ liệu Client-side
  const selectedRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);

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
                    <p className="text-slate-500">{classData?.description || "Xem lộ trình học tập"}</p>
                </div>
            </div>
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] items-start">
            
            {/* LEFT SIDEBAR: Static List */}
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
                                <StudentTimelineItem 
                                    key={roadmap.id}
                                    roadmap={roadmap}
                                    index={index}
                                    isActive={selectedRoadmapId === roadmap.id}
                                    isLast={index === roadmaps.length - 1}
                                    onClick={() => setSelectedRoadmapId(roadmap.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT CONTENT: Dynamic Content */}
            <div className="flex-1 w-full">
                <AnimatePresence mode="wait">
                    {selectedRoadmap ? (
                        <motion.div 
                            key={selectedRoadmap.id}
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
                            </div>

                            {/* Children List */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Danh sách bài học</h3>
                                </div>

                                {!selectedRoadmap.children || selectedRoadmap.children.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                            <BookOpen className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Chưa có bài học nào trong chương này</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {selectedRoadmap.children.map((child, index) => (
                                            <StudentChildCard 
                                                key={child.id}
                                                roadmap={child}
                                                index={index}
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
