"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import Image from "next/image";

// Fallback image component
const SafeImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
      {!hasError && imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          onError={() => {
            setHasError(true);
            setImgSrc(null);
          }}
          className="w-full h-full object-cover"
          {...props}
        />
      ) : (
        <span className="text-white font-bold text-lg">{alt?.charAt(0) || "?"}</span>
      )}
    </div>
  );
};

interface FileRecord {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folder: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
}

interface Roadmap {
  id: number;
  title: string;
  description: string;
  fileRecord: FileRecord | null;
  backgroundImage: string;
  iconImage: string;
  children: Roadmap[];
  roadmapIndex: number;
  createdBy: string;
  createdAt: string;
}

interface PrimaryRoadmapProps {
  roadmap: Roadmap;
  onAddChild: (parentId: number) => void;
  onEdit: (roadmap: Roadmap) => void;
  onDelete: (id: number) => void;
  onExpand: (id: number) => void;
  isExpanded: boolean;
  position: { x: number; y: number };
  onPositionChange: (id: number, position: { x: number; y: number }) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function PrimaryRoadmap({
  roadmap,
  onAddChild,
  onEdit,
  onDelete,
  onExpand,
  isExpanded,
  position,
  onPositionChange,
  isDragging,
  onDragStart,
  onDragEnd,
}: PrimaryRoadmapProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    onDragStart();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    onPositionChange(roadmap.id, {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onDragEnd();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      transition={{ duration: 0.3 }}
      className="absolute"
      style={{ left: 0, top: 0 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={`relative w-80 group ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background Image with Overlay */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${roadmap.backgroundImage})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-purple-900/80 to-indigo-900/80" />
          </div>

          {/* Content */}
          <div className="relative p-6 min-h-[200px] flex flex-col">
            {/* Header with Icon and Actions */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden">
                  {roadmap.iconImage ? (
                    <SafeImage
                      src={roadmap.iconImage}
                      alt={roadmap.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {roadmap.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white border border-white/30">
                      #{roadmap.roadmapIndex}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(roadmap.id);
                  }}
                  className="p-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-lg transition-colors border border-white/30"
                  title="Thêm nhánh con"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(roadmap);
                  }}
                  className="p-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-lg transition-colors border border-white/30"
                  title="Sửa"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(roadmap.id);
                  }}
                  className="p-1.5 bg-red-500/80 backdrop-blur-md hover:bg-red-600/80 rounded-lg transition-colors border border-white/30"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
                <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg border border-white/30 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="flex-1 mb-4">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {roadmap.title}
              </h3>
              <p className="text-sm text-white/80 line-clamp-2">
                {roadmap.description}
              </p>
            </div>

            {/* Footer with Expand Button */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="text-xs text-white/60">
                {roadmap.children.length} nhánh con
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(roadmap.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-lg transition-colors border border-white/30 text-white text-sm font-medium"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Thu gọn
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mở rộng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity -z-10" />
      </div>
    </motion.div>
  );
}

