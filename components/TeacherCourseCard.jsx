"use client";

import { CalendarDays, Hash } from "lucide-react";
import { motion } from "framer-motion";

function formatDate(input) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TeacherCourseCard(props) {
  const {
    name,
    code,
    description,
    semester,
    createdAt,
    actionLabel = "Quản lý lớp học",
    onAction,
  } = props;
  const handleAction = () => {
    if (typeof onAction === "function") {
      onAction();
    }
  };
  const normalizedCode =
    typeof code === "string" && code.trim() !== ""
      ? code.toUpperCase()
      : "—";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="flex h-full flex-col gap-6 rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_24px_60px_-30px_rgba(37,99,235,0.25)] backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-2xl bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-600">
          <CalendarDays size={14} strokeWidth={1.8} />
          {semester ? `Học kỳ ${semester}` : "Học kỳ đang cập nhật"}
        </span>
        <span className="text-xs font-medium text-slate-400">
          Tạo ngày {formatDate(createdAt)}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        {description ? (
          <p className="text-sm leading-6 text-slate-500 line-clamp-3">
            {description}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Lớp học chưa có mô tả chi tiết.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
          <Hash size={14} strokeWidth={1.8} />
          Mã lớp: {normalizedCode}
        </span>
      </div>

      <button
        type="button"
        onClick={handleAction}
        className="mt-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.35)] transition hover:shadow-[0_18px_48px_rgba(37,99,235,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {actionLabel}
      </button>
    </motion.div>
  );
}
