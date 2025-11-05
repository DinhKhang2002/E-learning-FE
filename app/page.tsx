import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import CourseSection from "@/components/CourseSection";
import CaseStudies from "@/components/CaseStudies";
import TeachersSection from "@/components/TeachersSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <HeroSlider />
      <section id="featured" className="py-16">
        <CourseSection title="Khóa học đáng chú ý" highlight />
      </section>
      <section id="popular" className="py-16 bg-white">
        <CourseSection title="Khóa học phổ biến nhất" />
      </section>
      <section id="case-studies" className="py-16 bg-gray-50">
        <CaseStudies />
      </section>
      <section id="teachers" className="py-16 bg-white">
        <TeachersSection />
      </section>
      <Footer />
    </main>
  );
}
