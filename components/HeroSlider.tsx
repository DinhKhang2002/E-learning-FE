"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import clsx from "clsx";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80",
    title: "Khám phá thư viện khóa học đột phá",
    desc: "Lộ trình rõ ràng, bài giảng thực tiễn và dự án thực tế giúp bạn làm chủ kỹ năng nhanh hơn.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1920&q=80",
    title: "Học tập linh hoạt trên mọi thiết bị",
    desc: "Tiếp cận kiến thức chất lượng mọi lúc, mọi nơi với trải nghiệm học tập cá nhân hóa.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=80",
    title: "Kết nối cùng đội ngũ giảng viên hàng đầu",
    desc: "Tư vấn trực tiếp, giải đáp 1-1 và cập nhật xu hướng mới nhất trong ngành.",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const nextSlide = () => {
    setIsTransitioning(true);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    if (index === current) return;
    setIsTransitioning(true);
    setCurrent(index);
  };

  return (
    <div className="relative w-full h-screen min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] overflow-hidden rounded-b-[48px] bg-slate-900">
      {/* Slides */}
      <div className="relative h-full w-full">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={clsx(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              i === current ? "opacity-100" : "opacity-0"
            )}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onTransitionEnd={() => i === current && setIsTransitioning(false)}
          >
            {/* Fallback khi ảnh chưa load */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 animate-pulse" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/50 to-sky-900/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

            {/* Content - CĂN CHÍNH GIỮA HOÀN HẢO */}
            <div className="relative z-10 flex h-full items-center justify-center px-6 sm:px-8">
              <div className="mx-auto max-w-4xl text-center">
                <div
                  className={clsx(
                    "space-y-6 transition-all duration-1000 delay-200",
                    i === current
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  )}
                >
                  {/* Title */}
                  <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                    <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="mt-4 text-base text-slate-200 sm:text-lg md:text-xl">
                    {slide.desc}
                  </p>

                  {/* CTA Buttons */}
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <a
                      href="#featured"
                      className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_-20px_rgba(14,165,233,0.65)] transition-all duration-300 hover:shadow-[0_20px_50px_-18px_rgba(56,189,248,0.75)] sm:px-10 sm:text-base"
                    >
                      <PlayCircle className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                      Bắt đầu học ngay
                    </a>
                    <a
                      href="#about"
                      className="inline-flex items-center justify-center rounded-full border border-white border-opacity-50 bg-white/10 px-8 py-4 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 sm:px-10 sm:text-base"
                    >
                      Tìm hiểu thêm
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="group absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
      </button>
      <button
        onClick={nextSlide}
        className="group absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={clsx(
              "h-2.5 rounded-full transition-all duration-500",
              i === current
                ? "w-10 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 shadow-lg shadow-sky-500/50"
                : "w-2.5 bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-10 w-6 items-center justify-center rounded-full border-2 border-white/40">
          <div className="h-3 w-1 animate-pulse rounded-full bg-white/80"></div>
        </div>
      </div>
    </div>
  );
}