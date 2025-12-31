"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Users, GraduationCap, Mail, Phone, MapPin, 
  UserCircle, BookOpen, Loader2, Eye, Edit, Trash2, Plus, 
  MoreVertical, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// --- Interfaces ---
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  address: string | null;
  gender: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  primarySubject: string | null;
  avatar: string | null;
  dob: string | null;
}

type TabType = "ALL" | "TEACHER" | "STUDENT";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  // --- API Handlers ---
  
  const fetchUsers = useCallback(async (query = "", role: TabType = "ALL") => {
    setLoading(true);
    try {
      const token = window.localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      
      if (query) params.append("commonSearch", query);
      if (role !== "ALL") params.append("role", role);

      const url = `http://localhost:8080/education/api/users?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.code === 1000) {
        setUsers(data.result.content);
        setTotalElements(data.result.totalElements);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(searchQuery, activeTab);
  }, [activeTab]); // Fetch lại khi đổi tab

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery, activeTab);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      const token = window.localStorage.getItem("accessToken");
      const response = await fetch(`http://localhost:8080/education/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        alert("Xóa thành công!");
        fetchUsers(searchQuery, activeTab);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // --- Sub-Components ---

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="relative">
            <img 
              src={user.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"} 
              alt={user.username} 
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-50"
            />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
              user.role === 'ADMIN' ? 'bg-red-500' : user.role === 'TEACHER' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}>
              {user.role === 'ADMIN' ? <ShieldCheck size={10} color="white" /> : <Users size={10} color="white" />}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={() => alert(`Xem chi tiết ID: ${user.id}`)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye size={18} />
            </button>
            <button 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={() => handleDelete(user.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-lg truncate">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-slate-400 font-medium mb-3 italic">@{user.username}</p>
          
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Mail size={14} className="text-slate-400" />
              </div>
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <BookOpen size={14} className="text-slate-400" />
              </div>
              <span className="font-medium text-indigo-600">
                {user.primarySubject?.replace('_', ' ') || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
          user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 
          user.role === 'TEACHER' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {user.role}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />

      <main className="flex-grow pt-28 pb-12 px-4 md:px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hệ thống Quản trị</h1>
              <p className="text-slate-500 mt-2 text-lg">Quản lý tài khoản, phân quyền và dữ liệu người dùng.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleSearchSubmit} className="relative group">
                <input
                  type="text"
                  placeholder="Tìm tên, email..."
                  className="w-full sm:w-72 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <button type="submit" className="hidden">Search</button>
              </form>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                <Plus size={20} /> Thêm mới
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
            {[
              { id: "ALL", label: "Tất cả", icon: Users, count: activeTab === "ALL" ? totalElements : null },
              { id: "TEACHER", label: "Giáo viên", icon: ShieldCheck, count: activeTab === "TEACHER" ? totalElements : null },
              { id: "STUDENT", label: "Học sinh", icon: GraduationCap, count: activeTab === "STUDENT" ? totalElements : null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md text-[10px]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* User Grid Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
              </div>
              <p className="mt-6 text-slate-500 font-bold animate-pulse">Đang tải danh sách người dùng...</p>
            </div>
          ) : (
            <>
              {users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {users.map(user => <UserCard key={user.id} user={user} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Không tìm thấy kết quả</h3>
                  <p className="text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}