import { Facebook, Linkedin, Youtube, Mail, Phone, MapPin, ChevronRight } from "lucide-react";

const footerLinks = [
  {
    title: "Khóa học",
    links: ["Lập trình", "Thiết kế", "Marketing", "Ngoại ngữ"],
  },
  {
    title: "Hỗ trợ",
    links: ["Hỏi đáp", "Hướng dẫn", "Điều khoản", "Chính sách"],
  },
  {
    title: "Công ty",
    links: ["Giới thiệu", "Tuyển dụng", "Blog", "Liên hệ"],
  },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Logo & Description */}
          <div className="space-y-4">
            <a href="#" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                E-Learning
              </span>
            </a>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Nền tảng học trực tuyến hàng đầu, giúp bạn phát triển kỹ năng và chinh phục tương lai.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white bg-opacity-10 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-20 hover:scale-110 transform transition-all duration-300 group"
                >
                  <social.icon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold text-white mb-4 relative inline-block">
                {column.title}
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"></span>
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-all duration-300 group"
                    >
                      <ChevronRight className="w-3 h-3 text-pink-500 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      <span>{link}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4 relative inline-block">
              Liên hệ
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"></span>
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1.5 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="group-hover:text-white transition-colors">
                  support@elearning.com
                </span>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1.5 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="group-hover:text-white transition-colors">
                  1900 123 456
                </span>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 p-1.5 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="group-hover:text-white transition-colors">
                  Hà Nội, Việt Nam
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 mb-6"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} E-Learning Platform. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Made with <span className="text-pink-500">♥</span> by{" "}
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent font-medium">
              Team E-Learning
            </span>
          </p>
        </div>
      </div>

      {/* Background Glow Effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600 rounded-full filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>
    </footer>
  );
}