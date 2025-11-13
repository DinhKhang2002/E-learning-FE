"use client";

import clsx from "clsx";
import { Check, Circle } from "lucide-react";

export default function TeacherTodoItem({ label, completed = false, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-left transition",
        completed
          ? "bg-gradient-to-r from-sky-50 to-slate-50 text-slate-500"
          : "bg-white/85 text-slate-700 hover:border-sky-200 hover:bg-sky-50"
      )}
    >
      <span
        className={clsx(
          "flex h-6 w-6 items-center justify-center rounded-full border-2 text-sky-500",
          completed ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 bg-white"
        )}
      >
        {completed ? <Check size={14} strokeWidth={2.5} /> : <Circle size={14} strokeWidth={2} />}
      </span>
      <span className="text-sm font-medium leading-5">{label}</span>
    </button>
  );
}


