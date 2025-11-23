"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
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

export default function ClassRoomPage() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const roomCode = searchParams.get("roomCode");
  const roomId = searchParams.get("roomId") || roomCode;
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName") || "User";

  console.log("--------------------------------");
  console.log(roomCode, roomId, userId, userName);

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
      </div>
    </main>
  );
}

