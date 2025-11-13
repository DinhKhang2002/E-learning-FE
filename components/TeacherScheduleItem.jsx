"use client";

export default function TeacherScheduleItem({ day, date, title, time }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-[0_14px_34px_-20px_rgba(15,23,42,0.32)] backdrop-blur-sm">
      <div className="flex w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 py-2 text-sky-600">
        <span className="text-xs font-semibold uppercase tracking-wide">
          {day}
        </span>
        <span className="text-xl font-bold text-sky-700">{date}</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs font-medium text-slate-500">{time}</span>
      </div>
    </div>
  );
}


