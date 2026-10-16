import React, { useState } from 'react';
import {
  Home,
  CloudCheck,
  Undo2,
  Redo2,
  Sun,
  Moon,
  ChevronDown,
  Pencil,
  Sparkles,
  Share2,
  Check,
  MessageSquare,
  Crown,
  Settings,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';

interface CanvaTopNavProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onNavigateHome: () => void;
  onOpenSettings?: () => void;
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className="h-[48px] bg-gradient-to-r from-[#00c4cc] via-[#2f6ced] to-[#7d2ae8] text-white flex items-center justify-between px-3 shrink-0 select-none shadow-sm z-30 transition-all duration-200">
      {/* Zone 1 matching Screenshot 2: Home icon, Tệp, Đổi cỡ, Sửa, Cloud, Undo, Redo */}
      <div className="flex items-center gap-1.5">
        {/* Home Button (Cyan circle / home icon) */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          aria-label="Trang chủ"
          title="Về trang chủ Canva"
        >
          <Home className="w-4 h-4 stroke-[2.4]" />
        </button>

        <div className="h-4 w-px bg-white/25 mx-0.5" />

        {/* Tệp (File) */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all cursor-pointer"
        >
          Tệp
        </button>

        {/* Đổi cỡ (Resize with Crown) */}
        <button
          type="button"
          className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-amber-300 fill-current" />
          <span>Đổi cỡ</span>
        </button>

        {/* Sửa (Edit with Pencil) */}
        <button
          type="button"
          className="px-2 py-1 text-xs font-semibold rounded-md hover:bg-white/15 active:bg-white/30 transition-all flex items-center gap-1 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Sửa</span>
          <ChevronDown className="w-3 h-3 stroke-[2.5]" />
        </button>

        <div className="h-4 w-px bg-white/25 mx-0.5" />

        {/* Cloud Saved Status */}
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white/15 transition-all cursor-pointer"
          title="Đã lưu tất cả thay đổi trên Canva Cloud"
        >
          <CloudCheck className="w-4 h-4 text-white" />
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white/15 transition-all cursor-pointer"
          title="Hoàn tác"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white/15 transition-all cursor-pointer"
          title="Làm lại"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Zone 2 matching Screenshot 2: Document Title */}
      <div className="flex-1 max-w-[540px] mx-4 flex items-center justify-center">
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
            title="Bấm để đổi tên bài thuyết trình"
          >
            {title || 'Blue and White Modern Business Proposal Presentation'}
          </div>
        )}
      </div>

      {/* Zone 3 matching Screenshot 2: Theme switch, Avatar HV, Comments, Chia sẻ, Gửi đến giáo viên */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Mode Toggle (☀️ Giao diện Sáng / 🌙 Giao diện Tối) */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Giao diện Sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden md:inline">Giao diện Tối</span>
            </>
          )}
        </button>

        {/* Nút Cài đặt (nếu có) */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-white/15 transition-all cursor-pointer"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        )}

        {/* User Avatar HV matching Screenshot 2 (Green circle) */}
        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer">
          HV
        </div>

        {/* Comment Bubble Icon */}
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white/15 transition-all cursor-pointer"
          title="Bình luận"
        >
          <MessageSquare className="w-4 h-4 text-white" />
        </button>

        {/* Chia sẻ Button (Purple button #7d2ae8 matching Screenshot 2) */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="px-3.5 py-1.5 text-xs font-bold rounded-md bg-[#7d2ae8] hover:bg-[#6e22cf] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Đã chép' : 'Chia sẻ'}</span>
          </button>
        )}

        {/* Gửi đến giáo viên Button (White button matching Screenshot 2) */}
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-bold rounded-md bg-white text-slate-900 hover:bg-neutral-100 active:scale-95 transition-all shadow-xs cursor-pointer hidden sm:inline-block"
        >
          Gửi đến giáo viên
        </button>
      </div>
    </header>
  );
};
export default CanvaTopNav;
