"use client";
import { useState, useEffect } from "react";
import { BookOpen, Clock, Star, Users } from "lucide-react";
import clsx from "clsx";

const courses = [
  { title: "ReactJS Từ Zero đến Hero", teacher: "Nguyễn Văn A", rating: 4.9, students: 1250, duration: "12 tuần", price: "1.290.000đ" },
  { title: "UI/UX Design với Figma", teacher: "Trần Thị B", rating: 4.8, students: 980, duration: "8 tuần", price: "990.000đ" },
  { title: "Python cho Data Science", teacher: "Lê Văn C", rating: 5.0, students: 2100, duration: "10 tuần", price: "1.490.000đ" },
  { title: "Lập trình Web Fullstack", teacher: "Phạm Thị D", rating: 4.7, students: 850, duration: "16 tuần", price: "2.190.000đ" },
];

export default function FeaturedCourses() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="featured" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center">
        <div className="h-48 w-[80%] rounded-full bg-sky-100/60 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 md:text-5xl">
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Khóa học nổi bật
            </span>
          </h2>
          <p className="mt-3 text-base text-slate-500 md:text-lg">
            Hàng nghìn học viên đã tin tưởng lựa chọn lộ trình của chúng tôi
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {courses.map((course, i) => (
            <div
              key={i}
              className={clsx(
                "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_35px_70px_-30px_rgba(37,99,235,0.45)]",
                loading ? "animate-pulse" : ""
              )}
            >
              {loading ? (
                <div className="space-y-4 p-6">
                  <div className="h-40 rounded-2xl bg-slate-200" />
                  <div className="h-6 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                </div>
              ) : (
                <>
                  <div className="h-40 bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-1">
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
                      <BookOpen className="h-14 w-14 text-sky-500" />
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition">
                      {course.title}
                    </h3>
                    <p className="flex items-center text-sm font-medium text-slate-500">
                      <Users className="mr-2 h-4 w-4 text-sky-500" />
                      {course.teacher}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-xl font-bold text-sky-600">
                        {course.price}
                      </span>
                      <button className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(37,99,235,0.35)] transition hover:shadow-[0_15px_40px_rgba(37,99,235,0.45)]">
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}