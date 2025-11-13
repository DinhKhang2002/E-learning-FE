"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

const statusThemes = {
  default: {
    dot: "bg-sky-500",
    text: "text-sky-600",
  },
  success: {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-600",
  },
  info: {
    dot: "bg-indigo-500",
    text: "text-indigo-600",
  },
};

export default function TeacherCourseCard({
  title,
  students,
  status,
  statusTone = "default",
  actionLabel = "Quản lý khóa học",
  onAction,
  illustration,
}) {
  const theme = statusThemes[statusTone] ?? statusThemes.default;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="flex h-full flex-col gap-5 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35)] backdrop-blur-sm"
    >
      <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-blue-100 p-6">
        <span className="text-4xl font-semibold text-slate-800">{illustration}</span>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm font-medium text-slate-500">
          {students} học viên tham gia
        </p>
        {status && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600">
            <span className={clsx("h-2.5 w-2.5 rounded-full", theme.dot)} />
            <span className={theme.text}>{status}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,215,0.25)] transition hover:shadow-[0_18px_35px_rgba(30,136,229,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {actionLabel}
      </button>
    </motion.div>
  );
}


