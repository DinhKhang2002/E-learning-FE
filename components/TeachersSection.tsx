"use client";
import { useState, useEffect } from "react";
import { Facebook, Linkedin, Github, Award, Star, Sparkles, Users } from "lucide-react"; // ← ĐÃ THÊM Users
import clsx from "clsx";
import dynamic from "next/dynamic";

// Dynamic import Lottie để tránh lỗi SSR
const Player = dynamic(() => import("@lottiefiles/react-lottie-player").then(mod => mod.Player), {
  ssr: false,
  loading: () => <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse" />,
});

interface Teacher {
  name: string;
  title: string;
  image: string;
  experience: string;
  students: number;
  rating: number;
  social: {
    facebook?: string;
    linkedin?: string;
    github?: string;
  };
}

const teachers: Teacher[] = [
  {
    name: "Nguyễn Văn A",
    title: "Giảng viên Fullstack",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
    experience: "8+ năm",
    students: 5200,
    rating: 4.9,
    social: {
      linkedin: "#",
      github: "#",
    },
  },
  {
    name: "Trần Thị B",
    title: "Chuyên gia UX/UI",
    image: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800",
    experience: "6+ năm",
    students: 3800,
    rating: 5.0,
    social: {
      facebook: "#",
      linkedin: "#",
    },
  },
  {
    name: "Lê Hoàng C",
    title: "Giảng viên AI & Data",
    image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800",
    experience: "10+ năm",
    students: 7100,
    rating: 4.8,
    social: {
      linkedin: "#",
      github: "#",
    },
  },
];

export default function TeachersSection() {
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-gradient-to-l from-indigo-900 via-purple-900 to-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Đội ngũ giảng viên
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Học cùng những chuyên gia hàng đầu Việt Nam
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map((teacher, i) => (
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
                  <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
                </div>
              ) : (
                <>
                  {/* Lottie Wave (only on hover) */}
                  {hoveredId === i && (
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                      <Player
                        src="https://assets5.lottiefiles.com/packages/lf20_jwlppoey.json"
                        loop={false}
                        autoplay
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative p-6 pb-0">
                    <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full p-1 group-hover:scale-110 transition-transform duration-500">
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                        <Award className="w-3 h-3 fill-current mr-1" />
                        {teacher.experience}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 pt-4 text-center space-y-3">
                    <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-pink-400 font-medium">{teacher.title}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center">
                        <Star className="w-3.5 h-3.5 mr-1 text-yellow-400 fill-current" />
                        {teacher.rating}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {teacher.students.toLocaleString()} học viên
                      </span>
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-center space-x-3 pt-3">
                      {teacher.social.facebook && (
                        <a
                          href={teacher.social.facebook}
                          className="w-9 h-9 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-facebook hover:text-white transition-all group/social"
                        >
                          <Facebook className="w-4 h-4 group-hover/social:scale-110 transition" />
                        </a>
                      )}
                      {teacher.social.linkedin && (
                        <a
                          href={teacher.social.linkedin}
                          className="w-9 h-9 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-linkedin hover:text-white transition-all group/social"
                        >
                          <Linkedin className="w-4 h-4 group-hover/social:scale-110 transition" />
                        </a>
                      )}
                      {teacher.social.github && (
                        <a
                          href={teacher.social.github}
                          className="w-9 h-9 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-github hover:text-white transition-all group/social"
                        >
                          <Github className="w-4 h-4 group-hover/social:scale-110 transition" />
                        </a>
                      )}
                    </div>

                    {/* Sparkles */}
                    <div className="flex justify-center space-x-1 pt-2 opacity-0 group-hover:opacity-100 transition">
                      {[...Array(3)].map((_, i) => (
                        <Sparkles
                          key={i}
                          className="w-4 h-4 text-purple-400 animate-pulse"
                          style={{ animationDelay: `${i * 150}ms` }}
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
            href="#all-teachers"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300"
          >
            Xem tất cả giảng viên
            <Sparkles className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
}