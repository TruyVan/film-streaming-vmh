import React, { useState } from 'react';
import {
  Home,
  CloudCheck,
  Undo2,
  Redo2,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Pencil,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';

interface CanvaTopNavProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onNavigateHome: () => void;
  onOpenSettings: () => void;
  onShare?: () => void;
  isCopied?: boolean;
}

export const CanvaTopNav: React.FC<CanvaTopNavProps> = ({
  theme,
  onToggleTheme,
  title,
  onTitleChange,
  onNavigateHome,
  onOpenSettings,
  onShare,
  isCopied,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const triggerClickFeedback = (id: string, cb?: () => void) => {
    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 180);
    if (cb) cb();
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="h-[48px] bg-gradient-to-r from-[#00c4cc] via-[#2f6ced] to-[#7d2ae8] text-white flex items-center justify-between px-3 shrink-0 select-none shadow-sm z-30 transition-all duration-200">
      {/* Zone 1: Brand & Document controls */}
      <div className="flex items-center gap-1.5">
        {/* Home Button */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('home', onNavigateHome)}
          className={`p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center justify-center cursor-pointer ${
            activeButton === 'home' ? 'scale-90 bg-white/30' : ''
          }`}
          aria-label="Trang chủ"
          title="Về trang chủ Canva"
        >
          <Home className="w-4 h-4 stroke-[2.2]" />
        </button>

        <div className="h-4 w-px bg-white/25 mx-0.5" />

        {/* Tệp (File) */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('tep', onNavigateHome)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center gap-1 cursor-pointer ${
            activeButton === 'tep' ? 'scale-95 bg-white/30' : ''
          }`}
        >
          Tệp
        </button>

        {/* Đổi cỡ (Resize) */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('doico')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
            activeButton === 'doico' ? 'scale-95 bg-white/30' : ''
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Đổi cỡ</span>
        </button>

        {/* Sửa (Edit) */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('sua')}
          className={`px-2 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center gap-1 cursor-pointer ${
            activeButton === 'sua' ? 'scale-95 bg-white/30' : ''
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Sửa</span>
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        <div className="h-4 w-px bg-white/25 mx-0.5" />

        {/* Cloud Status */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('cloud')}
          className={`p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center justify-center cursor-pointer ${
            activeButton === 'cloud' ? 'scale-90 bg-white/30' : ''
          }`}
          aria-label="Đã lưu tất cả thay đổi"
          title="Đã lưu thay đổi"
        >
          <CloudCheck className="w-4 h-4 text-white" />
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => triggerClickFeedback('undo')}
          className={`p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center justify-center cursor-pointer ${
            activeButton === 'undo' ? 'scale-90 bg-white/30' : ''
          }`}
          aria-label="Hoàn tác"
          title="Hoàn tác"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => triggerClickFeedback('redo')}
          className={`p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all duration-150 flex items-center justify-center cursor-pointer ${
            activeButton === 'redo' ? 'scale-90 bg-white/30' : ''
          }`}
          aria-label="Làm lại"
          title="Làm lại"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zone 2: Title in Center */}
      <div className="flex-1 max-w-[500px] mx-4 flex items-center justify-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="w-full text-center bg-white/20 text-white font-medium text-xs px-2.5 py-1 rounded-md border border-white/40 focus:outline-none focus:ring-1 focus:ring-white"
          />
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="px-3 py-1 rounded-md hover:bg-white/15 text-xs font-bold cursor-text truncate max-w-full tracking-wide transition-all duration-150"
            title="Bấm để sửa tiêu đề hiển thị"
          >
            {title}
          </div>
        )}
      </div>

      {/* Zone 3: Settings, Theme toggle & Share */}
      <div className="flex items-center gap-1.5">
        {/* Nút Cài đặt hệ thống (chuyển sang /settings) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2.5 py-1 text-xs font-bold rounded-md bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Cài đặt hệ thống & Đổi giao diện"
        >
          <Settings className="w-3.5 h-3.5 text-rose-300" />
          <span className="hidden sm:inline">Cài Đặt</span>
        </button>

        {/* Theme Mode Toggle (Sun/Moon) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-200" />}
        </button>

        {/* Share Button */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="px-3 py-1 text-xs font-bold rounded-md bg-white text-slate-900 hover:bg-white/90 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-1"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Đã chép' : 'Chia sẻ'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
export default CanvaTopNav;
