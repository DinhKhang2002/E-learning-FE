export default function TeachersSection() {
  const teachers = [
    { name: "Nguyễn Văn A", image: "/teacher1.jpg", title: "Giảng viên lập trình" },
    { name: "Trần Thị B", image: "/teacher2.jpg", title: "Chuyên gia UX/UI" },
    { name: "Lê Hoàng C", image: "/teacher3.jpg", title: "Giảng viên AI & Data" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h2 className="text-2xl font-bold mb-8">Đội ngũ giảng viên</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        {teachers.map((t) => (
          <div key={t.name} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
            <img src={t.image} alt={t.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
            <h3 className="font-semibold">{t.name}</h3>
            <p className="text-gray-500">{t.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
