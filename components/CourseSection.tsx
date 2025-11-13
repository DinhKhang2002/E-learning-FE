"use client";
import { useState, useEffect } from "react";
import { BookOpen, Clock, Star, Users, ArrowRight } from "lucide-react";
import clsx from "clsx";

interface Course {
  id: number;
  title: string;
  teacher: string;
  rating: number;
  students: number;
  duration: string;
  price: string;
  image: string;
}

interface CourseSectionProps {
  title: string;
  highlight?: boolean;
  tone?: "dark" | "light";
}

const courses: Course[] = [
  {
    id: 1,
    title: "Lập trình Java cơ bản",
    teacher: "Nguyễn Văn A",
    rating: 4.8,
    students: 2850,
    duration: "8 tuần",
    price: "990.000đ",
    image: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 2,
    title: "Spring Boot nâng cao",
    teacher: "Trần Thị B",
    rating: 4.9,
    students: 1920,
    duration: "12 tuần",
    price: "1.490.000đ",
    image: "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 3,
    title: "React và Next.js thực chiến",
    teacher: "Lê Văn C",
    rating: 5.0,
    students: 3400,
    duration: "10 tuần",
    price: "1.290.000đ",
    image: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 4,
    title: "UI/UX Design với Figma",
    teacher: "Phạm Thị D",
    rating: 4.7,
    students: 1580,
    duration: "6 tuần",
    price: "890.000đ",
    image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export default function CourseSection({ title, highlight = false, tone = "dark" }: CourseSectionProps) {
  const [loading, setLoading] = useState(true);

  const isLight = tone === "light";

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={clsx(
        "py-16",
        highlight
          ? isLight
            ? "bg-gradient-to-b from-sky-50 via-white to-slate-50"
            : "bg-gradient-to-b from-indigo-900 to-gray-900"
          : isLight
          ? "bg-white"
          : "bg-gray-900"
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Title */}
        <div className="mb-12 text-center">
          <h2
            className={clsx(
              "text-4xl md:text-5xl font-bold",
              highlight
                ? isLight
                  ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
                : isLight
                ? "text-slate-900"
                : "text-white"
            )}
          >
            {title}
          </h2>
          {highlight && (
            <p
              className={clsx(
                "mt-3 text-lg",
                isLight ? "text-slate-500" : "text-gray-300"
              )}
            >
              Khám phá các khóa học được yêu thích nhất
            </p>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={clsx(
                "group relative overflow-hidden rounded-2xl border transition-all duration-500",
                loading ? "animate-pulse" : "",
                isLight
                  ? "border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] hover:-translate-y-3 hover:shadow-[0_32px_80px_-30px_rgba(37,99,235,0.3)]"
                  : "border-white border-opacity-10 bg-white/5 backdrop-blur-xl hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/30"
              )}
              style={{ transform: loading ? "none" : "perspective(1000px)" }}
            >
              {/* Skeleton */}
              {loading ? (
                <div className="space-y-4 p-6">
                  <div className={clsx("h-48 rounded-xl", isLight ? "bg-slate-200" : "bg-gray-700")} />
                  <div className={clsx("h-6 w-4/5 rounded", isLight ? "bg-slate-200" : "bg-gray-700")} />
                  <div className={clsx("h-4 w-1/2 rounded", isLight ? "bg-slate-200" : "bg-gray-700")} />
                  <div className={clsx("h-10 rounded-full", isLight ? "bg-slate-200" : "bg-gray-700")} />
                </div>
              ) : (
                <>
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className={clsx(
                        "absolute inset-0 z-10 bg-gradient-to-t from-gray-900 via-transparent to-transparent",
                        isLight ? "opacity-60" : "opacity-100"
                      )}
                    ></div>
                    <img
                      src={course.image}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div
                      className={clsx(
                        "absolute top-3 right-3 z-20 flex items-center rounded-full px-2 py-1 text-xs font-bold",
                        isLight ? "bg-amber-400 text-slate-900" : "bg-yellow-500 text-black"
                      )}
                    >
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {course.rating}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 p-5">
                    <h3
                      className={clsx(
                        "line-clamp-2 font-bold transition",
                        isLight ? "text-slate-900 group-hover:text-sky-600" : "text-white group-hover:text-purple-400"
                      )}
                    >
                      {course.title}
                    </h3>
                    <p
                      className={clsx(
                        "flex items-center text-sm",
                        isLight ? "text-slate-500" : "text-gray-400"
                      )}
                    >
                      <Users className="mr-1 h-4 w-4" />
                      {course.teacher}
                    </p>

                    {/* Stats */}
                    <div
                      className={clsx(
                        "flex items-center justify-between text-xs",
                        isLight ? "text-slate-400" : "text-gray-400"
                      )}
                    >
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        {course.duration}
                      </span>
                      <span className="flex items-center">
                        <Users className="mr-1 h-3.5 w-3.5" />
                        {course.students.toLocaleString()}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div
                      className={clsx(
                        "flex items-center justify-between pt-3",
                        isLight
                          ? "border-t border-slate-200"
                          : "border-t border-white border-opacity-10"
                      )}
                    >
                      <span
                        className={clsx(
                          "text-xl font-bold",
                          isLight ? "text-sky-600" : "text-pink-400"
                        )}
                      >
                        {course.price}
                      </span>
                      <button
                        className={clsx(
                          "group/btn flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                          isLight
                            ? "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-[0_15px_40px_rgba(37,99,235,0.35)] hover:shadow-[0_18px_45px_rgba(37,99,235,0.45)]"
                            : "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-pink-500/50"
                        )}
                      >
                        Xem chi tiết
                        <ArrowRight className="ml-1 h-4 w-4 transition group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* View All Button (only if not highlight) */}
        {!highlight && (
          <div className="mt-12 text-center">
            <a
              href="#all-courses"
              className={clsx(
                "inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold transition-all",
                isLight
                  ? "bg-white text-slate-700 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.3)] hover:shadow-[0_22px_46px_-20px_rgba(37,99,235,0.35)]"
                  : "bg-white/10 text-white backdrop-blur-md border border-white/30 hover:bg-white/20"
              )}
            >
              Xem tất cả khóa học
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}