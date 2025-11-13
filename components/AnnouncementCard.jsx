"use client";

import { Bell } from "lucide-react";

export default function AnnouncementCard({
  title,
  time,
  icon: Icon = Bell,
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.3)] backdrop-blur-sm transition hover:border-sky-200 hover:shadow-[0_16px_32px_-16px_rgba(56,189,248,0.35)]">
      <div className="rounded-xl bg-sky-100 p-3 text-sky-600">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
          {time}
        </p>
      </div>
    </div>
  );
}


