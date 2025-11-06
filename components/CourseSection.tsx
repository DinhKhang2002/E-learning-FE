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

export default function CourseSection({ title, highlight = false }: CourseSectionProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={clsx("py-16", highlight ? "bg-gradient-to-b from-indigo-900 to-gray-900" : "bg-gray-900")}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className={clsx(
            "text-4xl md:text-5xl font-bold",
            highlight
              ? "bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
              : "text-white"
          )}>
            {title}
          </h2>
          {highlight && (
            <p className="mt-3 text-gray-300 text-lg">Khám phá các khóa học được yêu thích nhất</p>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className={clsx(
                "group relative bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white border-opacity-10 transition-all duration-500",
                "hover:-translate-y-3 hover:shadow-2xl hover:shadow-purple-500/30",
                loading ? "animate-pulse" : ""
              )}
              style={{ transform: loading ? "none" : "perspective(1000px)" }}
            >
              {/* Skeleton */}
              {loading ? (
                <div className="p-6 space-y-4">
                  <div className="h-48 bg-gray-700 rounded-xl"></div>
                  <div className="h-6 bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-700 rounded-full"></div>
                </div>
              ) : (
                <>
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center z-20">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      {course.rating}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-white group-hover:text-purple-400 transition line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.teacher}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {course.duration}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {course.students.toLocaleString()}
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-white border-opacity-10">
                      <span className="text-xl font-bold text-pink-400">{course.price}</span>
                      <button className="group/btn flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-pink-500/50">
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition" />
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
          <div className="text-center mt-12">
            <a
              href="#all-courses"
              className="inline-flex items-center px-8 py-3 bg-white bg-opacity-10 backdrop-blur-md text-white font-medium rounded-full border border-white border-opacity-30 hover:bg-opacity-20 transition-all"
            >
              Xem tất cả khóa học
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}