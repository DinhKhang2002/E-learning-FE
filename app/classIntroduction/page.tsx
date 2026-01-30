"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle2,
  Hash,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const CLASS_DETAIL_API = (classId: string | number) =>
  `${BASE_HTTP}/api/classes/${classId}`;

interface ClassIntroductionParsed {
  class_id?: number;
  class_name?: string;
  class_code?: string;
  instructor?: string;
  power_by?: string;
  start_date?: string;
  duration_months?: number;
  image_url?: string;
  prerequisites?: string;
  description?: string;
}

interface ClassDetailApi {
  id: number;
  name: string;
  code: string;
  description: string;
  semester: string;
  teacherId: number;
  teacherName: string | null;
  classType: string;
  powerBy: string | null;
  classIntroduction: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  code: number;
  result: T;
  httpStatus: string;
}

function parseClassIntroduction(raw: string | null): ClassIntroductionParsed | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as ClassIntroductionParsed;
    return parsed;
  } catch {
    return null;
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ClassIntroductionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [classData, setClassData] = useState<ClassDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intro = useMemo(() => {
    if (!classData?.classIntroduction) return null;
    return parseClassIntroduction(classData.classIntroduction);
  }, [classData]);

  useEffect(() => {
    const fetchClass = async () => {
      if (!classId) {
        setError("Không tìm thấy ID lớp học");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(CLASS_DETAIL_API(classId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: ApiResponse<ClassDetailApi> = await response.json();
        if (data.code === 1000 && data.result) {
          setClassData(data.result);
        } else {
          throw new Error(data?.message || "Không thể tải thông tin lớp học");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Lỗi kết nối máy chủ"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-sky-600 mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="container mx-auto px-4 pt-28 pb-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-12 text-center"
          >
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {error || "Không tìm thấy lớp học"}
            </h2>
            <button
              onClick={() => router.push("/homePage")}
              className="mt-6 px-6 py-3 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Về trang chủ
            </button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = intro?.class_name ?? classData.name;
  const displayInstructor = intro?.instructor ?? intro?.power_by ?? classData.powerBy ?? classData.teacherName ?? "—";
  const imageUrl = intro?.image_url || null;
  const startDate = intro?.start_date;
  const durationMonths = intro?.duration_months;
  const classCode = intro?.class_code ?? classData.code;
  const prerequisites = intro?.prerequisites;
  const longDescription = intro?.description ?? classData.description;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-4xl">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </motion.button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 bg-white mb-8"
        >
          {imageUrl && (
            <div className="aspect-[21/9] w-full bg-slate-100">
              <img
                src={imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold mb-4">
                  <Hash className="w-3.5 h-3.5" /> {classCode}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <p className="mt-3 text-slate-600 font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Giảng viên: {displayInstructor}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  {startDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      Bắt đầu: {formatDate(startDate)}
                    </span>
                  )}
                  {durationMonths != null && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-500" />
                      Thời lượng: {durationMonths} tháng
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-500" />
                    Học kỳ: {classData.semester}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prerequisites */}
        {prerequisites && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mb-8"
          >
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Điều kiện tiên quyết
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {prerequisites}
              </p>
            </div>
          </motion.section>
        )}

        {/* Description */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              Giới thiệu khóa học
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {longDescription || "Chưa có mô tả chi tiết."}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Meta from API */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mt-8"
        >
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">
              Thông tin lớp
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Mã lớp:</span>
                <span className="ml-2 font-mono font-medium text-slate-800">
                  {classData.code}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Học kỳ:</span>
                <span className="ml-2 font-medium text-slate-800">
                  {classData.semester}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Loại:</span>
                <span className="ml-2 font-medium text-slate-800">
                  {classData.classType === "COURSE" ? "Khóa học" : classData.classType}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Giảng viên (hệ thống):</span>
                <span className="ml-2 font-medium text-slate-800">
                  {classData.teacherName || "—"}
                </span>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
}
