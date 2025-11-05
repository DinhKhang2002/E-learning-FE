"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import clsx from "clsx";

const slides = [
  {
    image: "/slide1.jpg",
    title: "Khám phá hàng trăm khóa học chất lượng cao",
    desc: "Phát triển kỹ năng của bạn ngay hôm nay!",
  },
  {
    image: "/slide2.jpg",
    title: "Học mọi lúc, mọi nơi",
    desc: "Truy cập kho học liệu phong phú của chúng tôi.",
  },
  {
    image: "/slide3.jpg",
    title: "Cùng giảng viên hàng đầu Việt Nam",
    desc: "Trải nghiệm học tập thực tiễn và hiệu quả.",
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={clsx(
              "absolute inset-0 transition-all duration-1000 ease-in-out",
              i === current
                ? "opacity-100 transform translate-x-0"
                : "opacity-0",
              i === current
                ? ""
                : i === (current - 1 + slides.length) % slides.length
                ? "-translate-x-full"
                : "translate-x-full"
            )}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6 max-w-7xl mx-auto">
              <div
                className={clsx(
                  "max-w-4xl mx-auto space-y-6 transform transition-all duration-1000 delay-300",
                  isTransitioning && i === current
                    ? "translate-y-0 opacity-100"
                    : i === current
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                )}
                onTransitionEnd={() => i === current && setIsTransitioning(false)}
              >
                {/* Title */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    {slide.title}
                  </span>
                </h1>

                {/* Description */}
                <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mt-4">
                  {slide.desc}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                  <a
                    href="#featured"
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <PlayCircle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Bắt đầu học ngay
                  </a>
                  <a
                    href="#about"
                    className="inline-flex items-center px-8 py-4 bg-white bg-opacity-10 backdrop-blur-md text-white font-medium rounded-full border border-white border-opacity-30 hover:bg-opacity-20 hover:border-opacity-50 transition-all duration-300"
                  >
                    Tìm hiểu thêm
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-opacity-20 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white bg-opacity-10 backdrop-blur-md flex items-center justify-center text-white hover:bg-opacity-20 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={clsx(
              "w-3 h-3 rounded-full transition-all duration-500",
              i === current
                ? "bg-gradient-to-r from-pink-500 to-purple-600 w-10 shadow-lg shadow-purple-500/50"
                : "bg-white bg-opacity-40 hover:bg-opacity-70"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white border-opacity-40 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white bg-opacity-60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}