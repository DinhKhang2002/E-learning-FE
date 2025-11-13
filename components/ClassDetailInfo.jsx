"use client";

import { CalendarDays, Hash, User, CheckCircle2 } from "lucide-react";

function formatDate(input) {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ClassDetailInfo({ classData, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-20 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600 font-medium">Không thể tải thông tin lớp học</p>
      </div>
    );
  }

  const infoItems = [
    {
      label: "Tên lớp học",
      value: classData.name || "—",
      icon: null,
    },
    {
      label: "Mã lớp học",
      value: classData.code || "—",
      icon: Hash,
    },
    {
      label: "Ngày tạo",
      value: formatDate(classData.createdAt),
      icon: CalendarDays,
    },
    {
      label: "Tên giáo viên",
      value: classData.teacherName || "—",
      icon: User,
    },
    {
      label: "Học kỳ",
      value: classData.semester ? `Học kỳ ${classData.semester}` : "—",
      icon: CalendarDays,
    },
    {
      label: "Trạng thái",
      value: "Đang hoạt động",
      icon: CheckCircle2,
      isStatus: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Thông tin chi tiết lớp học
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${
                      item.isStatus ? "text-emerald-500" : "text-slate-500"
                    }`}
                    strokeWidth={1.8}
                  />
                )}
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </span>
              </div>
              {item.isStatus ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600">
                    {item.value}
                  </span>
                </div>
              ) : (
                <span className="text-base font-semibold text-slate-900">
                  {item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

