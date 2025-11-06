"use client";
import { useState, useEffect } from "react";
import { Star, Quote, Sparkles } from "lucide-react";
import clsx from "clsx";
import dynamic from "next/dynamic";

// Dynamic import Lottie để tránh lỗi SSR
const Player = dynamic(() => import("@lottiefiles/react-lottie-player").then(mod => mod.Player), {
  ssr: false,
  loading: () => <div className="w-20 h-20 bg-gray-700 rounded-full animate-pulse" />,
});

interface CaseStudy {
  name: string;
  result: string;
  image: string;
  rating: number;
  course: string;
}

const cases: CaseStudy[] = [
  {
    name: "Ngọc Anh",
    result: "Tăng 50% kỹ năng lập trình sau 3 tháng học",
    image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 5,
    course: "React & Next.js",
  },
  {
    name: "Minh Quân",
    result: "Trúng tuyển vị trí lập trình viên Java tại FPT Software",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 5,
    course: "Java Spring Boot",
  },
  {
    name: "Hà My",
    result: "Từ 0 đến thiết kế UI/UX cho startup 10 tỷ",
    image: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 5,
    course: "UI/UX Design",
  },
  {
    name: "Tuấn Kiệt",
    result: "Tăng lương 70% sau khóa Python Data Science",
    image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800",
    rating: 5,
    course: "Python Data Science",
  },
];

export default function CaseStudies() {
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Câu chuyện thành công
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Hàng nghìn học viên đã thay đổi sự nghiệp nhờ E-Learning
          </p>
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((caseStudy, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredId(i)}
              onMouseLeave={() => setHoveredId(null)}
              className={clsx(
                "group relative bg-white bg-opacity-5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white border-opacity-10 transition-all duration-500",
                "hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-500/40",
                loading ? "animate-pulse" : ""
              )}
              style={{ transform: loading ? "none" : "perspective(1000px)" }}
            >
              {/* Skeleton */}
              {loading ? (
                <div className="p-6 space-y-4">
                  <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              ) : (
                <>
                  {/* Confetti Lottie (only on hover) */}
                  {hoveredId === i && (
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                      <Player
                        src="https://assets3.lottiefiles.com/packages/lf20_rovf9gwn.json"
                        loop={false}
                        autoplay
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative p-6 pb-0">
                    <div className="relative mx-auto w-28 h-28">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full p-1 group-hover:scale-110 transition-transform duration-500">
                        <img
                          src={caseStudy.image}
                          alt={caseStudy.name}
                          className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center">
                        <Star className="w-3 h-3 fill-current mr-1" />
                        {caseStudy.rating}.0
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-4 text-center space-y-3">
                    <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition">
                      {caseStudy.name}
                    </h3>
                    <p className="text-sm text-pink-400 font-medium">{caseStudy.course}</p>

                    {/* Quote */}
                    <div className="relative py-4">
                      <Quote className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-purple-500 opacity-20 group-hover:opacity-40 transition" />
                      <p className="text-gray-300 italic text-sm leading-relaxed px-4">
                        "{caseStudy.result}"
                      </p>
                      <Quote className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 text-purple-500 opacity-20 scale-x-[-1] group-hover:opacity-40 transition" />
                    </div>

                    {/* Sparkles */}
                    <div className="flex justify-center space-x-1 pt-2">
                      {[...Array(3)].map((_, i) => (
                        <Sparkles
                          key={i}
                          className={clsx(
                            "w-4 h-4 text-yellow-400",
                            hoveredId === i ? "animate-pulse" : ""
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* View More */}
        <div className="text-center mt-12">
          <a
            href="#all-stories"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300"
          >
            Xem thêm câu chuyện
            <Sparkles className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
}