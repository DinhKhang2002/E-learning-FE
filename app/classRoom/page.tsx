"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    ZegoUIKitPrebuilt?: {
      generateKitTokenForTest: (
        appID: number,
        serverSecret: string,
        roomID: string,
        userID: string,
        userName: string
      ) => string;
      create: (token: string) => {
        joinRoom: (config: {
          container: HTMLElement | null;
          sharedLinks?: Array<{ name: string; url: string }>;
          scenario: { mode: string };
          turnOnMicrophoneWhenJoining?: boolean;
          turnOnCameraWhenJoining?: boolean;
          showMyCameraToggleButton?: boolean;
          showMyMicrophoneToggleButton?: boolean;
          showAudioVideoSettingsButton?: boolean;
          showScreenSharingButton?: boolean;
          showTextChat?: boolean;
          showUserList?: boolean;
          maxUsers?: number;
          layout?: string;
          showLayoutButton?: boolean;
        }) => void;
      };
      VideoConference: string;
    };
  }
}

const BASE_HTTP = process.env.NEXT_PUBLIC_API;

const END_CALL_API = (roomId: string | number) =>
  `${BASE_HTTP}/api/rooms/${roomId}/callout`;

export default function ClassRoomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEndingCall, setIsEndingCall] = useState(false);

  const roomCode = searchParams.get("roomCode");
  const roomId = searchParams.get("roomId") || roomCode;
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName") || "User";
  const classId = searchParams.get("classId");

  console.log("--------------------------------");
  console.log(roomCode, roomId, userId, userName);

  // Get user role from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userRaw = window.localStorage.getItem("user");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserRole(user.role || null);
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
  }, []);

  const handleEndCall = async () => {
    if (!roomId) {
      alert("Không tìm thấy thông tin phòng họp");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn kết thúc cuộc họp này?")) {
      return;
    }

    setIsEndingCall(true);
    try {
      const token = window.localStorage.getItem("accessToken");
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        setIsEndingCall(false);
        return;
      }

      const response = await fetch(END_CALL_API(roomId), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể kết thúc cuộc họp. Vui lòng thử lại.");
      }

      // Redirect to class page
      if (classId) {
        router.push(`/classPage?id=${classId}`);
      } else {
        router.push("/homePage");
      }
    } catch (err) {
      console.error("Failed to end call:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Không thể kết thúc cuộc họp. Vui lòng thử lại."
      );
      setIsEndingCall(false);
    }
  };

  const appID = process.env.NEXT_PUBLIC_ZEGO_APP_ID
    ? parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
    : 1059704281;
  const serverSecret =
    process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET ||
    "8a643e58596b31f615c0de0e4dc9860e";

  // Load Zego SDK script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if script is already loaded
    if (window.ZegoUIKitPrebuilt) {
      setScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src*="zego-uikit-prebuilt"]'
    );
    if (existingScript) {
      // Wait for script to load
      existingScript.addEventListener("load", () => {
        setScriptLoaded(true);
      });
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js";
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError("Không thể tải SDK cuộc họp. Vui lòng kiểm tra kết nối mạng.");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Zego room when script is loaded
  useEffect(() => {
    if (!roomId || !userId) {
      setError("Thiếu thông tin phòng họp. Vui lòng quay lại trang lớp học.");
      setLoading(false);
      return;
    }

    if (!scriptLoaded || !window.ZegoUIKitPrebuilt) {
      return;
    }

    try {
      const decodedUserName = decodeURIComponent(userName);
      const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        userId,
        decodedUserName
      );

      const zp = window.ZegoUIKitPrebuilt.create(kitToken);

      const currentUrl = window.location.origin + window.location.pathname;
      const roomUrl = `${currentUrl}?roomCode=${roomCode}&roomId=${roomId}&userId=${userId}&userName=${encodeURIComponent(decodedUserName)}`;

      zp.joinRoom({
        container: containerRef.current,
        sharedLinks: [
          {
            name: "Liên kết chia sẻ",
            url: roomUrl,
          },
        ],
        scenario: {
          mode: window.ZegoUIKitPrebuilt.VideoConference,
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: true,
        showTextChat: true,
        showUserList: true,
        maxUsers: 50,
        layout: "Sidebar",
        showLayoutButton: true,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error initializing Zego room:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể khởi tạo phòng họp. Vui lòng thử lại."
      );
      setLoading(false);
    }
    //save class Path
  }, [roomId, userId, userName, roomCode, appID, serverSecret, scriptLoaded]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <Link
              href="/homePage"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 pt-16 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">
                Đang khởi tạo phòng họp...
              </p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full h-[calc(100vh-4rem)]"
          style={{ minHeight: "600px" }}
        />
        {userRole === "TEACHER" && (
          <div className="flex justify-center items-center mt-4">
            <button
              type="button"
              disabled={isEndingCall}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleEndCall}
            >
              {isEndingCall ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kết thúc...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Kết thúc cuộc họp
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

