"use client";

import {
  BookOpen,
  CheckSquare,
  FileText,
  GraduationCap,
  PenTool,
  Star,
  Users,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const managementItems = [
  {
    id: 1,
    label: "Quản lý học sinh",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    href: "/classPage/students",
  },
  {
    id: 2,
    label: "Quản lý tài liệu",
    icon: BookOpen,
    color: "from-indigo-500 to-purple-500",
    href: "/classPage/documents",
  },
  {
    id: 3,
    label: "Điểm danh",
    icon: CheckSquare,
    color: "from-emerald-500 to-teal-500",
    href: "/classPage/attendance",
  },
  {
    id: 4,
    label: "Đơn xin nghỉ học",
    icon: ClipboardList,
    color: "from-amber-500 to-orange-500",
    href: "/classPage/leave-requests",
  },
  {
    id: 5,
    label: "Bài tập về nhà",
    icon: FileText,
    color: "from-pink-500 to-rose-500",
    href: "/classPage/assignments",
  },
  {
    id: 6,
    label: "Ngân hàng câu hỏi",
    icon: PenTool,
    color: "from-violet-500 to-purple-500",
    href: "/classPage/question-bank",
  },
  {
    id: 7,
    label: "Quản lý đề thi",
    icon: GraduationCap,
    color: "from-sky-500 to-blue-500",
    href: "/classPage/exams",
  },
  {
    id: 8,
    label: "Quản lý điểm",
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    href: "/classPage/grades",
  },
];

export default function ClassManagement({ classId }) {
  const router = useRouter();

  const handleClick = (href) => {
    if (classId) {
      router.push(`${href}?classId=${classId}`);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Thành phần quản lý lớp học
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Chọn một thành phần để quản lý lớp học của bạn
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {managementItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(item.href)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 group"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

