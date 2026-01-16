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
  Cell,
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
  UserMinus,
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

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
};

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

  // Logic xử lý dữ liệu Top/Bottom
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
      attendance: [...data]
        .sort((a, b) => (b.absenceNumber + b.lateNumber) - (a.absenceNumber + a.lateNumber))
        .slice(0, 5),
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
      <p className="text-slate-500 font-medium">Đang phân tích dữ liệu lớp học...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
            </button>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Dashboard Lớp <span className="text-blue-600">{data[0]?.className}</span>
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Target className="w-4 h-4" /> Học kỳ: {data[0]?.semester} • {stats?.summary.totalStudents} Sinh viên
            </p>
          </motion.div>

          <div className="flex gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng học sinh</p>
                <p className="text-2xl font-black text-slate-800">{stats?.summary.totalStudents}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Điểm TB Lớp</p>
                <p className="text-2xl font-black text-slate-800">{stats?.summary.avgClassScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon={<GraduationCap />} label="Kỳ thi đã tổ chức" value={stats?.summary.totalExams} color="blue" />
          <StatCard icon={<FileText />} label="Bài tập đã giao" value={stats?.summary.totalAssignments} color="purple" />
          <StatCard icon={<TrendingUp />} label="Tỉ lệ chuyên cần" value={`${data[0]?.attendanceRate}%`} color="emerald" />
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
            <TabBtn active={activeTab === 'exam'} onClick={() => setActiveTab('exam')} icon={<Trophy />} label="Điểm Thi" />
            <TabBtn active={activeTab === 'assignment'} onClick={() => setActiveTab('assignment')} icon={<FileText />} label="Bài Tập" />
            <TabBtn active={activeTab === 'overall'} onClick={() => setActiveTab('overall')} icon={<Target />} label="Tổng Kết" />
            <TabBtn active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Users />} label="Điểm Danh" />
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab !== 'attendance' ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                >
                  {/* Left: Line Chart for all students */}
                  <div className="lg:col-span-2">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Phổ điểm toàn lớp</h3>
                      <p className="text-slate-500 text-sm">Biểu đồ thể hiện sự phân hóa năng lực học sinh</p>
                    </div>
                    <div className="h-[400px] w-full">
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
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Top & Bottom lists */}
                  <div className="space-y-8">
                    <div>
                      <h4 className="flex items-center gap-2 text-emerald-600 font-bold mb-4">
                        <Trophy className="w-5 h-5" /> Top 3 Xuất Sắc
                      </h4>
                      <div className="space-y-3">
                        {stats?.[activeTab].top.map((s, i) => (
                          <StudentRow key={s.studentId} student={s} rank={i+1} score={Number(s[activeTab === 'exam' ? 'avgExamScore' : activeTab === 'assignment' ? 'avgAssignmentGrade' : 'overallScore'])} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-rose-500 font-bold mb-4">
                        <AlertCircle className="w-5 h-5" /> Cần Chú Ý
                      </h4>
                      <div className="space-y-3 opacity-80">
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
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-[500px]"
                >
                   <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Học sinh vắng/muộn nhiều nhất</h3>
                      <p className="text-slate-500 text-sm">Danh sách học sinh có nguy cơ không đủ điều kiện dự thi</p>
                    </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.attendance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" />
                      <YAxis dataKey="studentName" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="absenceNumber" name="Nghỉ học" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="lateNumber" name="Đi muộn" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
  const colorMap: any = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    emerald: "bg-emerald-600"
  };
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${colorMap[color]} opacity-[0.03] rounded-bl-full transition-all group-hover:scale-110`} />
      <div className={`w-12 h-12 rounded-xl ${colorMap[color]} text-white flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
    </motion.div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
        active 
          ? "bg-white text-blue-600 shadow-sm" 
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StudentRow({ student, rank, score, isBottom }: { student: DashboardData, rank: number, score: number, isBottom?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${isBottom ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {rank}
        </div>
        <img src={student.studentAvatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
        <div>
          <p className="text-sm font-bold text-slate-800">{student.studentName}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{student.studentEmail}</p>
        </div>
      </div>
      <div className={`text-lg font-black ${isBottom ? 'text-rose-500' : 'text-emerald-600'}`}>
        {score.toFixed(1)}
      </div>
    </div>
  );
}