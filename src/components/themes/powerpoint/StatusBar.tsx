import React from 'react';
import {
  FileText,
  LayoutGrid,
  BookOpen,
  Tv,
  Minus,
  Plus,
  Maximize2,
  CheckCircle2,
  Languages,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';
import { OfficeTooltip } from './OfficeTooltip';

interface StatusBarProps {
  theme: ThemeMode;
  currentSlideIndex: number;
  totalSlides: number;
  zoomLevel: number;
  onChangeZoom: (level: number) => void;
  onResetZoom: () => void;
  onStartSlideShow?: () => void;
  onToggleNotes?: () => void;
  isNotesOpen?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  currentSlideIndex,
  totalSlides,
  zoomLevel,
  onChangeZoom,
  onResetZoom,
  onStartSlideShow,
  onToggleNotes,
  isNotesOpen,
}) => {
  const isDark = theme === 'dark';

  return (
    <footer
      className={`h-6 w-full flex items-center justify-between px-3 text-[11px] select-none border-t transition-colors shrink-0 ${
        isDark
          ? 'bg-[#202020] text-[#CCCCCC] border-[#2A2A2A]'
          : 'bg-[#F3F2F1] text-[#484644] border-[#EDEBE9]'
      }`}
    >
      {/* LEFT ZONE: Slide index + Accessibility + Language */}
      <div className="flex items-center gap-3">
        {/* Slide Counter */}
        <OfficeTooltip
          title="Số thứ tự tập phim"
          vietnameseDesc="Vị trí tập phim hiện tại trên tổng số tập của bộ"
        >
          <button
            type="button"
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors tabular-nums font-bold ${
              isDark ? 'hover:bg-[#2F2E2D] text-orange-400' : 'hover:bg-[#E5E5E5] text-[#D83B01]'
            }`}
          >
            Slide {currentSlideIndex + 1} of {totalSlides} (Tập {currentSlideIndex + 1})
          </button>
        </OfficeTooltip>

        {/* Accessibility Status */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] transition-colors ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Stream Status: Good to go</span>
        </div>

        {/* Language */}
        <div
          className={`hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] opacity-75`}
        >
          <Languages className="w-3 h-3 opacity-70" />
          <span>Tiếng Việt</span>
        </div>
      </div>

      {/* RIGHT ZONE: Notes, Zoom Slider, Fullscreen */}
      <div className="flex items-center gap-2">
        {onToggleNotes && (
          <OfficeTooltip title="Notes" vietnameseDesc="Mở/đóng phần mô tả chi tiết phim">
            <button
              type="button"
              onClick={onToggleNotes}
              className={`px-1.5 py-0.5 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                isNotesOpen
                  ? 'bg-[#D83B01]/20 text-[#D83B01] font-bold'
                  : 'hover:bg-current/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          </OfficeTooltip>
        )}

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5 ml-2">
          <button
            type="button"
            onClick={() => onChangeZoom(Math.max(40, zoomLevel - 10))}
            className="p-0.5 hover:text-white cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="range"
            min={40}
            max={120}
            step={5}
            value={zoomLevel}
            onChange={(e) => onChangeZoom(Number(e.target.value))}
            className="w-16 accent-[#D83B01] h-1 cursor-pointer"
          />

          <button
            type="button"
            onClick={() => onChangeZoom(Math.min(120, zoomLevel + 10))}
            className="p-0.5 hover:text-white cursor-pointer"
            title="Phóng to"
          >
            <Plus className="w-3 h-3" />
          </button>

          <span
            onClick={onResetZoom}
            className={`font-mono text-[10px] w-9 text-center cursor-pointer transition-colors ${
              isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
            }`}
            title="Đặt lại zoom mặc định 75%"
          >
            {zoomLevel}%
          </span>
        </div>

        {/* Fit to window / Fullscreen */}
        {onStartSlideShow && (
          <OfficeTooltip title="Slide Show" shortcut="F5" vietnameseDesc="Trình chiếu toàn màn hình">
            <button
              type="button"
              onClick={onStartSlideShow}
              className={`p-1 rounded-[2px] transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] text-orange-400' : 'hover:bg-[#E5E5E5] text-[#D83B01]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          </OfficeTooltip>
        )}
      </div>
    </footer>
  );
};
export default StatusBar;
