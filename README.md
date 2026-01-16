# 🎓 E-Learning Platform - Frontend

Nền tảng học tập trực tuyến toàn diện được xây dựng với [Next.js 16](https://nextjs.org), cung cấp một hệ thống quản lý lớp học hiện đại với các công cụ học tập, giảng dạy và quản trị đầy đủ.

## 📋 Mục Lục
- [Các Chức Năng Chính](#-các-chức-năng-chính)
- [Bắt Đầu](#-bắt-đầu)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)

## 🎯 Các Chức Năng Chính

### 1. **Xác Thực & Quản Lý Tài Khoản**

#### 🔐 Đăng Nhập/Đăng Ký
- Đăng nhập email/mật khẩu an toàn
- Đăng ký tài khoản mới với xác minh email
- Hỗ trợ nhiều vai trò: Học sinh, Giảng viên, Quản trị viên
- Lưu token xác thực an toàn

#### 👤 Quản Lý Thông Tin Cá Nhân
- Xem và chỉnh sửa thông tin hồ sơ (tên, email, số điện thoại, địa chỉ)
- Quản lý ảnh đại diện (upload ảnh mới)
- **Nhận diện khuôn mặt**: Lưu dữ liệu nhận diện khuôn mặt cho xác thực sinh trắc học
- Thay đổi mật khẩu
- Hiển thị thông tin theo vai trò (môn học chính, ngày sinh, giới tính, v.v.)

---

### 2. **Quản Trị Hệ Thống (Admin)**

#### 📊 Dashboard Quản Trị
- **Quản lý người dùng toàn hệ thống**:
  - Xem danh sách tất cả giảng viên, học sinh
  - Tìm kiếm người dùng theo tên, email, số điện thoại
  - Lọc theo vai trò (giảng viên/học sinh)
  - Xem chi tiết người dùng
  - Chỉnh sửa thông tin người dùng
  - Xóa người dùng
  - Tạo tài khoản người dùng mới

- **Giao diện quản lý toàn diện** với modal:
  - Modal xem chi tiết người dùng
  - Modal chỉnh sửa thông tin
  - Modal tạo tài khoản mới
  - Phân trang dữ liệu

---

### 3. **Quản Lý Lớp Học**

#### 📚 Trang Chủ Giáo Viên & Học Sinh
- Hiển thị danh sách lớp học của người dùng
- Thẻ lớp học với thông tin cơ bản (tên, mã lớp, giáo viên)
- Truy cập nhanh vào các lớp học
- Giao diện khác nhau cho giáo viên (quản lý) và học sinh (tham gia)

#### 🚪 Trang Chi Tiết Lớp Học
- **Thông tin lớp học**:
  - Tên lớp, mã lớp, mô tả
  - Tên giáo viên, học kỳ
  - Ngày tạo lớp

- **Phòng học ảo (Classroom)**:
  - Tạo phòng học cho lớp
  - Xem phòng học đang hoạt động
  - Kiểm tra trạng thái phòng học
  - Tham gia phòng học (học sinh)
  - Quản lý phòng học (giáo viên)

---

### 4. **Bài Tập & Nộp Bài**

#### 📝 Quản Lý Bài Tập (Giáo Viên)
- Tạo bài tập mới với:
  - Tiêu đề, nội dung mô tả
  - Tệp đính kèm (tài liệu, hướng dẫn)
  - Thời gian bắt đầu và kết thúc
  - Trạng thái bài tập

- Xem danh sách bài tập theo lớp
- Quản lý bài nộp của học sinh
- Chấm điểm bài tập
- Ghi chú/phản hồi cho học sinh

#### ✏️ Nộp Bài Tập (Học Sinh)
- Xem danh sách bài tập của lớp
- Xem chi tiết bài tập (nội dung, tệp đính kèm, hạn chót)
- Nộp bài tập với:
  - Nội dung viết
  - Tệp tài liệu đính kèm
  - Thời gian tự động ghi nhận
  
- Theo dõi trạng thái bài nộp:
  - Đã nộp / Chưa nộp / Trễ hạn
  - Xem điểm và phản hồi từ giáo viên
  - Tìm kiếm bài tập theo tiêu đề
  - Xem lịch sử nộp bài

---

### 5. **Điểm Số & Xếp Hạng**

#### 📊 Quản Lý Điểm (Giáo Viên)
- Nhập/chỉnh sửa điểm cho học sinh
- Quản lý nhiều hình thức đánh giá (bài tập, bài kiểm tra, tham gia lớp)
- Xem thống kê điểm lớp học
- Tính điểm trung bình, điểm cao nhất, thấp nhất

#### 📈 Xem Điểm (Học Sinh)
- Xem điểm của các bài tập đã nộp
- Xem bảng điểm tổng hợp
- Theo dõi tiến độ học tập
- Phân tích điểm theo từng loại bài tập

---

### 6. **Điểm Danh & Quản Lý Tham Dự**

#### ✅ Quản Lý Điểm Danh (Giáo Viên)
- Tạo buổi học và ghi điểm danh
- Theo dõi học sinh vắng mặt
- Xem báo cáo vắng mặt của lớp
- Quản lý lý do vắng mặt của học sinh

#### 📍 Xem Điểm Danh (Học Sinh)
- Xem lịch sử điểm danh cá nhân
- Theo dõi số buổi có mặt / vắng mặt
- Xem chi tiết ngày giờ điểm danh

---

### 7. **Kỳ Thi & Kiểm Tra Trực Tuyến**

#### 📋 Quản Lý Bài Thi (Giáo Viên)
- Tạo bài thi mới với:
  - Tiêu đề, mô tả, thời gian làm bài
  - Cách thức thi (trắc nghiệm, tự luận)
  
- Quản lý câu hỏi thi
- Tạo ngân hàng câu hỏi
- Chấm bài thi tự động/thủ công
- Xem kết quả thi chi tiết

#### 🎯 Làm Bài Thi Trực Tuyến (Học Sinh)
- Truy cập danh sách bài thi
- Xem thông tin chi tiết bài thi
- Làm bài thi trực tuyến trong thời gian quy định
- **Xác thực khuôn mặt**: Xác minh danh tính thông qua nhận diện khuôn mặt trước khi bắt đầu thi
- Xem kết quả và điểm ngay sau khi hoàn thành
- Xem lời giải và phân tích kết quả thi

---

### 8. **Tài Liệu & Tài Nguyên Học Tập**

#### 📄 Quản Lý Tài Liệu (Giáo Viên)
- Tải lên tài liệu học tập (PDF, Word, hình ảnh, v.v.)
- Tổ chức tài liệu theo thư mục/danh mục
- Xóa, chỉnh sửa metadata tài liệu
- Chia sẻ tài liệu với lớp học

#### 📥 Truy Cập Tài Liệu (Học Sinh)
- Xem danh sách tài liệu của lớp
- Tải xuống tài liệu
- Xem trước tài liệu (preview)
- Tìm kiếm tài liệu theo tên

---

### 9. **Lộ Trình Học Tập**

#### 🗺️ Tạo & Quản Lý Lộ Trình (Giáo Viên)
- Tạo lộ trình học tập chi tiết với các chương/phần
- Định nghĩa thứ tự học tập và yêu cầu trước
- Thêm tài liệu và bài tập vào từng phần
- Xem tiến độ học sinh theo lộ trình

#### 🎓 Theo Dõi Lộ Trình (Học Sinh)
- Xem lộ trình học tập của lớp
- Theo dõi tiến độ hoàn thành từng phần
- Truy cập tài liệu và bài tập theo lộ trình
- Hiểu được mục tiêu học tập và yêu cầu

---

### 10. **Quản Lý Xin Phép & Nghỉ Phép**

#### 🙏 Xin Phép (Học Sinh)
- Nộp đơn xin phép/nghỉ học
- Ghi rõ lý do và ngày xin phép
- Theo dõi trạng thái đơn xin phép (chờ duyệt/được duyệt/từ chối)

#### ✔️ Duyệt Xin Phép (Giáo Viên)
- Xem danh sách đơn xin phép từ học sinh
- Duyệt hoặc từ chối đơn xin phép
- Ghi chú lý do duyệt/từ chối
- Tự động cập nhật trạng thái điểm danh

---

### 11. **Ngân Hàng Câu Hỏi**

#### ❓ Quản Lý Câu Hỏi (Giáo Viên)
- Tạo/chỉnh sửa câu hỏi (trắc nghiệm, tự luận)
- Phân loại câu hỏi theo chủ đề/mức độ khó
- Quản lý đáp án và lời giải
- Tái sử dụng câu hỏi cho nhiều bài thi

#### 📚 Truy Cập Ngân Hàng Câu Hỏi
- Xem danh sách câu hỏi (học sinh chỉ xem khi cần)
- Tìm kiếm câu hỏi theo chủ đề

---

### 12. **Quản Lý Học Sinh & Sinh Viên**

#### 👥 Quản Lý Danh Sách Học Sinh (Giáo Viên)
- Xem danh sách học sinh của lớp
- Xem chi tiết thông tin từng học sinh
- Phân tích sự tham gia của học sinh
- Theo dõi hiệu suất học tập cá nhân

---

### 13. **Nhân Diện Khuôn Mặt & Xác Thực Sinh Trắc Học**

#### 🔐 Đăng Ký Khuôn Mặt (Học Sinh)
- Chụp ảnh khuôn mặt để đăng ký
- Lưu dữ liệu nhận diện vào hệ thống
- Xác minh quá trình đăng ký

#### 🎯 Xác Thực Trước Thi
- Sử dụng camera để xác minh danh tính
- Kiểm tra khuôn mặt trước khi vào phòng thi
- Ngăn chặn gian lận thi cử
- Xác thực lần lượt trước khi bắt đầu làm bài

---

### 14. **Giao Tiếp & Thông Báo**

#### 💬 Nhắn Tin Trực Tiếp
- Gửi tin nhắn giữa giáo viên và học sinh
- Thảo luận trực tuyến trong lớp
- Thông báo quan trọng từ giáo viên

#### 🔔 Hệ Thống Thông Báo
- Nhận thông báo về:
  - Bài tập mới được tạo
  - Bài nộp được chấm điểm
  - Kỳ thi sắp diễn ra
  - Thay đổi từ giáo viên
- Quản lý cài đặt thông báo

---

### 15. **Phòng Học Ảo (Zego Cloud Integration)**

#### 📹 Gọi Video/Học Trực Tuyến
- Tạo phòng họp/lớp học ảo
- Hỗ trợ gọi video nhóm
- Chia sẻ màn hình
- Ghi âm/ghi hình buổi học
- Hỗ trợ từ Zego UiKit Prebuilt

---

### 16. **Giao Diện Người Dùng Hiện Đại**

#### 🎨 Thiết Kế & Trải Nghiệm
- Giao diện đáp ứng (responsive) cho mobile/tablet/desktop
- Thanh điều hướng (Navbar) toàn cục
- Chân trang (Footer) có thông tin liên hệ
- Hình ảnh và biểu tượng thân thiện (Lucide Icons)
- Hoạt ảnh mịn mà (Framer Motion)
- Tối ưu hóa hiệu suất tải trang

---

### 17. **Tính Năng Bổ Sung**

#### 🔍 Tìm Kiếm & Lọc
- Tìm kiếm toàn cục cho học sinh, giáo viên, tài liệu
- Lọc theo nhiều tiêu chí (lớp, ngày, trạng thái, v.v.)
- Sắp xếp kết quả tìm kiếm

#### 📱 Bảng Điều Khiển (Dashboard)
- Tổng quan thông tin cho giáo viên và học sinh
- Thẻ tóm tắt (Statistics Cards)
- Lịch sắp tới
- Bài tập chưa làm
- Thông báo gần đây

---

## 🚀 Bắt Đầu

### Yêu Cầu
- Node.js 18+ và npm/yarn/pnpm
- Trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)

### Cài Đặt & Chạy

1. **Clone dự án**
```bash
git clone <repository-url>
cd fe-learning
```

2. **Cài đặt dependencies**
```bash
npm install
# hoặc
yarn install
# hoặc
pnpm install
```

3. **Cấu hình biến môi trường**
Tạo file `.env.local` trong thư mục gốc:
```env
NEXT_PUBLIC_API=http://localhost:8080/education
```

4. **Chạy development server**
```bash
npm run dev
# hoặc
yarn dev
# hoặc
pnpm dev
```

5. **Mở trong trình duyệt**
Truy cập [http://localhost:3000](http://localhost:3000)

### Build cho Production

```bash
npm run build
npm start
# hoặc
yarn build
yarn start
```

---

## 📁 Cấu Trúc Dự Án

```
fe-learning/
├── app/                           # Next.js App Router
│   ├── page.tsx                  # Trang chủ
│   ├── layout.tsx                # Layout chính
│   ├── login/                    # Trang đăng nhập
│   ├── register/                 # Trang đăng ký
│   ├── confirmEmail/             # Xác nhận email
│   ├── homePage/                 # Trang chủ cho các vai trò
│   │   ├── studentHomePage.tsx   # Dashboard học sinh
│   │   ├── teacherHomePage.jsx   # Dashboard giáo viên
│   │   ├── unloginHomePage.jsx   # Trang chủ chưa đăng nhập
│   │   └── page.tsx
│   ├── classPage/                # Trang lớp học (giáo viên)
│   │   ├── assignments/          # Quản lý bài tập
│   │   ├── attendance/           # Quản lý điểm danh
│   │   ├── documents/            # Quản lý tài liệu
│   │   ├── exams/                # Quản lý bài thi
│   │   ├── grades/               # Quản lý điểm
│   │   ├── learning-roadmap/     # Quản lý lộ trình
│   │   ├── leave-requests/       # Quản lý xin phép
│   │   ├── question-bank/        # Quản lý ngân hàng câu hỏi
│   │   ├── grade-submissions/    # Chấm điểm nộp bài
│   │   ├── students/             # Danh sách học sinh
│   │   └── page.tsx
│   ├── studentClassPage/         # Trang lớp học (học sinh)
│   │   └── page.tsx
│   ├── studentClassAction/       # Các hành động của học sinh
│   │   ├── AssignmentAction/     # Nộp bài tập
│   │   ├── AttandenceAction/     # Xem điểm danh
│   │   ├── DocumentAction/       # Xem tài liệu
│   │   ├── ExamAction/           # Làm bài thi (form)
│   │   ├── ExamOnlineAction/     # Làm bài thi trực tuyến
│   │   ├── FacialAuthentication/ # Xác thực khuôn mặt
│   │   ├── LearningRoadmapAction/# Theo dõi lộ trình
│   │   └── ScoreAction/          # Xem điểm
│   ├── teacherClassManagement/   # Component quản lý giáo viên
│   │   ├── AssignmentManagementPage.tsx
│   │   ├── AttandenceManagementPage.tsx
│   │   ├── DocumentManagementPage.tsx
│   │   ├── ExamManagementPage.tsx
│   │   ├── GradeStudentSubmissionPage.tsx
│   │   ├── LearningRoadmapPage.tsx
│   │   ├── LeaveRequestManagementPage.tsx
│   │   ├── QuestionManagementPage.tsx
│   │   ├── ScoreManagementPage.tsx
│   │   └── StudentMagementPage.tsx
│   ├── adminDashboard/           # Dashboard quản trị
│   ├── userInfo/                 # Trang thông tin cá nhân
│   └── classRoom/                # Phòng học ảo
├── components/                    # React Components
│   ├── Navbar.tsx               # Thanh điều hướng
│   ├── Footer.tsx               # Chân trang
│   ├── Avatar.tsx               # Component ảnh đại diện
│   ├── ClassCard.jsx            # Thẻ lớp học
│   ├── ClassDetailInfo.jsx      # Thông tin chi tiết lớp
│   ├── ClassManagement.jsx      # Quản lý lớp
│   ├── StudentClassManagement.tsx # Quản lý lớp (học sinh)
│   ├── DashboardClass.tsx       # Dashboard lớp
│   ├── AnnouncementCard.jsx     # Thẻ thông báo
│   ├── Messenger.tsx            # Giao diện nhắn tin
│   ├── MessagingModal.tsx       # Modal nhắn tin
│   ├── Notification.jsx         # Hiển thị thông báo
│   ├── Portal.tsx               # Portal cho modal
│   ├── HeroSlider.tsx           # Slider trang chủ
│   ├── FeaturedCourses.tsx      # Khóa học nổi bật
│   ├── TeachersSection.tsx      # Danh sách giáo viên
│   ├── CaseStudies.tsx          # Trường hợp học tập
│   ├── CourseSection.tsx        # Phần khóa học
│   ├── PrimaryRoadmap.tsx       # Lộ trình chính
│   ├── ChildRoadmap.tsx         # Lộ trình con
│   ├── TimelineItem.tsx         # Mục timeline
│   └── ... (các component khác)
├── lib/                          # Utilities & Helpers
├── styles/
│   └── globals.css              # Kiểu CSS toàn cục
├── public/                       # Tài nguyên tĩnh
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.ts               # Next.js config
├── tailwind.config.ts           # Tailwind CSS config
├── postcss.config.mjs           # PostCSS config
└── README.md                    # Tài liệu này
```

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend Framework
- **Next.js 16.0.1** - React framework với SSR/SSG
- **React 19.2.0** - Thư viện UI
- **TypeScript 5** - Ngôn ngữ lập trình

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **PostCSS 4** - Công cụ CSS
- **Lucide React** - Icon library
- **Framer Motion 12.23.24** - Thư viện hoạt ảnh

### Tính Năng Nâng Cao
- **Zego Cloud UIKit 2.17.1** - Video conferencing & streaming
- **STOMP.js 7.2.1** - WebSocket protocol cho real-time messaging
- **Lottie React 2.4.1** - Hiệu ứng animation

### Công Cụ Phát Triển
- **ESLint 9** - Code linter
- **Node.js 18+** - Runtime

---

## 🔗 Kết Nối API

Ứng dụng kết nối với backend API tại:
- **Base URL**: `http://localhost:8080/education`
- **Auth Token**: Lưu trong `localStorage` với key `accessToken`
- **User Data**: Lưu trong `localStorage` với key `user` (JSON)

---

## 📝 Ghi Chú Phát Triển

### Biến Môi Trường Cần Thiết
```env
NEXT_PUBLIC_API=http://localhost:8080/education
```

### Scripts Sẵn Có
- `npm run dev` - Chạy development server
- `npm run build` - Build cho production
- `npm start` - Chạy production server
- `npm run lint` - Chạy ESLint

---

## 📄 License

Dự án này là bộ phận của Đề Án Tốt Nghiệp (DATN) và được cấp phép dành riêng cho mục đích giáo dục.

---

## 👥 Liên Hệ & Hỗ Trợ

Để được hỗ trợ hoặc báo cáo vấn đề, vui lòng liên hệ với nhóm phát triển.
