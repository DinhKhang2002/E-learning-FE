"use client";

import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Rocket,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import CourseSection from "@/components/CourseSection";
import FeaturedCourses from "@/components/FeaturedCourses";
import CaseStudies from "@/components/CaseStudies";
import TeachersSection from "@/components/TeachersSection";

const featureCards = [
  {
    title: "Lộ trình học cá nhân hóa",
    description:
      "Gợi ý khóa học theo mục tiêu và năng lực của bạn để tối ưu thời gian học.",
    icon: Layers,
  },
  {
    title: "Giảng viên tận tâm",
    description:
      "Kết nối và nhận phản hồi trực tiếp từ những chuyên gia dày dặn kinh nghiệm.",
    icon: Users,
  },
  {
    title: "Chứng chỉ uy tín",
    description:
      "Nhận chứng chỉ được công nhận bởi doanh nghiệp đối tác sau khi hoàn thành.",
    icon: Award,
  },
];

const stats = [
  { label: "Học viên đang theo học", value: "32.000+" },
  { label: "Khóa học chất lượng cao", value: "420+" },
  { label: "Giảng viên chuyên gia", value: "180+" },
  { label: "Dự án thực chiến", value: "250+" },
];

export default function UnloginHomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <div className="mt-16 flex-1">
        <HeroSlider />

        {/* Feature Highlights */}
        <section
          id="about"
          className="relative mx-auto -mt-24 w-full max-w-6xl px-6 pb-12 lg:px-8"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                className="rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-md"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-indigo-100 text-sky-600">
                  <item.icon size={26} strokeWidth={1.7} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why choose & stats */}
        <section className="relative overflow-hidden bg-white py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center">
            <div className="h-64 w-[70%] rounded-full bg-sky-100/60 blur-3xl" />
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 lg:flex-row lg:px-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 space-y-6"
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-600">
                <Rocket size={16} strokeWidth={1.75} />
                Tăng tốc sự nghiệp của bạn
              </p>
              <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Nền tảng E-Learning toàn diện cho mọi hành trình phát triển
              </h2>
              <p className="text-base text-slate-500 md:text-lg">
                Từ kiến thức nền tảng tới kỹ năng chuyên sâu, chúng tôi xây dựng
                chương trình dựa trên nhu cầu thực tế của doanh nghiệp giúp bạn
                tự tin ứng tuyển mọi vị trí.
              </p>
              <ul className="space-y-4 text-sm text-slate-600">
                {[
                  "Hệ thống bài giảng được cập nhật hàng tháng theo xu hướng mới",
                  "Bài tập thực hành sát với môi trường doanh nghiệp",
                  "Cộng đồng học tập hỗ trợ 24/7 cùng mentor giàu kinh nghiệm",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_-20px_rgba(37,99,235,0.55)] transition hover:shadow-[0_22px_55px_-20px_rgba(37,99,235,0.65)] sm:text-base"
                >
                  Đăng ký ngay
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600 sm:text-base"
                >
                  Đăng nhập để tiếp tục học
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="grid flex-1 gap-6 sm:grid-cols-2"
            >
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-[0_25px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-md"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-3xl font-semibold text-slate-900">
                    {item.value}
                  </span>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <FeaturedCourses />

        <CourseSection
          title="Khóa học được yêu thích"
          highlight
          tone="light"
        />

        <CaseStudies />

        <TeachersSection />

        {/* Learning experience */}
        <section className="overflow-hidden bg-gradient-to-br from-indigo-600 via-sky-600 to-blue-700 py-20 text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 px-6 text-center lg:flex-row lg:items-center lg:text-left lg:px-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="flex-1 space-y-6"
            >
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-md">
                <Clock size={16} strokeWidth={1.75} />
                Lịch trình học linh hoạt
              </p>
              <h2 className="text-3xl font-bold md:text-4xl">
                Trải nghiệm học tập kết hợp video, bài tập và cộng đồng
              </h2>
              <p className="text-base text-slate-100 md:text-lg">
                Chúng tôi tối ưu từng phút học của bạn với video ngắn gọn, quiz
                tương tác và phòng thảo luận trực tuyến với giảng viên.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="flex flex-1 flex-col gap-4"
            >
              {[
                "Video chất lượng 4K, ghi chú thông minh, tốc độ điều chỉnh dễ dàng",
                "Câu hỏi tương tác và bài tập dự án sau mỗi chương",
                "Bảng xếp hạng động lực và phần thưởng hấp dẫn sau khi hoàn thành",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-left backdrop-blur-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                    <CheckCircle2 size={18} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}