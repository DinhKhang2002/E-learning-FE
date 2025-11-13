"use client";

import { motion } from "framer-motion";
import {
  BookOpenCheck,
  GraduationCap,
  MessageCircle,
  PenSquare,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeacherCourseCard from "@/components/TeacherCourseCard";
import TeacherQuickActionCard from "@/components/TeacherQuickActionCard";
import TeacherStatCard from "@/components/TeacherStatCard";
import TeacherScheduleItem from "@/components/TeacherScheduleItem";
import TeacherTodoItem from "@/components/TeacherTodoItem";

const teacherCourses = [
  {
    id: 1,
    title: "Introduction to Quantum Physics",
    students: 35,
    status: "Đang diễn ra",
    statusTone: "info",
    actionLabel: "Quản lý khóa học",
    illustration: "QP",
  },
  {
    id: 2,
    title: "Advanced Organic Chemistry",
    students: 28,
    status: "Đang diễn ra",
    statusTone: "default",
    actionLabel: "Quản lý khóa học",
    illustration: "OC",
  },
  {
    id: 3,
    title: "History of Ancient Civilizations",
    students: 42,
    status: "Bắt đầu tuần sau",
    statusTone: "warning",
    actionLabel: "Xem chi tiết",
    illustration: "HC",
  },
];

const activityStats = [
  {
    id: 1,
    label: "Bài tập cần chấm",
    value: "12",
    icon: PenSquare,
    description: "Chấm điểm cho học viên trong tuần này",
    accent: "bg-sky-100 text-sky-600",
  },
  {
    id: 2,
    label: "Học viên hoạt động",
    value: "87%",
    icon: Users,
    description: "Học viên tương tác tích cực tuần này",
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    id: 3,
    label: "Tin nhắn chưa đọc",
    value: "5",
    icon: MessageCircle,
    description: "Tin nhắn từ học viên và giảng viên khác",
    accent: "bg-indigo-100 text-indigo-600",
  },
];

const scheduleItems = [
  {
    id: 1,
    day: "THỨ 2",
    date: 15,
    title: "Quantum Physics - Lecture",
    time: "10:00 AM - 11:30 AM",
  },
  {
    id: 2,
    day: "THỨ 3",
    date: 16,
    title: "Organic Chemistry - Lab Session",
    time: "01:00 PM - 03:00 PM",
  },
  {
    id: 3,
    day: "THỨ 5",
    date: 18,
    title: "Office Hours",
    time: "02:00 PM - 04:00 PM",
  },
];

const todoItems = [
  { id: 1, label: "Hoàn thiện đề thi giữa kỳ môn Quantum Physics", completed: true },
  { id: 2, label: "Chấm điểm bài tập 3 cho lớp Quantum Physics", completed: false },
  { id: 3, label: "Chuẩn bị bài giảng về Ancient Rome", completed: false },
];

export default function TeacherHomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-sky-100 via-white to-transparent" />

        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-12 lg:px-8">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
              Xin chào, giảng viên!
            </p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  Chào mừng trở lại, Professor!
                </h1>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  Đây là tổng quan về các hoạt động giảng dạy của bạn hôm nay.
                </p>
              </div>
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
                    Khóa học của tôi
                  </h2>
                  <button
                    type="button"
                    className="text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {teacherCourses.map((course) => (
                    <TeacherCourseCard key={course.id} {...course} />
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
                    Tổng quan hoạt động
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {activityStats.map((stat) => (
                    <TeacherStatCard key={stat.id} {...stat} />
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
                className="rounded-3xl"
              >
                <TeacherQuickActionCard
                  title="Tạo khóa học mới"
                  description="Bắt đầu xây dựng khóa học mới và chia sẻ kiến thức của bạn."
                  actionLabel="Bắt đầu tạo"
                />
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.3, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lịch giảng dạy
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <BookOpenCheck size={16} strokeWidth={1.75} />
                    Xem toàn bộ
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {scheduleItems.map((item) => (
                    <TeacherScheduleItem key={item.id} {...item} />
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
                className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Danh sách công việc
                  </h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
                  >
                    <GraduationCap size={16} strokeWidth={1.75} />
                    Quản lý
                  </button>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {todoItems.map((item) => (
                    <TeacherTodoItem key={item.id} {...item} />
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


