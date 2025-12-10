"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  ArrowLeft,
  Loader2,
  Camera,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Upload,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: string;
  role: string;
  primarySubject: string;
  avatar: string;
  dob: string;
}

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const USER_INFO_API = `${BASE_HTTP}/api/users/getUserInfo`;
const SAVE_IDENTITY_API = "http://localhost:8000/api/save-identity";

function formatDate(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatGender(gender: string) {
  const genderMap: Record<string, string> = {
    MALE: "Nam",
    FEMALE: "Nữ",
    OTHER: "Khác",
  };
  return genderMap[gender] || gender;
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    TEACHER: "Giảng viên",
    STUDENT: "Sinh viên",
    ADMIN: "Quản trị viên",
  };
  return roleMap[role] || role;
}

function formatSubject(subject: string) {
  const subjectMap: Record<string, string> = {
    COMPUTER_SCIENCE: "Khoa học máy tính",
    MATHEMATICS: "Toán học",
    PHYSICS: "Vật lý",
    CHEMISTRY: "Hóa học",
    BIOLOGY: "Sinh học",
    ENGLISH: "Tiếng Anh",
    LITERATURE: "Văn học",
    HISTORY: "Lịch sử",
  };
  return subjectMap[subject] || subject;
}

export default function UserInfoPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (typeof window === "undefined") return;

      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(USER_INFO_API, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || data.code !== 1000 || !data.result) {
          throw new Error(
            data?.message || "Không thể tải thông tin người dùng. Vui lòng thử lại."
          );
        }

        setUserInfo(data.result);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải thông tin người dùng. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!showCameraModal) {
      // Cleanup when modal closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
      setCapturedImage(null);
      setUploadError(null);
      setUploadSuccess(false);
      return;
    }

    let mounted = true;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => {
                if (mounted) setCameraReady(true);
              })
              .catch((err) => {
                console.error("Error playing video:", err);
                if (mounted) setUploadError("Không thể phát video từ camera");
              });
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (mounted) {
          setUploadError(
            err instanceof Error
              ? err.message
              : "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập."
          );
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCameraModal]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setUploadError(null);
    setUploadSuccess(false);
    setSuccessMessage(null);
  };

  const convertToBase64 = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const handleUploadIdentity = async () => {
    if (!capturedImage || !userInfo) {
      setUploadError("Vui lòng chụp ảnh trước khi xác nhận");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const base64Image = convertToBase64(capturedImage);
      const saveIdentifyImage = {
        username: userInfo.username,
        faceIdentifyImage: base64Image,
      };

      const response = await fetch(SAVE_IDENTITY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveIdentifyImage),
      });

      const data = await response.json();
      console.log("Upload identity response:", data);
      console.log("Response status:", data.status);
      console.log("Response message:", data.message);

      // Check if response indicates success
      if (data && data.status === "success") {
        console.log("Setting upload success to true");
        setUploadSuccess(true);
        setSuccessMessage(data.message || "Ảnh xác minh đã được lưu thành công!");
        setUploadError(null);
        
        // Show success message for 3 seconds before closing
        setTimeout(() => {
          setShowCameraModal(false);
          setCapturedImage(null);
          setUploadSuccess(false);
          setSuccessMessage(null);
          setUploadError(null);
        }, 3000);
      } else {
        throw new Error(data?.message || data?.error || "Không thể lưu ảnh xác minh. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error uploading identity image:", err);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi lưu ảnh xác minh. Vui lòng thử lại."
      );
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Lỗi</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/homePage")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header với nút quay lại */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Avatar và thông tin cơ bản */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={userInfo.avatar || "/avatar-default.png"}
                    alt={fullName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                  />
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{fullName}</h2>
                <p className="text-slate-500 mb-4">{userInfo.email}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-semibold text-sm mb-4">
                  <GraduationCap className="w-4 h-4" />
                  {formatRole(userInfo.role)}
                </div>
                <button
                  onClick={() => setShowCameraModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-5 h-5" />
                  Upload ảnh xác minh
                </button>
              </div>
            </div>
          </div>

          {/* Card thông tin chi tiết */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin cá nhân */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Tên đăng nhập
                    </p>
                    <p className="text-slate-900 font-semibold text-base font-mono">
                      {userInfo.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Email
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {userInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {userInfo.phoneNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex-shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Ngày sinh
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {formatDate(userInfo.dob)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Giới tính
                    </p>
                    <p className="text-slate-900 font-semibold text-base">
                      {formatGender(userInfo.gender)}
                    </p>
                  </div>
                </div>

                {userInfo.role === "TEACHER" && userInfo.primarySubject && (
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                        Môn học chính
                      </p>
                      <p className="text-slate-900 font-semibold text-base">
                        {formatSubject(userInfo.primarySubject)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            {userInfo.address && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  Địa chỉ
                </h3>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium text-base leading-relaxed">
                      {userInfo.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <Footer />

      {/* Camera Modal for Identity Photo */}
      <AnimatePresence>
        {showCameraModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCameraModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Chụp ảnh xác minh</h2>
                      <p className="text-indigo-100 text-sm">
                        Chụp ảnh khuôn mặt để xác minh danh tính
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCameraModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Lưu ý khi chụp ảnh:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Khuôn mặt phải rõ ràng và ở chính giữa khung hình</li>
                        <li>Không được quá mở hoặc quá gần camera</li>
                        <li>Đảm bảo ánh sáng đủ để nhìn rõ khuôn mặt</li>
                        <li>Ảnh chất lượng tốt sẽ giúp quá trình xác thực chính xác hơn</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 flex flex-col justify-center">
                  {uploadSuccess ? (
                    // 1. KHI THÀNH CÔNG: Chỉ hiện thông báo lớn ở giữa
                    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">Thành công!</h3>
                      <p className="text-slate-600 text-center max-w-md">
                        {successMessage || "Ảnh xác minh đã được lưu thành công."}
                      </p>
                      <p className="text-slate-400 text-sm mt-8">
                        Cửa sổ sẽ tự động đóng sau giây lát...
                      </p>
                    </div>
                  ) : (
                    // 2. KHI CHƯA THÀNH CÔNG: Giữ nguyên logic cũ
                    <>
                      {/* Error Message */}
                      {uploadError && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-red-700 text-sm">{uploadError}</p>
                        </div>
                      )}

                      {!capturedImage ? (
                        // Camera Preview
                        <div className="space-y-6">
                          {/* ... Giữ nguyên code phần Camera Preview ... */}
                          <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${!cameraReady ? "hidden" : "block"}`}
                              />
                              {!cameraReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10">
                                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                  <p>Đang khởi động camera...</p>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={capturePhoto}
                                disabled={!cameraReady || isUploading}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Camera className="w-5 h-5" />
                                Chụp ảnh
                              </button>
                            </div>
                        </div>
                      ) : (
                        // Captured Image Preview
                        <div className="space-y-6">
                          {/* ... Giữ nguyên code phần Image Preview ... */}
                          <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                              <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex gap-4 justify-center">
                              <button
                                onClick={retakePhoto}
                                disabled={isUploading}
                                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RotateCcw className="w-5 h-5" />
                                Chụp lại
                              </button>
                              <button
                                onClick={handleUploadIdentity}
                                disabled={isUploading}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUploading ? (
                                  <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Xác nhận
                                  </>
                                )}
                              </button>
                            </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Hidden canvas */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

