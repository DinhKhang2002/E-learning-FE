"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function TeacherQuickActionCard({
  title,
  description,
  actionLabel = "Bắt đầu",
  onAction,
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="flex flex-col gap-5 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-blue-100 p-6 shadow-[0_20px_45px_-25px_rgba(37,99,235,0.35)]"
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-inner">
        <Plus size={24} strokeWidth={2.2} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="mt-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition hover:shadow-[0_16px_36px_rgba(37,99,235,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-100"
      >
        {actionLabel}
      </button>
    </motion.div>
  );
}


