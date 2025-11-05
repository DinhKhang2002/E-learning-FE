export default function CaseStudies() {
  const cases = [
    { name: "Ngọc Anh", result: "Tăng 50% kỹ năng sau 3 tháng học", image: "/student1.jpg" },
    { name: "Minh Quân", result: "Trúng tuyển vị trí lập trình viên Java", image: "/student2.jpg" },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 text-center">
      <h2 className="text-2xl font-bold mb-8">Câu chuyện thành công</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {cases.map((c) => (
          <div key={c.name} className="bg-white shadow rounded-xl p-6 hover:shadow-lg transition">
            <img src={c.image} alt={c.name} className="rounded-full w-24 h-24 mx-auto mb-4" />
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-gray-600">{c.result}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
