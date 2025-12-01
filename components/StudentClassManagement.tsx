"use client";

import {
  BookOpen,
  CheckSquare,
  FileText,
  GraduationCap,
  Star,
  ChevronRight,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

const studentSections = [
  {
    id: 1,
    label: "Điểm danh & Xin nghỉ",
    icon: CheckSquare,
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    href: "/studentClassAction/AttandenceAction",
  },
  {
    id: 2,
    label: "Tài liệu lớp",
    icon: BookOpen,
    color: "from-indigo-500 via-purple-500 to-pink-500",
    href: "/studentClassAction/DocumentAction",
  },
  {
    id: 3,
    label: "Bài tập được giao",
    icon: FileText,
    color: "from-blue-500 via-cyan-500 to-sky-500",
    href: "/studentClassAction/AssignmentAction",
  },
  {
    id: 4,
    label: "Hệ thống thi online",
    icon: GraduationCap,
    color: "from-amber-500 via-orange-500 to-red-500",
    href: "/studentClassAction/ExamAction",
  },
  {
    id: 5,
    label: "Xem điểm",
    icon: Star,
    color: "from-yellow-500 via-amber-500 to-orange-500",
    href: "/studentClassAction/ScoreAction",
  },
];

interface StudentClassManagementProps {
  classId: string | null;
}

export default function StudentClassManagement({ classId }: StudentClassManagementProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = (href: string) => {
    if (classId) {
      router.push(`${href}?classId=${classId}`);
    } else {
      router.push(href);
    }
  };

  return (
    <motion.div
      initial={{ width: "4.5rem" }}
      animate={{ width: isExpanded ? "18rem" : "4.5rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed left-4 top-24 bottom-4 z-40 flex flex-col rounded-3xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      {/* Header / Logo Area */}
      <div className="flex items-center h-20 px-5 border-b border-slate-100">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
          <Menu className="w-5 h-5" />
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="ml-4 font-bold text-slate-800 whitespace-nowrap overflow-hidden"
            >
              Công cụ học tập
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Menu Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-2 px-3 custom-scrollbar">
        {studentSections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.href)}
              className={`group flex w-full items-center ${
                isExpanded ? "justify-start px-3" : "justify-center"
              } h-14 rounded-xl transition-all hover:bg-slate-100/80 relative`}
            >
              {/* Icon Container with Gradient */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md transition-transform group-hover:scale-110`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 text-sm font-semibold text-slate-700 whitespace-nowrap overflow-hidden group-hover:text-indigo-600 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:block group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -ml-1 -mt-1 h-2 w-2 -rotate-45 bg-slate-900" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Toggle Hint */}
      <div className="p-4 border-t border-slate-100 flex justify-center">
        <ChevronRight
          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>
    </motion.div>
  );
}