"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  MessageSquare,
  NotebookPen,
  Trophy,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClassCard from "@/components/ClassCard";
import SuggestClassCard from "@/components/SuggestClassCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import ScheduleCard from "@/components/ScheduleCard";

const continueLearning = [
  {
    id: 1,
    title: "Lập trình Python cơ bản",
    subtitle: "Hoàn thành 15/20 bài học",
    progress: 75,
    accent: "default",
    illustration: "Py",
  },
  {
    id: 2,
    title: "Thiết kế giao diện người dùng (UI/UX)",
    subtitle: "Hoàn thành 10/20 bài học",
    progress: 50,
    accent: "purple",
    illustration: "UI",
  },
  {
    id: 3,
    title: "Marketing kỹ thuật số cho người mới",
    subtitle: "Hoàn thành 5/20 bài học",
    progress: 25,
    accent: "green",
    illustration: "Mk",
  },
];

const suggestedClasses = [
  {
    id: 1,
    title: "JavaScript nâng cao",
    author: "John Doe",
    accent: "from-cyan-100 to-sky-200",
    illustration: "JS",
  },
  {
    id: 2,
    title: "Khóa học dữ liệu với R",
    author: "Jane Smith",
    accent: "from-emerald-100 to-green-200",
    illustration: "R",
  },
  {
    id: 3,
    title: "Nhập môn Thiết kế đồ họa",
    author: "Alex Ray",
    accent: "from-indigo-100 to-blue-200",
    illustration: "GD",
  },
  {
    id: 4,
    title: "Kỹ năng nói trước công chúng",
    author: "Emily White",
    accent: "from-amber-100 to-orange-200",
    illustration: "SP",
  },
];

const announcements = [
  {
    id: 1,
    title: "Bài tập mới môn Python",
    time: "Hạn chót: 25/9, Thứ Sáu",
    icon: NotebookPen,
  },
  {
    id: 2,
    title: "Giảng viên đã trả lời câu hỏi của bạn",
    time: "2 giờ trước",
    icon: MessageSquare,
  },
  {
    id: 3,
    title: "Thông báo từ khóa Marketing kỹ thuật số",
    time: "1 ngày trước",
    icon: Trophy,
  },
];

const schedules = [
  {
    id: 1,
    day: 28,
    month: "Tháng 10",
    title: "Buổi học trực tuyến UI/UX",
    time: "19:00 - 21:00",
  },
  {
    id: 2,
    day: 30,
    month: "Tháng 10",
    title: "Deadline bài tập Python",
    time: "23:59",
  },
  {
    id: 3,
    day: 5,
    month: "Tháng 11",
    title: "Thảo luận nhóm Marketing",
    time: "09:00 - 10:30",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100/80 via-slate-50 to-transparent" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-12 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Xin chào, học viên!
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  Tiếp tục hành trình học tập
                </h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Theo dõi tiến độ, nhận thông báo mới và khám phá khóa học phù
                  hợp với bạn.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Tìm khóa học
              </button>
            </div>
          </motion.header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="flex flex-col gap-10">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.1, duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Khóa học đang theo học
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {continueLearning.map((item) => (
                    <ClassCard key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.2, duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Gợi ý cho bạn
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Cá nhân hóa gợi ý
                  </button>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {suggestedClasses.map((item) => (
                    <SuggestClassCard key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>
            </div>

            <aside className="flex flex-col gap-8">
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Thông báo mới
                  </h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {announcements.map((item) => (
                    <AnnouncementCard key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lịch trình sắp tới
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <CalendarDays size={16} strokeWidth={1.75} />
                    Xem lịch
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {schedules.map((item) => (
                    <ScheduleCard key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>
            </aside>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
