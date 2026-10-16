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
  ChevronUp,
  ChevronDown,
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
      {/* LEFT ZONE matching Screenshot 1 */}
      <div className="flex items-center gap-3">
        {/* Slide Counter */}
        <OfficeTooltip
          title="Số thứ tự trang chiếu"
          vietnameseDesc="Bấm để xem danh sách toàn bộ trang chiếu"
        >
          <button
            type="button"
            className={`px-1.5 py-0.5 rounded-[2px] transition-colors tabular-nums font-medium cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-[#E1DFDD]' : 'hover:bg-[#E5E5E5] text-[#323130]'
            }`}
          >
            Slide {currentSlideIndex + 1} of {totalSlides}
          </button>
        </OfficeTooltip>

        {/* Accessibility Status */}
        <OfficeTooltip title="Khả năng truy nhập" description="Tài liệu trình chiếu sẵn sàng cho người khiếm thị / trợ thính">
          <div
            className={`hidden sm:flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-zinc-300' : 'hover:bg-[#E5E5E5] text-zinc-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Accessibility: Good to go</span>
          </div>
        </OfficeTooltip>

        {/* Language */}
        <OfficeTooltip title="Ngôn ngữ chính tả" description="Ngôn ngữ kiểm tra chính tả: Tiếng Việt">
          <div
            className={`hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-zinc-300' : 'hover:bg-[#E5E5E5] text-zinc-700'
            }`}
          >
            <Languages className="w-3 h-3 text-amber-500" />
            <span>Tiếng Việt</span>
          </div>
        </OfficeTooltip>

        {/* Notes Title matching Screenshot 1 */}
        <div className="hidden lg:inline text-[11px] opacity-70 border-l border-current/15 pl-2 font-medium">
          Ghi chú của người thuyết trình (Notes)
        </div>
      </div>

      {/* RIGHT ZONE matching Screenshot 1 */}
      <div className="flex items-center gap-2">
        {/* Notes toggle button matching Screenshot 1 */}
        {onToggleNotes && (
          <OfficeTooltip title="Ghi chú người thuyết trình" vietnameseDesc="Mở / đóng khung ghi chú bài giảng">
            <button
              type="button"
              onClick={onToggleNotes}
              className={`px-1.5 py-0.5 rounded-[2px] flex items-center gap-1 cursor-pointer transition-colors ${
                isNotesOpen
                  ? 'bg-[#D83B01]/20 text-[#D83B01] font-semibold'
                  : 'hover:bg-current/10'
              }`}
            >
              <span>{isNotesOpen ? 'Ẩn ghi chú' : 'Bấm để mở ghi chú'}</span>
              {isNotesOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3 text-[#D83B01]" />
              )}
            </button>
          </OfficeTooltip>
        )}

        {/* Slide Sorter Icon */}
        <OfficeTooltip title="Slide Sorter" description="Xem lưới tất cả các trang chiếu">
          <button
            type="button"
            className="p-1 rounded-[2px] hover:bg-current/10 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
          </button>
        </OfficeTooltip>

        {/* Reading View Icon */}
        <OfficeTooltip title="Reading View" description="Chế độ đọc trang chiếu">
          <button
            type="button"
            className="p-1 rounded-[2px] hover:bg-current/10 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 opacity-70" />
          </button>
        </OfficeTooltip>

        {/* Slide Show Icon */}
        {onStartSlideShow && (
          <OfficeTooltip title="Slide Show" shortcut="F5" description="Bắt đầu trình chiếu toàn màn hình">
            <button
              type="button"
              onClick={onStartSlideShow}
              className="p-1 rounded-[2px] hover:bg-current/10 transition-colors cursor-pointer text-[#D83B01]"
            >
              <Tv className="w-3.5 h-3.5 text-[#D83B01]" />
            </button>
          </OfficeTooltip>
        )}

        {/* Zoom Controls matching Screenshot 1 */}
        <div className="flex items-center gap-1.5 ml-1">
          <OfficeTooltip title="Thu nhỏ" description="Giảm tỉ lệ hiển thị slide">
            <button
              type="button"
              onClick={() => onChangeZoom(Math.max(40, zoomLevel - 5))}
              className="p-0.5 hover:text-white cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
          </OfficeTooltip>

          <input
            type="range"
            min={40}
            max={150}
            step={5}
            value={zoomLevel}
            onChange={(e) => onChangeZoom(Number(e.target.value))}
            className="w-20 accent-[#D83B01] h-1 cursor-pointer"
          />

          <OfficeTooltip title="Phóng to" description="Tăng tỉ lệ hiển thị slide">
            <button
              type="button"
              onClick={() => onChangeZoom(Math.min(150, zoomLevel + 5))}
              className="p-0.5 hover:text-white cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Đặt lại 105%" description="Tỉ lệ phóng to chuẩn của PowerPoint Web">
            <span
              onClick={onResetZoom}
              className={`font-mono text-[10.5px] w-10 text-center cursor-pointer font-semibold transition-colors ${
                isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
              }`}
            >
              {zoomLevel}%
            </span>
          </OfficeTooltip>

          <OfficeTooltip title="Fit slide to current window" description="Vừa khít trang chiếu vào cửa sổ hiện tại">
            <button
              type="button"
              onClick={() => onChangeZoom(75)}
              className="p-0.5 hover:text-white cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 opacity-80" />
            </button>
          </OfficeTooltip>
        </div>
      </div>
    </footer>
  );
};
export default StatusBar;
