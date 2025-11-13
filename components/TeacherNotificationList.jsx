"use client";

import { Bell, CalendarClock, FileText, NotebookPen } from "lucide-react";

const typeConfig = {
  ASSIGNMENT_NEW: {
    label: "Bài tập mới",
    accent: "bg-sky-100 text-sky-600",
    icon: NotebookPen,
  },
  ASSIGNMENT_DEADLINE: {
    label: "Hạn nộp bài",
    accent: "bg-amber-100 text-amber-600",
    icon: CalendarClock,
  },
  LEAVE_REQUEST: {
    label: "Xin nghỉ học",
    accent: "bg-emerald-100 text-emerald-600",
    icon: FileText,
  },
};

function formatDateTime(input) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherNotificationList({
  notifications,
  loading = false,
  error = null,
  onRetry,
  limit = 6,
}) {
  const displayNotifications =
    limit >= 0 ? notifications.slice(0, limit) : notifications;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="h-20 rounded-2xl bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
        <p className="font-semibold">Không thể tải thông báo</p>
        <p className="mt-1">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (displayNotifications.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 text-center text-sm text-slate-500">
        Hiện chưa có thông báo nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayNotifications.map((item) => {
        const config = typeConfig[item?.type] ?? {
          label: "Thông báo",
          accent: "bg-slate-100 text-slate-600",
          icon: Bell,
        };

        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)]"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${config.accent}`}
            >
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {config.label}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {formatDateTime(item.createAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


