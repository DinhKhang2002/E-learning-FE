"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  MessageCircle,
  Paperclip,
  Send,
  Smile,
  Loader2,
  PlusCircle,
  Hash,
  UserRound,
  FileText,
  FolderDown,
  Trash2,
  AlertCircle,
} from "lucide-react";

const CLASS_POSTS_API = (classId: string | number) =>
  `http://localhost:8080/education/api/posts/class?classId=${classId}`;
const CREATE_POST_API = "http://localhost:8080/education/api/posts/create";
const UPDATE_POST_API = (postId: string | number) =>
  `http://localhost:8080/education/api/posts/update/${postId}`;
const DELETE_POST_API = (postId: string | number) =>
  `http://localhost:8080/education/api/posts/${postId}`;
const POST_EMOTION_API = "http://localhost:8080/education/api/posts/emotion";
const COMMENTS_BY_POST_API = (postId: string | number) =>
  `http://localhost:8080/education/api/comments/post/${postId}`;
const CREATE_COMMENT_API = "http://localhost:8080/education/api/comments/create";
const DELETE_COMMENT_API = (commentId: string | number) =>
  `http://localhost:8080/education/api/comments/${commentId}`;

const DEFAULT_ICON =
  "https://cdn-icons-png.flaticon.com/256/11265/11265088.png";
const DEFAULT_BACKGROUND =
  "https://png.pngtree.com/thumb_back/fh260/background/20230123/pngtree-background-abstract-instagram-post-gradient-blue-and-orange-image_1539985.jpg";

const BACKGROUND_PRESETS = [
  DEFAULT_BACKGROUND,
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
];

const ICON_PRESETS = [
  DEFAULT_ICON,
  "https://cdn-icons-png.flaticon.com/256/3595/3595455.png",
  "https://cdn-icons-png.flaticon.com/256/3595/3595453.png",
  "https://cdn-icons-png.flaticon.com/256/3595/3595459.png",
];

const EMOTIONS = [
  { key: "LIKE", label: "Thích", emoji: "👍", color: "text-blue-500" },
  { key: "LOVE", label: "Yêu thích", emoji: "❤️", color: "text-pink-500" },
  { key: "HAHA", label: "Haha", emoji: "😂", color: "text-yellow-500" },
  { key: "WOW", label: "Wow", emoji: "😮", color: "text-cyan-500" },
  { key: "SAD", label: "Buồn", emoji: "😢", color: "text-indigo-400" },
  { key: "ANGRY", label: "Phẫn nộ", emoji: "😡", color: "text-red-500" },
] as const;

type EmotionKey = (typeof EMOTIONS)[number]["key"];

interface DashboardClassProps {
  classId?: string | null;
  authToken?: string | null;
  className?: string;
  canCreate?: boolean;
}

interface UserInfo {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface Post {
  id: number;
  poster: UserInfo;
  postTitle: string;
  postContent: string;
  postIcon?: string | null;
  postBackground?: string | null;
  attachFile?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  } | null;
  emotionCounter?: Record<string, number>;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userComment: UserInfo;
}

interface CommentsState {
  data: Comment[];
  loading: boolean;
  error: string | null;
}

export default function DashboardClass({
  classId,
  authToken: authTokenProp,
  className,
  canCreate = false,
}: DashboardClassProps) {
  const [token, setToken] = useState<string | null>(authTokenProp ?? null);
  const [checkedToken, setCheckedToken] = useState<boolean>(Boolean(authTokenProp));
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [creatingPost, setCreatingPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    icon: DEFAULT_ICON,
    background: DEFAULT_BACKGROUND,
    postTypeId: "1",
  });
  const [attachment, setAttachment] = useState<File | null>(null);

  const [commentsState, setCommentsState] = useState<Record<number, CommentsState>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [userEmotions, setUserEmotions] = useState<Record<number, EmotionKey | null>>({});
