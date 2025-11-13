"use client";

import { motion } from "framer-motion";

export default function TeacherStatCard({
  icon: Icon,
  label,
  value,
  description,
  accent = "bg-sky-100 text-sky-600",
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.32)] backdrop-blur-sm"
    >
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        {Icon ? <Icon size={24} strokeWidth={1.8} /> : null}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {description && (
        <p className="text-sm text-slate-500">
          {description}
        </p>
      )}
    </motion.div>
  );
}


