interface CourseSectionProps {
  title: string;
  highlight?: boolean;
}

const courses = [
  { id: 1, title: "Lập trình Java cơ bản", image: "/course1.jpg" },
  { id: 2, title: "Spring Boot nâng cao", image: "/course2.jpg" },
  { id: 3, title: "React và Next.js thực chiến", image: "/course3.jpg" },
];

export default function CourseSection({ title }: CourseSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-4">
            <img src={c.image} alt={c.title} className="rounded-lg h-40 w-full object-cover" />
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            <button className="mt-2 text-indigo-600 hover:underline">Xem chi tiết →</button>
          </div>
        ))}
      </div>
    </div>
  );
}
