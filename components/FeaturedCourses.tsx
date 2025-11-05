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
    <section id="featured" className="py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Khóa học nổi bật
            </span>
          </h2>
          <p className="text-gray-400">Hàng nghìn học viên đã tin tưởng lựa chọn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, i) => (
            <div
              key={i}
              className={clsx(
                "group relative bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white border-opacity-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20",
                loading ? "animate-pulse" : ""
              )}
              style={{ transform: loading ? "none" : "perspective(1000px)" }}
            >
              {/* Skeleton */}
              {loading ? (
                <div className="p-6 space-y-4">
                  <div className="h-48 bg-gray-700 rounded-xl"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="h-48 bg-gradient-to-br from-pink-500 to-purple-600 p-1">
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-purple-400" />
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition">{course.title}</h3>
                    <p className="text-sm text-gray-400 flex items-center">
                      <Users className="w-4 h-4 mr-1" /> {course.teacher}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-4 h-4 fill-current" /> {course.rating}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-1" /> {course.duration}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-pink-400">{course.price}</span>
                      <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm rounded-full hover:scale-105 transition">
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