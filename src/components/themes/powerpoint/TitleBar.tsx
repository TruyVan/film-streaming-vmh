import React, { useState } from 'react';
import {
  Save,
  Undo2,
  Redo2,
  Search,
  Share2,
  Tv2,
  Sun,
  Moon,
  Settings,
  Check,
} from 'lucide-react';
import { OfficeTooltip } from './OfficeTooltip';
import { ThemeMode } from '../../../types/video';

interface TitleBarProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  documentTitle: string;
  onTitleChange: (title: string) => void;
  onStartSlideShow?: () => void;
  onOpenSettings?: () => void;
  onGoHome?: () => void;
  onShare?: () => void;
  isCopied?: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  theme,
  onToggleTheme,
  documentTitle,
  onTitleChange,
  onStartSlideShow,
  onOpenSettings,
  onGoHome,
  onShare,
  isCopied,
}) => {
  const [autoSave, setAutoSave] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleSaveClick = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`h-10 w-full flex items-center justify-between px-2 select-none text-xs border-b shrink-0 transition-colors duration-150 ${
        isDark
          ? 'bg-[#202020] text-[#E1DFDD] border-[#2B2B2B]'
          : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
      }`}
    >
      {/* LEFT ZONE: App Icon + AutoSave + Quick Access */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* PowerPoint App Icon */}
        <OfficeTooltip title="Microsoft PowerPoint" description="Ứng dụng trình chiếu phim slide Office 365">
          <div
            onClick={onGoHome}
            className="flex items-center justify-center w-6 h-6 rounded bg-[#D83B01] shadow-xs text-white font-bold text-[13px] tracking-tighter cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
          >
            P
          </div>
        </OfficeTooltip>

        {/* AutoSave switch */}
        <OfficeTooltip
          title="Tự động lưu (AutoSave)"
          shortcut="OneDrive / Supabase"
          description="Tự động lưu tiến trình xem phim và ghi chú vào hệ thống."
        >
          <button
            type="button"
            onClick={() => setAutoSave(!autoSave)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-medium transition-all cursor-pointer ${
              isDark
                ? 'hover:bg-[#2F2E2D] active:bg-[#383736]'
                : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
            }`}
          >
            <span>AutoSave</span>
            <div
              className={`w-7 h-3.5 rounded-full p-0.5 flex items-center transition-colors ${
                autoSave
                  ? 'bg-[#107C41] justify-end'
                  : isDark
                  ? 'bg-[#555555] justify-start'
                  : 'bg-[#8A8886] justify-start'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
            </div>
            <span className="text-[10px] opacity-75">{autoSave ? 'On' : 'Off'}</span>
          </button>
        </OfficeTooltip>

        {/* Quick Access Toolbar Icons */}
        <div className="flex items-center gap-0.5 pl-1 border-l border-current/15">
          <OfficeTooltip title="Save" shortcut="Ctrl+S" vietnameseDesc="Lưu tài liệu trình chiếu">
            <button
              type="button"
              onClick={handleSaveClick}
              className={`p-1 rounded-[3px] transition-all relative cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <Save className={`w-3.5 h-3.5 ${savedFlash ? 'text-emerald-500' : ''}`} />
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Undo" shortcut="Ctrl+Z">
            <button
              type="button"
              className={`p-1 rounded-[3px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 opacity-70" />
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Redo" shortcut="Ctrl+Y">
            <button
              type="button"
              className={`p-1 rounded-[3px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5 opacity-70" />
            </button>
          </OfficeTooltip>
        </div>
      </div>

      {/* CENTER ZONE: Document Title */}
      <div className="flex-1 max-w-[420px] mx-2 flex items-center justify-center">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="w-full">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => {
                if (tempTitle.trim()) onTitleChange(tempTitle.trim());
                setIsEditingTitle(false);
              }}
              autoFocus
              className={`w-full text-center px-2 py-0.5 text-xs font-semibold rounded-[3px] outline-none border ${
                isDark
                  ? 'bg-[#292929] border-[#D83B01] text-white'
                  : 'bg-white border-[#D83B01] text-black shadow-xs'
              }`}
            />
          </form>
        ) : (
          <div
            onClick={() => {
              setTempTitle(documentTitle);
              setIsEditingTitle(true);
            }}
            className={`px-3 py-1 rounded-[3px] font-bold text-xs truncate max-w-full cursor-pointer transition-colors ${
              isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
            }`}
            title="Bấm để sửa tiêu đề slide"
          >
            <span>{documentTitle}</span>
            <span className="text-[10px] font-normal opacity-50 ml-1.5">- Đã lưu</span>
          </div>
        )}
      </div>

      {/* RIGHT ZONE: Search, SlideShow, Settings, Theme Mode, Share */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Slide Show Button (F5) */}
        {onStartSlideShow && (
          <OfficeTooltip title="Slide Show" shortcut="F5" vietnameseDesc="Trình chiếu toàn màn hình">
            <button
              type="button"
              onClick={onStartSlideShow}
              className={`px-2 py-1 rounded-[3px] flex items-center gap-1 font-semibold text-[11px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] text-[#D83B01]' : 'hover:bg-[#E5E5E5] text-[#D83B01]'
              }`}
            >
              <Tv2 className="w-3.5 h-3.5 text-[#D83B01]" />
              <span className="hidden sm:inline">Trình chiếu</span>
            </button>
          </OfficeTooltip>
        )}

        {/* Nút Cài đặt (chuyển sang trang /settings) */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isDark
                ? 'hover:bg-[#2F2E2D] text-rose-400'
                : 'hover:bg-[#E5E5E5] text-rose-600'
            }`}
            title="Cài đặt hệ thống & Đổi giao diện"
          >
            <Settings className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Cài Đặt</span>
          </button>
        )}

        {/* Sáng / Tối */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
            isDark ? 'hover:bg-[#2F2E2D] text-amber-400' : 'hover:bg-[#E5E5E5] text-indigo-600'
          }`}
          title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Share Button */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="px-2.5 py-1 rounded-[3px] bg-[#D83B01] hover:brightness-110 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer ml-0.5"
          >
            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Đã chép' : 'Share'}</span>
          </button>
        )}

        {/* User initials */}
        <div className="w-6 h-6 rounded-full bg-[#D83B01] text-white font-bold text-[10px] flex items-center justify-center shadow-xs ml-1">
          HP
        </div>
      </div>
    </div>
  );
};
export default TitleBar;
