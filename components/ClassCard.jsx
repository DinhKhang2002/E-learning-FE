"use client";

import { motion } from "framer-motion";

const accentVariants = {
  default: "from-sky-400 to-blue-500",
  green: "from-emerald-400 to-teal-500",
  purple: "from-indigo-400 to-purple-500",
  orange: "from-orange-400 to-amber-500",
};

const MotionCard = motion.div;

export default function ClassCard({
  title,
  subtitle,
  progress = 0,
  accent = "default",
  illustration,
  actionLabel = "Tiếp tục học",
  onAction,
}) {
  const gradient = accentVariants[accent] ?? accentVariants.default;

  return (
    <MotionCard
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex flex-col gap-5 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_18px_45px_-25px_rgba(15,23,42,0.35)] backdrop-blur-sm"
    >
      <div
        className={`flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
      >
        <span className="text-4xl font-semibold text-white drop-shadow-sm">
          {illustration}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            <span>Tiến độ</span>
            <span className="text-sky-600">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              style={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,118,215,0.25)] transition hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {actionLabel}
      </button>
    </MotionCard>
  );
}


