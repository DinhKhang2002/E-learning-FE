"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  GraduationCap,
  FileText,
  TrendingUp,
  Award,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Trophy,
  Target,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DashboardData {
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  classId: number;
  className: string;
  semester: string;
  presentNumber: number;
  absenceNumber: number;
  lateNumber: number;
  attendanceRate: number;
  avgExamScore: number;
  examsCompleted: number;
  avgAssignmentGrade: number;
  assignmentsSubmitted: number;
  totalAssignmentsInClass: number;
  assignmentCompletionRatio: string;
  overallScore: number;
}

export default function ClassDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"exam" | "assignment" | "overall" | "attendance">("exam");

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) {
        setError("Không tìm thấy ID lớp học");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`http://localhost:8080/education/api/dashboard/class/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.code === 1000) setData(result.result);
        else throw new Error(result.message);
      } catch (err) {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const stats = useMemo(() => {
    if (!data.length) return null;

    const getTopBottom = (key: keyof DashboardData) => {
      const sorted = [...data].sort((a, b) => (b[key] as number) - (a[key] as number));
      return {
        top: sorted.slice(0, 3),
        bottom: sorted.slice(-3).reverse(),
        all: sorted.map(s => ({ name: s.studentName, value: Number(Number(s[key]).toFixed(2)) }))
      };
    };

    return {
      exam: getTopBottom("avgExamScore"),
      assignment: getTopBottom("avgAssignmentGrade"),
      overall: getTopBottom("overallScore"),
      attendanceData: data.map(s => ({
        name: s.studentName,
        "Có mặt": s.presentNumber,
        "Đi muộn": s.lateNumber,
        "Vắng mặt": s.absenceNumber,
        rate: s.attendanceRate
      })).sort((a, b) => a.rate - b.rate), // Sắp xếp ai chuyên cần thấp nhất lên đầu biểu đồ
      summary: {
        totalStudents: data.length,
        totalExams: data[0].examsCompleted,
        totalAssignments: data[0].totalAssignmentsInClass,
        avgClassScore: (data.reduce((acc, curr) => acc + curr.overallScore, 0) / data.length).toFixed(2)
      }
    };
  }, [data]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
      <p className="text-slate-500 font-medium">Đang xử lý dữ liệu...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      {/* 1. Sửa lỗi Navbar đè: Thêm pt-24 để cách top một khoảng an toàn */}
      <main className="container mx-auto px-4 pt-28 pb-12 max-w-7xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-3 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
              Quay lại danh sách lớp
            </button>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Thống kê lớp <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{data[0]?.className}</span>
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
               Học kỳ {data[0]?.semester} • {stats?.summary.totalStudents} học sinh trong danh sách
            </p>
          </motion.div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-4">
            <header className="flex gap-4">
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Học sinh</p>
                    <p className="text-xl font-bold text-slate-800">{stats?.summary.totalStudents}</p>
                 </div>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                    <Award className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Điểm TB Lớp</p>
                    <p className="text-xl font-bold text-slate-800">{stats?.summary.avgClassScore}</p>
                 </div>
              </div>
            </header>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={<GraduationCap />} label="Kỳ thi đã hoàn thành" value={stats?.summary.totalExams} color="blue" />
          <StatCard icon={<FileText />} label="Bài tập đã giao" value={stats?.summary.totalAssignments} color="purple" />
          <StatCard icon={<TrendingUp />} label="Tỉ lệ chuyên cần trung bình" value={`${data[0]?.attendanceRate}%`} color="emerald" />
        </div>

        {/* Main Dashboard Tabs */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-100 p-3 bg-slate-50/50 gap-2">
            <TabBtn active={activeTab === 'exam'} onClick={() => setActiveTab('exam')} icon={<Trophy className="w-4 h-4" />} label="Điểm Thi" />
            <TabBtn active={activeTab === 'assignment'} onClick={() => setActiveTab('assignment')} icon={<FileText className="w-4 h-4" />} label="Điểm Bài Tập" />
            <TabBtn active={activeTab === 'overall'} onClick={() => setActiveTab('overall')} icon={<Target className="w-4 h-4" />} label="Tổng Kết" />
            <TabBtn active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Users className="w-4 h-4" />} label="Điểm Danh" />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab !== 'attendance' ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-12"
                >
                  <div className="lg:col-span-2">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-slate-800">Biểu đồ phổ điểm</h3>
                      <p className="text-slate-500">Trực quan hóa sự phân bố điểm số của toàn bộ học sinh trong lớp</p>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.[activeTab].all}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" hide />
                          <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top & Bottom lists */}
                  <div className="flex flex-col gap-8">
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                      <h4 className="flex items-center gap-2 text-emerald-700 font-bold mb-5">
                        <Trophy className="w-5 h-5" /> Top 3 Dẫn Đầu
                      </h4>
                      <div className="space-y-4">
                        {stats?.[activeTab].top.map((s, i) => (
                          <StudentRow key={s.studentId} student={s} rank={i+1} score={Number(s[activeTab === 'exam' ? 'avgExamScore' : activeTab === 'assignment' ? 'avgAssignmentGrade' : 'overallScore'])} />
                        ))}
                      </div>
                    </div>

                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                      <h4 className="flex items-center gap-2 text-rose-700 font-bold mb-5">
                        <AlertCircle className="w-5 h-5" /> Cần Hỗ Trợ
                      </h4>
                      <div className="space-y-4">
                        {stats?.[activeTab].bottom.map((s, i) => (
                          <StudentRow key={s.studentId} student={s} rank={data.length - i} score={Number(s[activeTab === 'exam' ? 'avgExamScore' : activeTab === 'assignment' ? 'avgAssignmentGrade' : 'overallScore'])} isBottom />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="attendance"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Chi tiết chuyên cần</h3>
                      <p className="text-slate-500">Biểu đồ cột chồng thể hiện phân bổ Đi học - Muộn - Vắng của từng cá nhân</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Có mặt
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <span className="w-3 h-3 bg-amber-500 rounded-full"></span> Đi muộn
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <span className="w-3 h-3 bg-rose-500 rounded-full"></span> Vắng mặt
                        </div>
                    </div>
                  </div>

                  {/* 2. Sửa biểu đồ điểm danh thành Stacked Bar Chart */}
                  <div className="h-[600px] w-full overflow-x-auto">
                    <div className="min-w-[800px] h-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.attendanceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0}
                                stroke="#94a3b8"
                                fontSize={11}
                                fontWeight={600}
                            />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="Có mặt" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={35} />
                            <Bar dataKey="Đi muộn" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Vắng mặt" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Sub-components
function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  const colors: any = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200"
  };
  return (
    <motion.div whileHover={{ y: -5 }} className={`bg-gradient-to-br ${colors[color]} p-6 rounded-[2rem] shadow-lg text-white`}>
      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <p className="text-white/80 text-sm font-bold uppercase tracking-wider">{label}</p>
      <p className="text-4xl font-black mt-2 tracking-tight">{value}</p>
    </motion.div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
        active 
          ? "bg-white text-blue-600 shadow-md scale-105" 
          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StudentRow({ student, rank, score, isBottom }: { student: DashboardData, rank: number, score: number, isBottom?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-full ${isBottom ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
          #{rank}
        </div>
        <img src={student.studentAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
        <div>
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{student.studentName}</p>
          <p className="text-[10px] text-slate-400 font-medium">{student.studentEmail}</p>
        </div>
      </div>
      <div className={`text-base font-black px-3 py-1 rounded-lg ${isBottom ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
        {score.toFixed(1)}
      </div>
    </div>
  );
}