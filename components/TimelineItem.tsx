// components/TimelineItem.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, Edit, Trash2 } from "lucide-react";

interface TimelineItemProps {
  roadmap: any;
  isActive: boolean;
  isLast: boolean;
  onClick: () => void;
  index: number;
  onEdit: (roadmap: any) => void;
  onDelete: (id: number) => void;
}

export default function TimelineItem({
  roadmap,
  isActive,
  isLast,
  onClick,
  index,
  onEdit,
  onDelete,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 group">
      {/* Vertical Line Connector */}
      {!isLast && (
        <div
          className={`absolute left-[19px] top-10 bottom-[-16px] w-[2px] ${
            isActive ? "bg-gradient-to-b from-violet-500 to-violet-200" : "bg-slate-200"
          } transition-colors duration-300`}
        />
      )}

      {/* Node Indicator */}
      <div className="relative z-10 flex-shrink-0 mt-1">
        <motion.div
          animate={{
            scale: isActive ? 1.1 : 1,
            boxShadow: isActive
              ? "0 0 0 4px rgba(139, 92, 246, 0.2)"
              : "0 0 0 0px rgba(139, 92, 246, 0)",
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
            isActive
              ? "bg-violet-600 border-violet-600 text-white"
              : "bg-white border-slate-300 text-slate-400 group-hover:border-violet-400 group-hover:text-violet-500"
          }`}
        >
          {isActive ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </motion.div>
      </div>

      {/* Card Content */}
      <div className="flex-1 relative">
        <motion.button
          onClick={onClick}
          whileHover={{ x: 4 }}
          className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 mb-4 ${
            isActive
              ? "bg-white border-violet-200 shadow-lg shadow-violet-100/50"
              : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3
                className={`font-bold text-base mb-1 ${
                  isActive ? "text-violet-900" : "text-slate-700"
                }`}
              >
                {roadmap.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                {roadmap.children?.length || 0} bài học • {roadmap.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isActive && <ChevronRight className="w-5 h-5 text-violet-500" />}
            </div>
          </div>
        </motion.button>
        
        {/* Action Buttons (Show on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(roadmap);
            }}
            className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-600 hover:text-violet-600 shadow-sm border border-slate-200"
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(roadmap.id);
            }}
            className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-600 hover:text-red-600 shadow-sm border border-slate-200"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 