import React, { useState } from 'react';
import {
  FileText,
  Timer,
  Grid,
  Maximize2,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  LayoutGrid,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';

interface CanvaFooterProps {
  theme: ThemeMode;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  currentSlide: number;
  totalSlides: number;
  onTogglePresentation?: () => void;
  onToggleNotes?: () => void;
  isNotesOpen?: boolean;
}

export const CanvaFooter: React.FC<CanvaFooterProps> = ({
  theme,
  zoomLevel,
  onZoomChange,
  currentSlide,
  totalSlides,
  onTogglePresentation,
  onToggleNotes,
  isNotesOpen,
}) => {
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  const triggerFeedback = (id: string, cb?: () => void) => {
    setClickedBtn(id);
    setTimeout(() => setClickedBtn(null), 160);
    if (cb) cb();
  };

  const isDark = theme === 'dark';

  return (
    <footer
      className={`h-[38px] px-3 flex items-center justify-between border-t text-xs select-none z-20 shrink-0 transition-colors duration-150 ${
        isDark
          ? 'bg-[#18191b] border-[#2d3139] text-[#b2b7c2]'
          : 'bg-[#f4f5f7] border-[#e3e6eb] text-[#333a45]'
      }`}
    >
      {/* Left controls: Ghi chú, Đếm ngược */}
      <div className="flex items-center gap-1">
        {/* Ghi chú (Notes - shows description) */}
        <button
          type="button"
          onClick={() => triggerFeedback('ghichu', onToggleNotes)}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-medium transition-all duration-150 cursor-pointer ${
            isNotesOpen
              ? 'bg-purple-600/20 text-purple-400 font-bold'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-200'
          } ${clickedBtn === 'ghichu' ? 'scale-95 bg-purple-500/20 text-purple-400' : ''}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ghi chú mô tả</span>
        </button>

        {/* Đếm ngược (Timer) */}
        <button
          type="button"
          onClick={() => triggerFeedback('demnguoc')}
          className={`px-2 py-1 rounded flex items-center gap-1.5 font-medium transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-200'
          } ${clickedBtn === 'demnguoc' ? 'scale-95 bg-purple-500/20 text-purple-400' : ''}`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>Đếm ngược</span>
        </button>
      </div>

      {/* Right controls: Zoom, Trang, Slide Count, Grid, Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Zoom Slider */}
        <div className="flex items-center gap-2 mr-1">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(40, zoomLevel - 10))}
            className="p-0.5 hover:text-white cursor-pointer"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="40"
            max="120"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-24 h-1 accent-purple-600 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
          />

          <button
            type="button"
            onClick={() => onZoomChange(Math.min(120, zoomLevel + 10))}
            className="p-0.5 hover:text-white cursor-pointer"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span
            onClick={() => onZoomChange(75)}
            className={`font-semibold tabular-nums text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-200'
            }`}
            title="Đặt lại zoom mặc định 75%"
          >
            {zoomLevel}%
          </span>
        </div>

        <div className={`h-3.5 w-px ${isDark ? 'bg-[#2d3139]' : 'bg-[#e3e6eb]'}`} />

        {/* Current episode indicator */}
        <span className="font-bold tabular-nums text-xs px-1 text-purple-400 font-mono">
          Tập {currentSlide} / {totalSlides}
        </span>

        {/* Presentation Fullscreen Button */}
        {onTogglePresentation && (
          <button
            type="button"
            onClick={() => triggerFeedback('presentation', onTogglePresentation)}
            className={`p-1.5 rounded transition-all duration-150 cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139] text-white' : 'hover:bg-neutral-200 text-neutral-800'
            } ${clickedBtn === 'presentation' ? 'scale-90 bg-purple-500/20' : ''}`}
            aria-label="Chế độ toàn màn hình"
            title="Xem toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </footer>
  );
};
export default CanvaFooter;
