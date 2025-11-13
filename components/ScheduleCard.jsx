"use client";

export default function ScheduleCard({ day, month, title, time }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-[0_14px_32px_-20px_rgba(15,23,42,0.35)] backdrop-blur-sm">
      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {month}
        </span>
        <span className="text-3xl font-bold text-sky-700">{day}</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs font-medium text-slate-500">{time}</span>
      </div>
    </div>
  );
}