const [openComments, setOpenComments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
  if (!token) {
    const localToken = window.localStorage.getItem("accessToken");
    if (localToken) {
      setToken(localToken);
    } else {
      setCheckedToken(true);
    }
  } else {
    setCheckedToken(true);
  }

    const storedUser = window.localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (error) {
        console.warn("Failed to parse stored user", error);
      }
    }
}, [token]);

useEffect(() => {
  if (checkedToken && token === null) {
    setPostsLoading(false);
    setPostsError("Không tìm thấy thông tin xác thực để tải nội dung lớp học.");
  }
}, [token, checkedToken]);

  const fetchPosts = useCallback(
    async (tokenValue: string, cId: string) => {
      setPostsLoading(true);
      setPostsError(null);
      try {
        const response = await fetch(CLASS_POSTS_API(cId), {
          headers: {
            Authorization: `Bearer ${tokenValue}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
          throw new Error(data?.message || "Không thể tải bài đăng. Vui lòng thử lại.");
        }

        setPosts(data.result as Post[]);
      } catch (error) {
        setPostsError(
          error instanceof Error ? error.message : "Không thể tải bài đăng. Vui lòng thử lại sau."
        );
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token && classId) {
      fetchPosts(token, classId);
    }
  }, [token, classId, fetchPosts]);

  const handleCreatePost = async () => {
    if (!token || !classId || !currentUser) {
      setPostsError("Thiếu thông tin xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      setPostsError("Vui lòng nhập tiêu đề và nội dung bài đăng.");
      return;
    }

    setCreatingPost(true);
    setPostsError(null);

    try {
      const formData = new FormData();
      formData.append("poster", String(currentUser.id));
      formData.append("classId", classId);
      formData.append("postTypeId", newPost.postTypeId);
      formData.append("postTitle", newPost.title.trim());
      formData.append("postContent", newPost.content.trim());
      formData.append("postIcon", newPost.icon || DEFAULT_ICON);
      formData.append("postBackground", newPost.background || DEFAULT_BACKGROUND);
      if (attachment) {
        formData.append("file", attachment);
      }

      const response = await fetch(CREATE_POST_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(data?.message || "Không thể tạo bài đăng. Vui lòng thử lại.");
      }

      setNewPost({
        title: "",
        content: "",
        icon: DEFAULT_ICON,
        background: DEFAULT_BACKGROUND,
        postTypeId: "1",
      });
      setAttachment(null);
      fetchPosts(token, classId);
    } catch (error) {
      setPostsError(
        error instanceof Error ? error.message : "Không thể tạo bài đăng. Vui lòng thử lại sau."
      );
    } finally {
      setCreatingPost(false);
    }
  };

  const handleReactToPost = async (postId: number, emotion: EmotionKey) => {
    if (!token || !currentUser) return;

    try {
      const response = await fetch(POST_EMOTION_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          userId: currentUser.id,
          emotion,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(data?.message || "Không thể bày tỏ cảm xúc. Vui lòng thử lại.");
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? (data.result as Post) : post))
      );
      setUserEmotions((prev) => ({ ...prev, [postId]: emotion }));
    } catch (error) {
      setPostsError(
        error instanceof Error ? error.message : "Không thể bày tỏ cảm xúc. Vui lòng thử lại."
      );
    }
  };

  const handleToggleComments = async (postId: number) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));

    const isOpening = !openComments[postId];
    if (!isOpening) {
      return;
    }

    if (commentsState[postId]) {
      return;
    }

    setCommentsState((prev) => ({
      ...prev,
      [postId]: { data: [], loading: true, error: null },
    }));

    if (!token) return;

    try {
      const response = await fetch(COMMENTS_BY_POST_API(postId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000 || !Array.isArray(data.result)) {
        throw new Error(data?.message || "Không thể tải bình luận. Vui lòng thử lại.");
      }

      setCommentsState((prev) => ({
        ...prev,
        [postId]: { data: data.result as Comment[], loading: false, error: null },
      }));
    } catch (error) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          data: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Không thể tải bình luận. Vui lòng thử lại.",
        },
      }));
    }
  };

  const handleSubmitComment = async (postId: number) => {
    if (!token || !currentUser) return;
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const response = await fetch(CREATE_COMMENT_API, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          userId: currentUser.id,
          content,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000 || !data.result) {
        throw new Error(data?.message || "Không thể gửi bình luận. Vui lòng thử lại.");
      }

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      // refresh comments
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          data: prev[postId] ? [data.result as Comment, ...prev[postId].data] : [data.result],
          loading: false,
          error: null,
        },
      }));
      // refresh posts to update comment count
      if (token && classId) {
        fetchPosts(token, classId);
      }
    } catch (error) {
      setCommentsState((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || { data: [] }),
          error:
            error instanceof Error
              ? error.message
              : "Không thể gửi bình luận. Vui lòng thử lại.",
        },
      }));
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!token || !canCreate) return;
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?");
    if (!confirmed) return;

    try {
      const response = await fetch(DELETE_POST_API(postId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || data.code !== 1000) {
        throw new Error(data?.message || "Không thể xóa bài đăng. Vui lòng thử lại.");
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      setPostsError(
        error instanceof Error ? error.message : "Không thể xóa bài đăng. Vui lòng thử lại."
      );
    }
  };

  const formattedClassName = useMemo(() => {
    if (!className) return "Lớp học";
    return className.length > 32 ? `${className.slice(0, 32)}...` : className;
  }, [className]);

  if (!classId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-amber-600 font-semibold">
          Không tìm thấy thông tin lớp học để hiển thị Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-teal-50 opacity-80" />
        <div className="relative p-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Dashboard lớp học
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">
                Không gian lớp {formattedClassName}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Cập nhật hoạt động, trao đổi và tương tác cùng học viên
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-lg border border-slate-100">
              <Smile className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">Emotions available</p>
                <p className="text-sm font-semibold text-slate-800">
                  {EMOTIONS.map((emotion) => emotion.emoji).join(" ")}
                </p>
              </div>
            </div>
          </div>

          {canCreate ? (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-semibold shadow-inner">
                  {currentUser?.firstName?.[0] ?? "T"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {currentUser
                      ? `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
                        currentUser.name ||
                        currentUser.email
                      : "Giáo viên"}
                  </p>
                  <p className="text-xs text-slate-500">Chia sẻ bài đăng mới</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tiêu đề bài đăng
                  </label>
                  <input
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Nhập tiêu đề"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Icon bài đăng
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      value={newPost.icon}
                      onChange={(e) =>
                        setNewPost((prev) => ({ ...prev, icon: e.target.value }))
                      }
                      placeholder="URL icon"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-1">
                      {ICON_PRESETS.map((iconUrl) => (
                        <button
                          key={iconUrl}
                          type="button"
                          onClick={() =>
                            setNewPost((prev) => ({ ...prev, icon: iconUrl }))
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                            newPost.icon === iconUrl
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nội dung bài đăng
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Chia sẻ thông tin với lớp học..."
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hình nền
                  </label>
                  <input
                    value={newPost.background}
                    onChange={(e) =>
                      setNewPost((prev) => ({ ...prev, background: e.target.value }))
                    }
                    placeholder="URL hình nền"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {BACKGROUND_PRESETS.map((bgUrl, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          setNewPost((prev) => ({ ...prev, background: bgUrl }))
                        }
                        className={`h-12 w-16 flex-shrink-0 rounded-xl border ${
                          newPost.background === bgUrl
                            ? "border-emerald-500 ring-2 ring-emerald-200"
                            : "border-slate-200"
                        }`}
                        style={{
                          backgroundImage: `url(${bgUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tệp đính kèm
                  </label>
                  <div className="relative rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                    <input
                      id="attachment"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachment(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="attachment"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                      {attachment ? attachment.name : "Chọn tệp đính kèm"}
                    </label>
                    {attachment && (
                      <p className="text-xs text-slate-400 mt-2">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {postsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {postsError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewPost({
                      title: "",
                      content: "",
                      icon: DEFAULT_ICON,
                      background: DEFAULT_BACKGROUND,
                      postTypeId: "1",
                    });
                    setAttachment(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Làm mới
                </button>
                <button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={creatingPost}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {creatingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Đăng bài
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-600">
              <p>
                Đây là không gian để theo dõi các cập nhật quan trọng từ lớp học. Bạn
                có thể tương tác với các bài đăng bằng cảm xúc hoặc bình luận.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-6">
        {postsLoading ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-10 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Đang tải bài đăng...</p>
          </div>
        ) : postsError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Không thể tải bài đăng</p>
            <p className="text-red-500 text-sm mb-4">{postsError}</p>
            {token && classId && (
              <button
                onClick={() => fetchPosts(token, classId)}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Thử lại
              </button>
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-10 text-center text-slate-500">
            Chưa có bài đăng nào trong lớp học này.
          </div>
        ) : (
          posts.map((post) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl shadow-[0_30px_70px_-40px_rgba(15,23,42,0.6)] overflow-hidden"
            >
              <div
                className="h-40 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(160deg, rgba(15,23,42,0.7), rgba(15,23,42,0.1)), url(${post.postBackground || DEFAULT_BACKGROUND})`,
                }}
              />
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={post.poster?.avatar || post.postIcon || DEFAULT_ICON}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover border border-white/60 shadow-lg"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{post.postTitle}</h3>
                      <p className="text-sm text-slate-500">
                        {post.poster
                          ? `${post.poster.firstName ?? ""} ${post.poster.lastName ?? ""}`.trim() ||
                            post.poster.email
                          : "Ẩn danh"}
                        {" · "}
                        {new Date(post.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <p className="text-base text-slate-700 leading-relaxed">{post.postContent}</p>

                {post.attachFile && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center gap-4">
                    <FolderDown className="w-10 h-10 text-slate-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{post.attachFile.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {post.attachFile.fileType} · {(post.attachFile.fileSize / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                    <a
                      href={post.attachFile.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      <FileText className="w-4 h-4" />
                      Xem tệp
                    </a>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    {EMOTIONS.map((emotion) => {
                      const count = post.emotionCounter?.[emotion.key] ?? 0;
                      const isActive = userEmotions[post.id] === emotion.key;
                      return (
                        <button
                          key={emotion.key}
                          type="button"
                          onClick={() => handleReactToPost(post.id, emotion.key)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            isActive
                              ? "border-transparent bg-emerald-500/10 text-emerald-600"
                              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                          }`}
                        >
                          <span>{emotion.emoji}</span>
                          <span>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleComments(post.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Bình luận ({post.commentCount})
                  </button>
                </div>

                {openComments[post.id] && (
                  <div className="space-y-4 rounded-2xl bg-slate-50/80 p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <MessageCircle className="w-4 h-4" />
                      Bình luận
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-inner border border-slate-100 text-slate-500">
                        <UserRound className="w-5 h-5" />
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-200 bg-white flex items-center">
                        <input
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder="Viết bình luận..."
                          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitComment(post.id)}
                          className="px-3 text-emerald-500 hover:text-emerald-600 transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {commentsState[post.id]?.error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {commentsState[post.id]?.error}
                      </div>
                    )}

                    {commentsState[post.id]?.loading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải bình luận...
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {commentsState[post.id]?.data?.length ? (
                          commentsState[post.id].data.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-2xl border border-white bg-white/90 p-3 flex gap-3"
                            >
                              <img
                                src={comment.userComment?.avatar || DEFAULT_ICON}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover border border-slate-100"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {comment.userComment
                                      ? `${comment.userComment.firstName ?? ""} ${
                                          comment.userComment.lastName ?? ""
                                        }`.trim() || comment.userComment.email
                                      : "Người dùng"}
                                  </p>
                                  <span className="text-xs text-slate-400">
                                    {new Date(comment.createdAt).toLocaleString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-2">
                            Chưa có bình luận nào.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}


