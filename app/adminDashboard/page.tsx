"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Users, GraduationCap, Mail, Phone, MapPin, 
  UserCircle, BookOpen, Loader2, Eye, Edit, Trash2, Plus, 
  ShieldCheck, X, Calendar, User as UserIcon
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

  // State cho Modal
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    gender: "MALE",
    primarySubject: "",
    role: "STUDENT" as "STUDENT" | "TEACHER" | "ADMIN",
    dob: "",
  });

  // --- API Handlers ---

  const getHeaders = () => {
    const token = window.localStorage.getItem("accessToken");
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchUsers = useCallback(async (query = "", role: TabType = "ALL") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("commonSearch", query);
      if (role !== "ALL") params.append("role", role);

      const response = await fetch(`http://localhost:8080/education/api/users?${params.toString()}`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.code === 1000) {
        setUsers(data.result.content);
        setTotalElements(data.result.totalElements);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(searchQuery, activeTab);
  }, [activeTab, fetchUsers]);

  // 1. XỬ LÝ XEM CHI TIẾT
  const handleView = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/education/api/users/${id}`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.code === 1000) {
        setViewUser(data.result);
        setIsViewOpen(true);
      }
    } catch (error) {
      alert("Không thể lấy thông tin chi tiết!");
    }
  };

  // 2. XỬ LÝ CẬP NHẬT
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const confirmUpdate = window.confirm("Có xác nhận cập nhật Thông tin người dùng không?");
    if (!confirmUpdate) return;

    try {
      const response = await fetch(`http://localhost:8080/education/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          username: editUser.username,
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          phoneNumber: editUser.phoneNumber,
          address: editUser.address,
          gender: editUser.gender,
          dob: editUser.dob
        }),
      });
      const data = await response.json();
      if (data.code === 1000) {
        alert("Cập nhật thành công!");
        setIsEditOpen(false);
        fetchUsers(searchQuery, activeTab); // Refresh danh sách
      }
    } catch (error) {
      alert("Cập nhật thất bại!");
    }
  };

  // 3. XỬ LÝ XÓA
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Có xác nhận xóa người dùng không?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:8080/education/api/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.code === 1000) {
        alert("Xóa thành công!");
        fetchUsers(searchQuery, activeTab);
      }
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  // 4. XỬ LÝ TẠO MỚI
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:8080/education/api/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber || null,
          address: newUser.address || null,
          gender: newUser.gender,
          primarySubject: newUser.primarySubject || null,
          role: newUser.role,
          dob: newUser.dob || null,
        }),
      });
      const data = await response.json();
      if (data.code === 1000) {
        alert("Tạo người dùng thành công!");
        setIsCreateOpen(false);
        setNewUser({
          username: "",
          password: "",
          email: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          address: "",
          gender: "MALE",
          primarySubject: "",
          role: "STUDENT",
          dob: "",
        });
        fetchUsers(searchQuery, activeTab);
      } else {
        alert(data.message || "Tạo người dùng thất bại!");
      }
    } catch (error) {
      alert("Tạo người dùng thất bại!");
    }
  };

  // --- Render Components ---

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <img 
            src={user.avatar || "https://www.svgrepo.com/show/452030/avatar-default.svg"} 
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-50"
            alt="avatar"
          />
          <div className="flex gap-1">
            <button onClick={() => handleView(user.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={18} /></button>
            <button onClick={() => { setEditUser(user); setIsEditOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
            <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
          </div>
        </div>
        <h3 className="font-bold text-slate-800 truncate">{user.firstName} {user.lastName}</h3>
        <p className="text-xs text-slate-400 mb-3 italic">@{user.username}</p>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2 truncate"><Mail size={14} className="text-slate-400" /> {user.email}</div>
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-slate-400" /> <span className="text-indigo-600 font-medium">{user.primarySubject || "N/A"}</span></div>
        </div>
      </div>
      <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : user.role === 'TEACHER' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{user.role}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 md:px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header & Search */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Console</h1>
              <p className="text-slate-500 mt-2">Quản lý và cập nhật thông tin thành viên hệ thống.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); fetchUsers(searchQuery, activeTab); }} className="relative group">
              <input type="text" placeholder="Tìm kiếm người dùng..." className="w-full sm:w-80 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            </form>
          </div>

          {/* Tabs & Create Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
              {(["ALL", "TEACHER", "STUDENT"] as TabType[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {tab === "ALL" ? "Tất cả" : tab === "TEACHER" ? "Giáo viên" : "Học sinh"}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
            >
              <Plus size={18} />
              Tạo Người dùng mới
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {users.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL XEM CHI TIẾT --- */}
      {isViewOpen && viewUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600">
              <button onClick={() => setIsViewOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"><X size={20}/></button>
              <div className="absolute -bottom-12 left-8">
                <img src={viewUser.avatar || ""} className="w-24 h-24 rounded-2xl border-4 border-white object-cover bg-white" alt="avatar" />
              </div>
            </div>
            <div className="pt-16 p-8 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{viewUser.firstName} {viewUser.lastName}</h2>
                <p className="text-indigo-600 font-medium">@{viewUser.username} • {viewUser.role}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm border-t pt-4">
                <div className="flex items-center gap-3 text-slate-600"><Mail size={16}/> {viewUser.email}</div>
                <div className="flex items-center gap-3 text-slate-600"><Phone size={16}/> {viewUser.phoneNumber || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-3 text-slate-600"><MapPin size={16}/> {viewUser.address || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-3 text-slate-600"><Calendar size={16}/> {viewUser.dob || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-3 text-slate-600"><UserIcon size={16}/> {viewUser.gender}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CHỈNH SỬA --- */}
      {isEditOpen && editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Cập nhật thông tin</h2>
              <button onClick={() => setIsEditOpen(false)}><X size={24} className="text-slate-400"/></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Họ</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.firstName} onChange={e => setEditUser({...editUser, firstName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.lastName} onChange={e => setEditUser({...editUser, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.phoneNumber || ""} onChange={e => setEditUser({...editUser, phoneNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Địa chỉ</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.address || ""} onChange={e => setEditUser({...editUser, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Giới tính</label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.gender || "MALE"} onChange={e => setEditUser({...editUser, gender: e.target.value})}>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ngày sinh</label>
                  <input type="date" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editUser.dob || ""} onChange={e => setEditUser({...editUser, dob: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4">
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TẠO MỚI --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Tạo người dùng mới</h2>
              <button onClick={() => setIsCreateOpen(false)}><X size={24} className="text-slate-400"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên đăng nhập *</label>
                  <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mật khẩu *</label>
                  <input type="password" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email *</label>
                <input type="email" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Họ *</label>
                  <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tên *</label>
                  <input type="text" required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.phoneNumber} onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vai trò *</label>
                  <select required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as "STUDENT" | "TEACHER" | "ADMIN"})}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Địa chỉ</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Giới tính *</label>
                  <select required className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ngày sinh</label>
                  <input type="date" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.dob} onChange={e => setNewUser({...newUser, dob: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Môn học chính</label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={newUser.primarySubject} onChange={e => setNewUser({...newUser, primarySubject: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4">
                Tạo người dùng
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}