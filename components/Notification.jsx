"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, CalendarClock, FileText, NotebookPen, X } from "lucide-react";

const NOTICES_API = (userId) =>
  `http://localhost:8080/education/api/notices/user/${userId}`;
const NOTICE_DETAIL_API = (noticeId) =>
  `http://localhost:8080/education/api/notices/${noticeId}`;
const MARK_READ_API = (noticeId) =>
  `http://localhost:8080/education/api/notices/${noticeId}/read`;

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

export default function Notification({ userId, authToken }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const menuRef = useRef(null);
  const detailRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!authToken || !userId) return;
    setLoading(true);
    try {
      const response = await fetch(NOTICES_API(userId), {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
        throw new Error(
          data?.message || "Không thể tải thông báo. Vui lòng thử lại."
        );
      }

      setNotifications(data.result ?? []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, userId]);

  const markAsRead = useCallback(
    async (noticeId) => {
      if (!authToken) return;
      try {
        const response = await fetch(MARK_READ_API(noticeId), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Không thể đánh dấu đã đọc");
        }

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === noticeId ? { ...item, read: true } : item
          )
        );
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    },
    [authToken]
  );

  useEffect(() => {
    if (open && authToken && userId) {
      fetchNotifications();
    }
  }, [open, authToken, userId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
      if (
        detailRef.current &&
        !detailRef.current.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setDetailOpen(false);
        setSelectedNotification(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotificationDetail = useCallback(
    async (noticeId) => {
      if (!authToken) return null;
      setDetailLoading(true);
      try {
        const response = await fetch(NOTICE_DETAIL_API(noticeId), {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải chi tiết thông báo. Vui lòng thử lại."
          );
        }

        return data.result;
      } catch (error) {
        console.error("Failed to fetch notification detail:", error);
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [authToken]
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleNotificationClick = async (notification) => {
    setDetailOpen(true);
    setDetailLoading(true);
    
    // Gọi API lấy chi tiết thông báo
    const detail = await fetchNotificationDetail(notification.id);
    
    if (detail) {
      setSelectedNotification(detail);
      
      // Cập nhật thông báo trong danh sách với dữ liệu mới nhất
      setNotifications((prev) =>
        prev.map((item) => (item.id === detail.id ? detail : item))
      );
      
      // Đánh dấu đã đọc nếu chưa đọc
      if (!detail.read) {
        markAsRead(detail.id);
      }
    } else {
      // Nếu không lấy được chi tiết, vẫn hiển thị thông tin từ danh sách
      setSelectedNotification(notification);
      if (!notification.read) {
        markAsRead(notification.id);
      }
    }
  };

  const config = selectedNotification
    ? typeConfig[selectedNotification?.type] ?? {
        label: "Thông báo",
        accent: "bg-slate-100 text-slate-600",
        icon: Bell,
      }
    : null;

  const Icon = config?.icon ?? Bell;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-0.5 hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 group"
        >
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <Bell className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-96 max-h-[600px] bg-white bg-opacity-10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white border-opacity-20 overflow-hidden z-50">
            <div className="p-4 border-b border-white border-opacity-10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">Thông báo</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 rounded-xl bg-white bg-opacity-5 animate-pulse"
                    />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-300 text-sm">
                  Chưa có thông báo nào
                </div>
              ) : (
                <div className="divide-y divide-white divide-opacity-10">
                  {notifications.map((item) => {
                    const itemConfig =
                      typeConfig[item.type] ?? {
                        label: "Thông báo",
                        accent: "bg-slate-100 text-slate-600",
                        icon: Bell,
                      };
                    const ItemIcon = itemConfig.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full p-4 text-left hover:bg-white hover:bg-opacity-10 transition-all ${
                          !item.read ? "bg-white bg-opacity-5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${itemConfig.accent} flex-shrink-0`}
                          >
                            <ItemIcon size={18} strokeWidth={1.8} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide text-pink-300">
                                {itemConfig.label}
                              </span>
                              {!item.read && (
                                <span className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-gray-300">
                              {formatDateTime(item.createAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {detailOpen && selectedNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div
            ref={detailRef}
            className="relative w-full max-w-3xl bg-gradient-to-br from-white via-white to-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header với nút back */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setDetailOpen(false);
                    setSelectedNotification(null);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.accent} shadow-sm`}
                  >
                    <Icon size={28} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-900 font-bold text-xl">
                      {config.label}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-slate-500">
                        {formatDateTime(selectedNotification.createAt)}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-slate-400" />
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          selectedNotification.read
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung chính */}
            <div className="p-8">
              {detailLoading ? (
                <div className="space-y-6">
                  <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ) : selectedNotification ? (
                <div className="space-y-6">
                  {/* Nội dung thông báo - phần quan trọng nhất */}
                  <div>
                    <div className="mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1">
                        Nội dung thông báo
                      </h4>
                      <div className="h-1 w-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-6 border-2 border-slate-200 shadow-sm">
                      <p className="text-slate-900 leading-relaxed text-lg font-medium">
                        {selectedNotification.content}
                      </p>
                    </div>
                  </div>

                  {/* Thông tin bổ sung */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                        Loại thông báo
                      </p>
                      <p className="text-slate-900 font-semibold text-base">
                        {config.label}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-5 border border-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                        Thời gian nhận
                      </p>
                      <p className="text-slate-900 font-semibold text-base">
                        {formatDate(selectedNotification.createAt)}
                      </p>
                      <p className="text-slate-600 text-sm mt-1">
                        {new Date(selectedNotification.createAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-slate-600 font-medium">
                    Không thể tải chi tiết thông báo
                  </p>
                  <button
                    onClick={() => {
                      setDetailOpen(false);
                      setSelectedNotification(null);
                    }}
                    className="mt-4 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

