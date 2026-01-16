"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Loader2, ArrowLeft, Smile, PhoneOff } from "lucide-react"; // Thêm icon PhoneOff
import Link from "next/link";

// --- START: Interface ---
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
      create: (token: string) => ZegoInstance;
      VideoConference: string;
    };
  }
}

interface ZegoInstance {
  joinRoom: (config: any) => void;
  destroy: () => void;
  sendInRoomCommand?: (command: string, recipients: any[]) => void;
  on?: (event: string, callback: any) => void;
}
// --- END: Interface ---

const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const AI_WS_URL = "ws://localhost:8000/ws/emotion";

const END_CALL_API = (roomId: string | number) =>
  `${BASE_HTTP}/api/rooms/${roomId}/callout`;

export default function ClassRoomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const zegoInstanceRef = useRef<ZegoInstance | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const zegoInitialized = useRef(false);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [peerEmotions, setPeerEmotions] = useState<Record<string, string>>({});
  const [myEmotion, setMyEmotion] = useState<string>("neutral");

  // Params
  const roomCode = searchParams.get("roomCode");
  const roomId = searchParams.get("roomId") || roomCode;
  const userId = searchParams.get("userId");
  const userName = searchParams.get("userName") || "User";
  const classId = searchParams.get("classId");
  const isExam = searchParams.get("isExam") === "true";
  const examClassId = searchParams.get("examClassId");
  const examId = searchParams.get("examId");
  const endTime = searchParams.get("endTime");

  // Lấy role user
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userRaw = window.localStorage.getItem("user");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserRole(user.role || null);
      } catch (err) { console.error(err); }
    }
  }, []);

  // --- LOGIC 1: WebSocket AI ---
  useEffect(() => {
    if (!userId || !userName) return;

    const ws = new WebSocket(AI_WS_URL);
    ws.onopen = () => console.log("Connected to AI Emotion Service");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "success" && data.emotion) {
          setMyEmotion(data.emotion);
          // Gửi emotion cho phòng họp
          if (zegoInstanceRef.current && zegoInstanceRef.current.sendInRoomCommand) {
             const commandData = JSON.stringify({
                type: "EMOTION_UPDATE",
                userId: userId,
                userName: decodeURIComponent(userName),
                emotion: data.emotion
             });
             // Gửi command rỗng [] nghĩa là gửi cho tất cả
             zegoInstanceRef.current.sendInRoomCommand(commandData, []); 
          }
        }
      } catch (e) { console.error("AI WS Parse Error", e); }
    };
    wsRef.current = ws;
    return () => {
      ws.close();
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [userId, userName]);

  // --- LOGIC 2: Capture Frame (ĐÃ TĂNG TỐC ĐỘ) ---
  const startEmotionAnalysis = useCallback(() => {
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    
    // Đã đổi thành 500ms (0.5 giây) để đạt hiệu ứng Real-time
    // Lưu ý: Nếu server Python quá tải, hãy tăng lên 800 hoặc 1000
    captureIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      const videos = document.querySelectorAll("video");
      let localVideo: HTMLVideoElement | null = null;
      
      // Tìm video của chính mình (thường là muted)
      videos.forEach((v) => {
        if (v.muted && !v.paused && v.videoWidth > 0) localVideo = v;
      });

      if (localVideo) {
        const canvas = document.createElement("canvas");
        // Giữ kích thước nhỏ (300px) để gửi nhanh qua socket
        canvas.width = 300; 
        canvas.height = 225;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(localVideo as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
          // Chất lượng ảnh 0.6 là đủ cho AI nhận diện, giúp giảm băng thông
          const base64Image = canvas.toDataURL("image/jpeg", 0.6);
          wsRef.current.send(JSON.stringify({ username: userName, image: base64Image }));
        }
      }
    }, 500); 
  }, [userName]);

  // --- LOGIC 3: Zego Initialization ---
  useEffect(() => {
    if (!roomId || !userId) {
      setError("Thiếu thông tin phòng họp.");
      setLoading(false);
      return;
    }

    const initMeeting = async () => {
      if (zegoInitialized.current) return;
      
      try {
        // Đảm bảo bạn đã chạy: npm install @zegocloud/zego-uikit-prebuilt
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        
        zegoInitialized.current = true;

        const decodedUserName = decodeURIComponent(userName);
        const appID = process.env.NEXT_PUBLIC_ZEGO_APP_ID ? parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID) : 91239007;
        const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "933616504160df12926de3e919ac4934";

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          decodedUserName
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zegoInstanceRef.current = zp;

        const currentUrl = window.location.origin + window.location.pathname;
        const roomUrl = `${currentUrl}?roomCode=${roomCode}&roomId=${roomId}&userId=${userId}&userName=${encodeURIComponent(decodedUserName)}`;

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [{ name: "Liên kết chia sẻ", url: roomUrl }],
          scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: true,
          showUserList: true,
          maxUsers: 50,
          layout: "Sidebar",
          showLayoutButton: true,
          
          onJoinRoom: () => {
             console.log("Joined Room. Starting AI...");
             startEmotionAnalysis();
          },
          onInRoomCommandReceived: (fromUser: any, command: string) => {
             try {
               const data = JSON.parse(command);
               if (data.type === "EMOTION_UPDATE") {
                  setPeerEmotions(prev => ({ ...prev, [data.userName]: data.emotion }));
               }
             } catch(e) { console.error(e); }
          }
        });

        setLoading(false);

      } catch (err) {
        console.error("Zego Init Error:", err);
        setError("Không thể tải phòng họp. Vui lòng reload.");
        setLoading(false);
      }
    };

    initMeeting();

    return () => {
       if (zegoInstanceRef.current) {
           zegoInstanceRef.current.destroy();
           zegoInstanceRef.current = null;
           zegoInitialized.current = false;
       }
    };
  }, [roomId, userId, userName, roomCode, startEmotionAnalysis]);

  // --- Logic End Call ---
  const handleEndCall = async () => {
    if (!roomId) return;
    if (!confirm("Bạn có chắc chắn muốn kết thúc cuộc họp này?")) return;
    
    setIsEndingCall(true);
    try {
      const token = window.localStorage.getItem("accessToken");
      if (token) {
          await fetch(END_CALL_API(roomId), {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
      }
      if (classId) router.push(`/classPage?id=${classId}`);
      else router.push("/homePage");
    } catch (err) {
      console.error(err);
      setIsEndingCall(false);
    }
  };

  // UI Helpers
  const getEmotionColor = (emotion: string) => {
      switch(emotion) {
          case 'happy': return 'text-green-500';
          case 'angry': return 'text-red-500';
          case 'sad': return 'text-blue-500';
          case 'surprise': return 'text-yellow-500';
          case 'fear': return 'text-purple-500';
          default: return 'text-gray-500';
      }
  };

  const translateEmotion = (emotion: string) => {
    const dict: Record<string, string> = {
        happy: "Vui vẻ", angry: "Tức giận", sad: "Buồn", 
        surprise: "Ngạc nhiên", fear: "Sợ hãi", neutral: "Bình thường", disgust: "Ghê tởm"
    };
    return dict[emotion] || emotion;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <p className="text-red-600 font-semibold mb-4">{error}</p>
            <Link href="/homePage" className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
            </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <Navbar isExamRoom={isExam} examClassId={examClassId || undefined} examId={examId || undefined} endTime={endTime || undefined} />
      
      <div className="flex-1 pt-16 relative flex">
        {/* Vùng Video - Không còn nút End Call ở đây */}
        <div className="flex-grow relative bg-gray-100">
            {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-gray-500">Đang vào phòng...</p>
                </div>
            </div>
            )}

            <div
                ref={containerRef}
                className="w-full h-[calc(100vh-4rem)]"
                style={{ width: '100%', height: 'calc(100vh - 4rem)' }} 
            />
        </div>

        {/* Sidebar AI Emotion - Chứa nút End Call ở cuối */}
        <div className="w-72 bg-white border-l border-gray-200 p-4 hidden md:flex md:flex-col h-[calc(100vh-4rem)] shrink-0 shadow-xl z-20">
            {/* Phần nội dung cuộn được */}
            <div className="flex-1 overflow-y-auto pr-1">
                <h3 className="font-bold text-gray-700 mb-5 flex items-center gap-2 text-lg border-b pb-3">
                    <Smile className="w-6 h-6 text-indigo-600" />
                    Cảm xúc lớp học
                </h3>
                
                {/* My Emotion */}
                <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Cảm xúc của bạn</p>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Hiện tại:</span>
                        <span className={`text-lg font-bold capitalize ${getEmotionColor(myEmotion)}`}>
                            {translateEmotion(myEmotion)}
                        </span>
                    </div>
                </div>

                {/* Peer Emotions */}
                <div className="space-y-3">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Thành viên khác</p>
                    {Object.entries(peerEmotions).length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                             <p className="text-sm text-gray-400 italic">Chưa có dữ liệu cảm xúc...</p>
                        </div>
                    )}
                    {Object.entries(peerEmotions).map(([uName, emo]) => (
                        <div key={uName} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all hover:bg-slate-50">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0"></div>
                                <span className="text-sm font-medium truncate max-w-[100px] text-gray-700" title={uName}>{uName}</span>
                            </div>
                            <span className={`text-sm font-bold capitalize ${getEmotionColor(emo)}`}>
                                {translateEmotion(emo)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nút Kết thúc cuộc họp (Luôn hiển thị ở đáy nếu là Teacher) */}
            {userRole === "TEACHER" && (
                <div className="pt-4 mt-2 border-t border-gray-100">
                    <button 
                        onClick={handleEndCall} 
                        disabled={isEndingCall} 
                        className="w-full bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white hover:shadow-md font-semibold transition-all duration-200 group"
                    >
                        {isEndingCall ? (
                            <Loader2 className="w-5 h-5 animate-spin"/>
                        ) : (
                            <PhoneOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        {isEndingCall ? "Đang kết thúc..." : "Kết thúc lớp học"}
                    </button>
                </div>
            )}
        </div>
      </div>
    </main>
  );
}