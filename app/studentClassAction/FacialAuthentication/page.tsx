"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Đảm bảo bạn đã khai báo biến môi trường này trong .env
const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const JOIN_ROOM_API = `${BASE_HTTP}/api/rooms/join`;
const WS_VERIFY_URL = "ws://127.0.0.1:8000/ws/verify";

export default function FacialAuthenticationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Các ref đã được định nghĩa kiểu dữ liệu chuẩn TypeScript
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [classRoomPath, setClassRoomPath] = useState<string | null>(null);

  // Lấy params từ URL và LocalStorage
  useEffect(() => {
    const roomIdParam = searchParams.get("roomId");
    const classRoomPathParam = searchParams.get("classRoomPath");
    
    setRoomId(roomIdParam);
    setClassRoomPath(classRoomPathParam);

    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("accessToken");
      const storedUser = window.localStorage.getItem("user");
      
      if (token) {
        setAuthToken(token);
      } else {
        setError("Vui lòng đăng nhập lại");
        return;
      }

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserId(user.id || null);
        } catch (err) {
          console.error("Failed to parse user:", err);
          setError("Không thể lấy thông tin người dùng");
        }
      }
    }
  }, [searchParams]);

  // Khởi tạo Camera
  useEffect(() => {
    let mounted = true; // Biến này giúp tránh memory leak khi component unmount

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });

        // Nếu component đã bị hủy thì dừng stream ngay
        if (!mounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        streamRef.current = stream;

        // Logic sửa lỗi: videoRef.current bây giờ CHẮC CHẮN tồn tại vì thẻ video luôn được render
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;

          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                if (mounted) setCameraReady(true);
              })
              .catch((err) => {
                console.error("Error playing video:", err);
                if (mounted) setError("Không thể phát video từ camera");
              });
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (mounted) {
            setError(
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
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
    setError(null);
  };

  const convertToBase64 = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const verifyFace = async () => {
    if (!capturedImage || !authToken) {
      setError("Vui lòng chụp ảnh trước khi xác thực");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const base64Image = convertToBase64(capturedImage);
      const ws = new WebSocket(WS_VERIFY_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(base64Image);
      };

      ws.onmessage = async (event) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.status === "ok") {
            ws.close();
            wsRef.current = null;

            if (roomId && userId && classRoomPath && authToken) {
              try {
                const apiResponse = await fetch(JOIN_ROOM_API, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ roomId: roomId, userId: userId }),
                });

                const data = await apiResponse.json();
                if (!apiResponse.ok || data.code !== 1000) {
                  console.warn("Failed to save join room history:", data?.message);
                }
                
                // Redirect
                window.location.href = classRoomPath;
              } catch (err) {
                console.error("Error calling join room API:", err);
                setError("Xác thực thành công nhưng lỗi tham gia phòng.");
                setIsVerifying(false);
              }
            } else {
              setError("Thiếu thông tin phòng học.");
              setIsVerifying(false);
            }
          } else {
            setError("Khuôn mặt không khớp. Vui lòng thử lại.");
            setIsVerifying(false);
            ws.close();
            wsRef.current = null;
          }
        } catch (err) {
          console.error("Error parsing WebSocket response:", err);
          setError("Lỗi xử lý dữ liệu từ server.");
          setIsVerifying(false);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Lỗi kết nối server xác thực.");
        setIsVerifying(false);
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch (err) {
      console.error("Error in verifyFace:", err);
      setError("Có lỗi xảy ra khi xác thực.");
      setIsVerifying(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Navbar />

      <div className="flex-1 pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Xác thực khuôn mặt</h1>
              <p className="text-blue-100">
                Vui lòng chụp ảnh để xác nhận danh tính trước khi tham gia cuộc họp
              </p>
            </div>

            <div className="p-6 md:p-8">
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {isVerifying && (
                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <p className="text-blue-700 text-sm">
                    Đang xác thực khuôn mặt của bạn...
                  </p>
                </div>
              )}

              {/* Phần hiển thị Camera hoặc Ảnh đã chụp */}
              {!capturedImage ? (
                <div className="space-y-6">
                  <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                    
                    {/* --- SỬA LỖI Ở ĐÂY --- */}
                    {/* Video luôn hiển thị trong DOM, chỉ ẩn bằng CSS nếu chưa sẵn sàng */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!cameraReady ? 'hidden' : 'block'}`}
                    />

                    {/* Loading spinner hiển thị khi camera chưa sẵn sàng */}
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
                      disabled={!cameraReady || isVerifying}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      Chụp ảnh
                    </button>
                  </div>
                </div>
              ) : (
                // Hiển thị ảnh đã chụp
                <div className="space-y-6">
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
                      disabled={isVerifying}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Chụp lại
                    </button>
                    <button
                      onClick={verifyFace}
                      disabled={isVerifying}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Đang xác thực...
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

              {/* Canvas ẩn dùng để chụp ảnh */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  );
}