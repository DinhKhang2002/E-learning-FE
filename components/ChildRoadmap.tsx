"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
} from "lucide-react";
// Fallback image component
const SafeImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
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
        <span className="text-white font-bold text-sm">{alt?.charAt(0) || "?"}</span>
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

interface ChildRoadmapProps {
  roadmap: Roadmap;
  parentId: number;
  onAddChild: (parentId: number) => void;
  onEdit: (roadmap: Roadmap) => void;
  onDelete: (id: number) => void;
  position: { x: number; y: number };
  onPositionChange: (id: number, position: { x: number; y: number }) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export default function ChildRoadmap({
  roadmap,
  parentId,
  onAddChild,
  onEdit,
  onDelete,
  position,
  onPositionChange,
  isDragging,
  onDragStart,
  onDragEnd,
}: ChildRoadmapProps) {
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
        className={`relative w-64 group ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background with Gradient */}
        <div className="relative rounded-xl overflow-hidden shadow-xl border-2 border-white/20 backdrop-blur-sm">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${roadmap.backgroundImage})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-indigo-900/70 to-purple-900/70" />
          </div>

          {/* Content */}
          <div className="relative p-4 min-h-[160px] flex flex-col">
            {/* Header with Icon and Actions */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden">
                  {roadmap.iconImage ? (
                    <SafeImage
                      src={roadmap.iconImage}
                      alt={roadmap.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {roadmap.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-xs font-semibold text-white border border-white/30">
                  #{roadmap.roadmapIndex}
                </span>
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
                  className="p-1 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded transition-colors border border-white/30"
                  title="Thêm nhánh con"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(roadmap);
                  }}
                  className="p-1 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded transition-colors border border-white/30"
                  title="Sửa"
                >
                  <Edit className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(roadmap.id);
                  }}
                  className="p-1 bg-red-500/80 backdrop-blur-md hover:bg-red-600/80 rounded transition-colors border border-white/30"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="p-1 bg-white/20 backdrop-blur-md rounded border border-white/30 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="flex-1 mb-3">
              <h4 className="text-base font-bold text-white mb-1.5 line-clamp-2">
                {roadmap.title}
              </h4>
              <p className="text-xs text-white/80 line-clamp-2">
                {roadmap.description}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/20">
              <div className="text-xs text-white/60">
                {roadmap.children.length > 0 && (
                  <span>{roadmap.children.length} nhánh con</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity -z-10" />
      </div>
    </motion.div>
  );
}

