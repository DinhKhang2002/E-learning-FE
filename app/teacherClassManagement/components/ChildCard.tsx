// components/ChildCard.tsx
"use client";

import { motion } from "framer-motion";
import { PlayCircle, FileText, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

// Fallback image component (giữ nguyên logic của bạn)
const SafeImage = ({ src, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
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
        <span className="text-slate-400 font-bold text-lg">{alt?.charAt(0) || "?"}</span>
      )}
    </div>
  );
};

interface ChildCardProps {
  roadmap: any;
  index: number;
  onEdit: (roadmap: any) => void;
  onDelete: (id: number) => void;
  onViewFile: (roadmap: any) => void;
}

export default function ChildCard({
  roadmap,
  index,
  onEdit,
  onDelete,
  onViewFile,
}: ChildCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Top Image Section */}
      <div className="h-32 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <SafeImage
          src={roadmap.backgroundImage || roadmap.iconImage}
          alt={roadmap.title}
          className="group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs px-2 py-0.5 rounded-lg font-medium">
            Bài {index + 1}
          </span>
        </div>
        
        {/* Actions (Hover to show) */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
           <button 
             onClick={(e) => { e.stopPropagation(); onEdit(roadmap); }}
             className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-600 hover:text-violet-600 shadow-sm"
           >
             <Edit className="w-4 h-4" />
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(roadmap.id); }}
             className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-600 hover:text-red-600 shadow-sm"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-violet-600">
             {roadmap.iconImage ? (
                <img src={roadmap.iconImage} alt="" className="w-6 h-6 object-contain" />
             ) : (
                <FileText className="w-5 h-5" />
             )}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug group-hover:text-violet-600 transition-colors">
              {roadmap.title}
            </h4>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">
          {roadmap.description || "Chưa có mô tả cho bài học này."}
        </p>

        <button 
          onClick={() => onViewFile(roadmap)}
          className="w-full py-2 rounded-xl bg-slate-50 text-slate-600 text-sm font-semibold group-hover:bg-violet-600 group-hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          Vào học
        </button>
      </div>
    </motion.div>
  );
}