"use client";

import { motion } from "framer-motion";

const MotionCard = motion.button;

export default function SuggestClassCard({
  title,
  author,
  accent = "from-slate-100 to-slate-200",
  illustration,
  onClick,
}) {
  return (
    <MotionCard
      type="button"
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex h-full flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 p-6 text-left shadow-[0_12px_35px_-20px_rgba(15,23,42,0.28)] backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <div
        className={`flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}
      >
        <span className="text-3xl font-semibold text-slate-800">
          {illustration}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="text-sm font-medium text-slate-500">Bởi {author}</p>
      </div>
    </MotionCard>
  );
}


