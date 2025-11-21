"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface JoinResponse {
  signalingUrl: string;
  roomId: string;
  userId: number;
  userRole: "TEACHER" | "STUDENT";
  token: string;
  iceServers: { urls: string; username?: string; credential?: string }[];
}

interface Participant {
  sessionId: string;
  userId: number;
  displayName: string;
  role: "TEACHER" | "STUDENT";
  stream?: MediaStream;
  isMuted: boolean;
  isHandRaised: boolean;
}

interface ControlMessage {
  type: "JOIN" | "LEAVE" | "CHAT" | "RAISE_HAND" | "LOWER_HAND";
  fromUser: string;
  fromSession?: string;
  text?: string;
  displayName?: string;
  role?: string;
}

export default function ClassroomPage() {
  const params = useParams();
  const roomCode = params?.roomCode as string;

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // State
  const [joinInfo, setJoinInfo] = useState<JoinResponse | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [messages, setMessages] = useState<Array<{ from: string; text: string; time: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [myId, setMyId] = useState<number | null>(null);
  const [myDisplayName, setMyDisplayName] = useState("Bạn");
  const [myRole, setMyRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy token + user từ localStorage
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) {
      setError("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      setMyId(user.id);
      setMyDisplayName(user.preferred_username || user.name || `User ${user.id}`);
      setMyRole(user.role || "STUDENT");
    } catch {
      setError("Lỗi đọc thông tin người dùng");
      setLoading(false);
    }
  }, []);

  // Join room
  useEffect(() => {
    if (!myId || !roomCode) return;

    fetch(`http://localhost:8080/education/api/rooms/${roomCode}/join?userId=${myId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject("Không thể vào phòng"))
      .then(data => {
        if (data.code !== 1000) throw new Error(data.message);
        setJoinInfo(data.result);
        setMyRole(data.result.userRole);
      })
      .catch(err => setError(err.message || "Lỗi tham gia phòng"))
      .finally(() => setLoading(false));
  }, [myId, roomCode]);

  // WebSocket + STOMP
  useEffect(() => {
    if (!joinInfo) return;

    const token = joinInfo.token;
    let wsUrl = joinInfo.signalingUrl;
    if (!wsUrl.includes("/education/ws")) {
      wsUrl = wsUrl.replace(/\/ws.*$/, "/education/ws");
    }
    const urlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(urlWithToken),
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: str => console.log("[STOMP]", str),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("WebSocket Connected");

      // Subscribe signaling
      client.subscribe(`/topic/signaling/${joinInfo.roomId}`, msg => {
        const data = JSON.parse(msg.body);
        handleSignaling(data);
      });

      // Subscribe control
      client.subscribe(`/topic/control/${joinInfo.roomId}`, msg => {
        const data: ControlMessage = JSON.parse(msg.body);
        handleControl(data);
      });

      // Gửi thông báo JOIN với tên thật
      client.publish({
        destination: `/app/control/${joinInfo.roomId}`,
        body: JSON.stringify({
          type: "JOIN",
          displayName: myDisplayName,
          role: myRole,
        }),
      });

      // Thêm chính mình vào danh sách
      setParticipants(prev => new Map(prev).set("local", {
        sessionId: "local",
        userId: myId!,
        displayName: myDisplayName,
        role: myRole,
        isMuted: false,
        isHandRaised: false,
        stream: localStreamRef.current || undefined,
      }));
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      void client.deactivate();
    };
  }, [joinInfo, myId, myDisplayName, myRole]);

  // Camera & Mic
  useEffect(() => {
    if (!joinInfo) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // Cập nhật stream local
        setParticipants(prev => {
          const map = new Map(prev);
          const local = map.get("local");
          if (local) map.set("local", { ...local, stream });
          return map;
        });
      })
      .catch(err => console.error("Camera/Mic error:", err));
  }, [joinInfo]);

  const attachStreamToVideo = (element: HTMLVideoElement | null, stream?: MediaStream) => {
    if (!element) return;
    if (stream) {
      if (element.srcObject !== stream) {
        element.srcObject = stream;
      }
    } else if (element.srcObject) {
      element.srcObject = null;
    }
  };

  // Xử lý control message
  const handleControl = (msg: ControlMessage) => {
    const sessionId = msg.fromSession || "unknown";

    if (msg.type === "JOIN") {
      setParticipants(prev => {
        const map = new Map(prev);
        map.set(sessionId, {
          sessionId,
          userId: 0,
          displayName: msg.displayName || "Unknown",
          role: (msg.role as "TEACHER" | "STUDENT") || "STUDENT",
          stream: undefined,
          isMuted: false,
          isHandRaised: false,
        });
        return map;
      });

      setMessages(prev => [...prev, {
        from: msg.displayName || "Ai đó",
        text: "đã tham gia phòng học",
        time: new Date().toLocaleTimeString(),
      }]);
    }

    if (msg.type === "CHAT") {
      setMessages(prev => [...prev, {
        from: msg.displayName || msg.fromUser,
        text: msg.text || "",
        time: new Date().toLocaleTimeString(),
      }]);
    }

    if (msg.type === "RAISE_HAND") {
      setParticipants(prev => {
        const map = new Map(prev);
        const p = map.get(sessionId);
        if (p) map.set(sessionId, { ...p, isHandRaised: true });
        return map;
      });
    }
  };

  // WebRTC Signaling (giữ nguyên logic cũ, chỉ sửa nhẹ)
  const handleSignaling = async (msg: any) => {
    // Logic WebRTC giữ nguyên như cũ của bạn, chỉ cần đảm bảo fromSession đúng
    // (Bạn có thể giữ nguyên hàm cũ, chỉ cần thêm fromSession vào message nếu cần)
  };

  const sendChat = () => {
    if (!chatInput.trim() || !stompClientRef.current) return;
    stompClientRef.current.publish({
      destination: `/app/control/${joinInfo?.roomId}`,
      body: JSON.stringify({
        type: "CHAT",
        text: chatInput,
        displayName: myDisplayName,
      }),
    });
    setChatInput("");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Đang vào phòng...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-red-900 text-white">{error}</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 overflow-auto">
        {Array.from(participants.values()).map(p => (
          <div key={p.sessionId} className="relative bg-black rounded-xl overflow-hidden shadow-lg">
            {p.stream ? (
              <video
                ref={el => {
                  if (p.sessionId === "local") {
                    localVideoRef.current = el;
                  }
                  attachStreamToVideo(el, p.stream);
                }}
                autoPlay
                muted={p.sessionId === "local"}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-6xl font-bold bg-gray-800">
                {p.displayName[0]}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.displayName}</p>
                  <p className="text-xs opacity-75">{p.role === "TEACHER" ? "Giáo viên" : "Học sinh"}</p>
                </div>
                {p.isHandRaised && <span className="text-2xl">Giơ tay</span>}
              </div>
            </div>
            {p.sessionId === "local" && (
              <div className="absolute top-2 right-2 bg-blue-600 px-3 py-1 rounded-full text-xs">Bạn</div>
            )}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Phòng: {roomCode}</h2>
          <p className="text-sm text-gray-400">{participants.size} người đang tham gia</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className="text-sm">
              <span className="font-bold text-blue-400">{m.from}: </span>
              <span>{m.text}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-gray-700 rounded px-4 py-2 outline-none"
          />
          <button onClick={sendChat} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">Gửi</button>
        </div>
      </div>
    </div>
  );
}