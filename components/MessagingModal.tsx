"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@stomp/stompjs";
import {
  X,
  Send,
  Paperclip,
  Smile,
  Loader2,
  Image as ImageIcon,
  FileText,
  Download,
  Reply,
} from "lucide-react";

// Giữ nguyên các constant API của bạn
const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const BASE_WS = process.env.NEXT_PUBLIC_WS;

const CONVERSATION_API = `${BASE_HTTP}/chat/conversation`;
const SEND_MESSAGE_API = `${BASE_HTTP}/chat/messages`;
const MESSAGES_API = `${BASE_HTTP}/chat/messages`;
// Lưu ý: WS_URL phải là ws:// nếu không dùng SSL, wss:// nếu có SSL
const WS_URL = `${BASE_WS}/ws`; 

// ... Giữ nguyên các Interface User, FileAttachment, Message, Conversation ...
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface FileAttachment {
  id: number | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Message {
  id: number;
  sender: User;
  content: string;
  attachFileId: FileAttachment | null;
  replyTo: Message | null;
  emotion: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface Conversation {
  conversationId: number;
  sender: User;
  receiver: User;
  updatedAt: string;
  listMessages: Message[];
}

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  toUserId: number;
  toUserName: string;
  toUserAvatar: string;
  authToken: string;
}

const EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

export default function MessagingModal({
  isOpen,
  onClose,
  currentUserId,
  toUserId,
  toUserName,
  toUserAvatar,
  authToken,
}: MessagingModalProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Ref để giữ client, tránh re-render gây mất kết nối
  const stompClientRef = useRef<Client | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Fetch conversation logic
  const fetchConversation = useCallback(async () => {
    if (!authToken || !isOpen) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${CONVERSATION_API}?currentUserId=${currentUserId}&toUserId=${toUserId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok && data.code === 1000 && data.result) {
        setConversation(data.result);
        if (data.result.conversationId) {
          const messagesResponse = await fetch(
            `${MESSAGES_API}?conversationId=${data.result.conversationId}&limit=20`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          const messagesData = await messagesResponse.json();
          if (messagesResponse.ok && messagesData.code === 1000 && messagesData.result) {
            setMessages(messagesData.result || []);
          }
        } else {
          setMessages(data.result.listMessages || []);
        }
      } else {
        console.error("Failed to fetch conversation:", data.message);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentUserId, toUserId, isOpen]);

  // Fetch messages (used for pagination later if needed)
  const fetchMessages = useCallback(async () => {
    if (!authToken || !conversation) return;
    try {
      const response = await fetch(
        `${MESSAGES_API}?conversationId=${conversation.conversationId}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok && data.code === 1000 && data.result) {
        setMessages(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [authToken, conversation]);

  // --- WEBSOCKET CONNECTION LOGIC ---
  useEffect(() => {
    // Chỉ kết nối khi Modal mở và đã có thông tin Conversation
    if (!isOpen || !authToken || !conversation?.conversationId) return;

    // Nếu đã có client đang chạy thì không tạo mới
    if (stompClientRef.current && stompClientRef.current.active) {
        return;
    }

    const client = new Client({
      brokerURL: WS_URL,
      // QUAN TRỌNG: Gửi token qua connectHeaders để Spring Security xác thực
      connectHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // debug: (str) => console.log(str), // Bật debug để xem log kết nối nếu cần

      onConnect: () => {
        console.log("✅ STOMP connected to Conversation " + conversation.conversationId);

        // Subscribe đúng topic backend gửi về
        client.subscribe(
          `/topic/conversation/${conversation.conversationId}`,
          (message) => {
            try {
              const messageData = JSON.parse(message.body);
              if (messageData.id) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === messageData.id)) return prev;
                  return [...prev, messageData];
                });
              }
            } catch (error) {
              console.error("Error parsing STOMP message:", error);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers['message']);
        console.error("Details:", frame.body);
      },
      onWebSocketError: (event) => {
        // Lỗi này thường do URL sai, hoặc server từ chối kết nối (401/403)
        // Kiểm tra tab Network -> WS trong DevTools để xem mã lỗi cụ thể
        console.error("❌ WebSocket error:",  event);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup khi modal đóng hoặc conversation thay đổi
    return () => {
      if (stompClientRef.current) {
        console.log("Deactivating STOMP client...");
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [isOpen, authToken, conversation?.conversationId]); 

  // Initial fetch when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConversation();
    } else {
      // Reset states on close
      setMessages([]);
      setConversation(null);
      setMessageContent("");
      setSelectedFile(null);
      setReplyTo(null);
      // Client cleanup handled by the WebSocket useEffect logic
    }
  }, [isOpen, fetchConversation]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && !selectedFile) || isSending) return;
    if (!authToken || !conversation) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("sender", currentUserId.toString());
      formData.append("conversationId", conversation.conversationId.toString());
      formData.append("content", messageContent.trim() || "");
      if (selectedFile) formData.append("file", selectedFile);
      if (replyTo) formData.append("replyTo", replyTo.id.toString());

      const response = await fetch(SEND_MESSAGE_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.code === 1000 && data.result) {
        // Backend trả về listMessages mới nhất (bao gồm tin nhắn vừa gửi)
        // Tuy nhiên, vì đã có Websocket, ta có thể không cần setMessages ở đây
        // nếu backend publish ngay tin nhắn đó vào topic.
        // Để UI mượt mà, ta cứ set tạm, WebSocket sẽ update đè hoặc bỏ qua nếu trùng ID.
        setMessages(data.result.listMessages || []); 
        
        setMessageContent("");
        setSelectedFile(null);
        setReplyTo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ... Các hàm handleFileSelect, handleEmojiSelect, formatTime ...
  // (Giữ nguyên logic JSX render như cũ)
  // ... Code render ...
  
  // Rút gọn phần render cho ngắn gọn câu trả lời, bạn giữ nguyên JSX của mình
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    };
  
    const handleEmojiSelect = (emoji: string) => {
      setMessageContent((prev) => prev + emoji);
      setShowEmojiPicker(false);
    };
  
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    };
  
    const getFileIcon = (fileType: string) => {
      if (fileType.startsWith("image/")) return ImageIcon;
      return FileText;
    };
  
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

  if (!isOpen) return null;

  return (
    // ... Copy nguyên phần return JSX của bạn vào đây ...
    // Đảm bảo không thay đổi cấu trúc UI
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-[85vh] rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
            {/* ... Nội dung Modal ... */}
            {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={toUserAvatar || "/default-avatar.png"}
                alt={toUserName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              />
              <div>
                <h3 className="font-bold text-slate-900">{toUserName}</h3>
                <p className="text-xs text-slate-600">Đang hoạt động</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender.id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isCurrentUser && (
                        <img
                          src={message.sender.avatar || "/default-avatar.png"}
                          alt={message.sender.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isCurrentUser
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : "bg-white text-slate-900 border border-slate-200"
                        } shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => !isCurrentUser && setReplyTo(message)}
                      >
                        {message.replyTo && (
                          <div
                            className={`mb-2 p-2 rounded-lg border-l-4 ${
                              isCurrentUser
                                ? "bg-white/20 border-white/50"
                                : "bg-slate-100 border-slate-300"
                            }`}
                          >
                            <p className="text-xs font-semibold opacity-80">
                              {message.replyTo.sender.firstName}{" "}
                              {message.replyTo.sender.lastName}
                            </p>
                            <p className="text-xs opacity-70 line-clamp-2">
                              {message.replyTo.content}
                            </p>
                          </div>
                        )}
                        {message.content && (
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                        {message.attachFileId && (
                          <div className="mt-2 p-2 bg-white/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = getFileIcon(
                                  message.attachFileId.fileType
                                );
                                return <Icon className="w-4 h-4" />;
                              })()}
                              <span className="text-sm font-medium truncate">
                                {message.attachFileId.fileName}
                              </span>
                              <span className="text-xs opacity-70">
                                ({formatFileSize(message.attachFileId.fileSize)})
                              </span>
                            </div>
                            <a
                              href={message.attachFileId.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs underline hover:opacity-80"
                            >
                              <Download className="w-3 h-3" />
                              Tải xuống
                            </a>
                          </div>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            isCurrentUser ? "text-white/70" : "text-slate-500"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyTo && (
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-slate-600" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Đang trả lời {replyTo.sender.firstName}{" "}
                    {replyTo.sender.lastName}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {replyTo.content}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
            {selectedFile && (
              <div className="mb-2 p-2 bg-slate-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getFileIcon(selectedFile.type);
                    return <Icon className="w-4 h-4 text-slate-600" />;
                  })()}
                  <span className="text-sm text-slate-700 truncate">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="p-1 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-20 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-5 h-5" />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSending || (!messageContent.trim() && !selectedFile)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-20 right-4 w-80 h-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 overflow-y-auto z-10"
            >
              <div className="grid grid-cols-8 gap-2">
                {EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-2xl hover:bg-slate-100 rounded-lg p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}