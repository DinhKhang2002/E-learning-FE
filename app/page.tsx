"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cubicBezier } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import CourseSection from "@/components/CourseSection";
import CaseStudies from "@/components/CaseStudies";
import TeachersSection from "@/components/TeachersSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  const { scrollY } = useScroll();
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax nhẹ
  const y1 = useTransform(scrollY, [0, 1000], [0, -80]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -40]);

  // Fade-in animation – ĐÃ SỬA easeOut → cubic-bezier
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: {
      duration: 0.8,
      ease: cubicBezier(0.25, 0.1, 0.25, 1),
    },
  };

  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <div className="relative">
        <HeroSlider />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent -z-10"></div>
      </div>

      {/* Main Content - 90% width, centered, rounded */}
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 w-full">
        {/* Featured Courses */}
        <motion.section
          id="featured"
          className="py-16 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent rounded-3xl my-8"
          {...fadeInUp}
          style={{ y: y1 }}
        >
          <CourseSection title="Khóa học đáng chú ý" highlight />
        </motion.section>

        {/* Popular Courses */}
        <motion.section
          id="popular"
          className="py-16 bg-gradient-to-b from-transparent via-pink-900/10 to-transparent rounded-3xl my-8"
          {...fadeInUp}
          style={{ y: y2 }}
        >
          <CourseSection title="Khóa học phổ biến nhất" />
        </motion.section>

        {/* Case Studies */}
        <motion.section
          id="case-studies"
          className="py-16 bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent rounded-3xl my-8"
          {...fadeInUp}
        >
          <CaseStudies />
        </motion.section>

        {/* Teachers */}
        <motion.section
          id="teachers"
          className="py-16 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent rounded-3xl my-8"
          {...fadeInUp}
        >
          <TeachersSection />
        </motion.section>
      </div>

      {/* Footer */}
      <Footer />

      {/* Background Glow Effects */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 right-1/4 w-96 h-96 bg-pink-600 rounded-full filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>
    </main>
  );
}