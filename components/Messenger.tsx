"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@stomp/stompjs";
import {
  X,
  MessageSquare,
  Search,
  Loader2,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  Download,
  Reply,
} from "lucide-react";

// API & WebSocket Config
const BASE_HTTP = process.env.NEXT_PUBLIC_API;
const BASE_WS = process.env.NEXT_PUBLIC_WS;

const CONVERSATIONS_API = `${BASE_HTTP}/chat/conversation`;
const MESSAGES_API = `${BASE_HTTP}/chat/messages`;
const SEND_MESSAGE_API = `${BASE_HTTP}/chat/messages`;
const WS_URL = `${BASE_WS}/ws`;

// ... Giữ nguyên các Interface ...
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
  id: number;
  toUser: User;
  updatedAt: string;
}

interface MessengerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  authToken: string;
}

const EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"];

export default function Messenger({
  isOpen,
  onClose,
  currentUserId,
  authToken,
}: MessengerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [beforeId, setBeforeId] = useState<number | null>(null);
  
  // Stomp state
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const conversationSubscriptionRef = useRef<any>(null); // Để giữ subscription khi đổi chat

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const conversationsListRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle outside click emoji
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

  // Fetch Conversations
  const fetchConversations = useCallback(
    async (before: number | null = null) => {
      if (!authToken || !isOpen) return;
      setIsLoading(true);
      try {
        let url = `${CONVERSATIONS_API}?userId=${currentUserId}&limit=20`;
        if (before) url += `&before=${before}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (response.ok && data.code === 1000 && data.result) {
          const newConversations = data.result;
          if (before) {
            setConversations((prev) => [...prev, ...newConversations]);
          } else {
            setConversations(newConversations);
          }
          setHasMore(newConversations.length === 20);
          if (newConversations.length > 0) {
            setBeforeId(newConversations[newConversations.length - 1].id);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [authToken, currentUserId, isOpen]
  );

  // Fetch Messages
  const fetchMessages = useCallback(
    async (conversationId: number) => {
      if (!authToken) return;
      setIsLoadingMessages(true);
      try {
        const response = await fetch(
          `${MESSAGES_API}?conversationId=${conversationId}&limit=20`,
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
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [authToken]
  );

  // --- WEBSOCKET CONNECTION (GLOBAL) ---
  useEffect(() => {
    // Chỉ kết nối 1 lần khi mở Modal
    if (!isOpen || !authToken) return;

    const client = new Client({
      brokerURL: WS_URL,
      // QUAN TRỌNG: Connect headers chứa Authorization
      connectHeaders: {
        Authorization: `Bearer ${authToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("✅ STOMP connected global");

        // Subscribe thông báo (Nếu backend có gửi)
        client.subscribe(`/topic/notifications/${currentUserId}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log("New notification:", notification);
            // Reload danh sách hội thoại để cập nhật tin nhắn mới nhất
            fetchConversations(null);
          } catch (error) {
            console.error("Error parsing notification:", error);
          }
        });

        // Set client vào state để dùng cho các conversation cụ thể
        setStompClient(client);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.error("❌ WebSocket error:", event);
      },
    });

    client.activate();

    return () => {
      if (client.connected) {
        console.log("Disconnecting STOMP...");
        client.deactivate();
      }
      setStompClient(null);
    };
  }, [isOpen, authToken, currentUserId, fetchConversations]);

  // --- WEBSOCKET SUBSCRIPTION (PER CONVERSATION) ---
  useEffect(() => {
    // Chỉ subscribe khi đã có client kết nối và đã chọn conversation
    if (!stompClient || !stompClient.connected || !selectedConversation) return;

    // Hủy đăng ký cũ nếu có
    if (conversationSubscriptionRef.current) {
      conversationSubscriptionRef.current.unsubscribe();
      conversationSubscriptionRef.current = null;
    }

    console.log(`Subscribing to /topic/conversation/${selectedConversation.id}`);
    
    // Đăng ký topic mới
    const sub = stompClient.subscribe(
      `/topic/conversation/${selectedConversation.id}`,
      (message) => {
        try {
          const messageData = JSON.parse(message.body);
          if (messageData.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === messageData.id)) return prev;
              return [...prev, messageData];
            });
            // Update lại list conversation để hiển thị snippet tin nhắn mới
            fetchConversations(null);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    );

    conversationSubscriptionRef.current = sub;

    // Cleanup subscription khi unmount hoặc đổi conversation
    return () => {
      if (conversationSubscriptionRef.current) {
        conversationSubscriptionRef.current.unsubscribe();
        conversationSubscriptionRef.current = null;
      }
    };
  }, [selectedConversation, stompClient, fetchConversations]);


  // Initialize on Open
  useEffect(() => {
    if (isOpen) {
      fetchConversations(null);
      setSelectedConversation(null);
      setMessages([]);
    } else {
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setMessageContent("");
      setSelectedFile(null);
      setReplyTo(null);
      setSearchQuery("");
      setBeforeId(null);
      setHasMore(true);
      // Client cleanup handled by main useEffect
    }
  }, [isOpen, fetchConversations]);

  // UI Handlers
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    setMessageContent("");
    setSelectedFile(null);
    setReplyTo(null);
  };

  const handleConversationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      target.scrollHeight - target.scrollTop <= target.clientHeight + 100 &&
      hasMore &&
      !isLoading &&
      beforeId
    ) {
      fetchConversations(beforeId);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && !selectedFile) || isSending || !selectedConversation) return;
    if (!authToken) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("sender", currentUserId.toString());
      formData.append("conversationId", selectedConversation.id.toString());
      formData.append("content", messageContent.trim() || "");
      if (selectedFile) formData.append("file", selectedFile);
      if (replyTo) formData.append("replyTo", replyTo.id.toString());

      const response = await fetch(SEND_MESSAGE_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.code === 1000 && data.result) {
        // Optimistic update hoặc đợi WS
        setMessages(data.result.listMessages || []);
        setMessageContent("");
        setSelectedFile(null);
        setReplyTo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchConversations(null);
      } else {
        alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // ... Helpers ...
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

  const filteredConversations = conversations.filter((conv) => {
    const fullName = `${conv.toUser.firstName} ${conv.toUser.lastName}`.toLowerCase();
    const username = conv.toUser.username.toLowerCase();
    const email = conv.toUser.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || username.includes(query) || email.includes(query);
  });

  if (!isOpen) return null;

  return (
    // Copy JSX return của bạn vào đây, giữ nguyên giao diện
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
          className="relative w-full max-w-6xl h-[90vh] rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Conversations List */}
          <div
            className={`${
              selectedConversation ? "hidden md:flex" : "flex"
            } w-full md:w-1/3 flex-col border-r border-slate-200 bg-slate-50`}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Tin nhắn</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div
              ref={conversationsListRef}
              onScroll={handleConversationsScroll}
              className="flex-1 overflow-y-auto"
            >
              {isLoading && conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Không có cuộc trò chuyện nào</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-green-50 border-l-4 border-l-green-500"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={conversation.toUser.avatar || "/default-avatar.png"}
                        alt={conversation.toUser.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {conversation.toUser.firstName} {conversation.toUser.lastName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(conversation.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && conversations.length > 0 && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-white">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={selectedConversation.toUser.avatar || "/default-avatar.png"}
                    alt={selectedConversation.toUser.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {selectedConversation.toUser.firstName}{" "}
                      {selectedConversation.toUser.lastName}
                    </h3>
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isCurrentUser = message.sender.id === currentUserId;
                    return (
                      <div
                        key={`message-${message.id}-${index}`}
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
                                    const Icon = getFileIcon(message.attachFileId.fileType);
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
                        Đang trả lời {replyTo.sender.firstName} {replyTo.sender.lastName}
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
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center text-slate-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}