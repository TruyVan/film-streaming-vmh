import React, { useState } from 'react';
import {
  Save,
  Undo2,
  Redo2,
  ChevronDown,
  Search,
  MessageSquare,
  Share2,
  Tv2,
  Minus,
  Square,
  X,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  Users,
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
  const [autoSave, setAutoSave] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(documentTitle);
  const [savedFlash, setSavedFlash] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherMode, setTeacherMode] = useState(false);

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
      className={`h-10 w-full flex items-center justify-between px-2 select-none text-xs border-b transition-colors duration-150 ${
        isDark
          ? 'bg-[#202020] text-[#E1DFDD] border-[#2B2B2B]'
          : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
      }`}
    >
      {/* LEFT ZONE: App Icon + AutoSave + Quick Access */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* PowerPoint App Icon */}
        <OfficeTooltip title="Microsoft PowerPoint" description="Ứng dụng tạo và trình chiếu slide bài giảng">
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
          shortcut="OneDrive / SharePoint"
          description="Tự động lưu các thay đổi khi bạn chỉnh sửa."
          vietnameseDesc="Bật để tự động lưu bài giảng"
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
              <Save className={`w-3.5 h-3.5 ${savedFlash ? 'text-green-500 scale-110' : ''} transition-transform`} />
              {savedFlash && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] bg-green-600 text-white px-1 rounded shadow-xs">
                  Saved
                </span>
              )}
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Undo" shortcut="Ctrl+Z" vietnameseDesc="Hoàn tác thao tác vừa thực hiện">
            <button
              type="button"
              className={`p-1 rounded-[3px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Redo" shortcut="Ctrl+Y" vietnameseDesc="Lặp lại thao tác vừa hủy">
            <button
              type="button"
              className={`p-1 rounded-[3px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Customize Quick Access Toolbar" vietnameseDesc="Tùy biến thanh công cụ truy cập nhanh">
            <button
              type="button"
              className={`p-1 rounded-[3px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D] active:bg-[#383736]' : 'hover:bg-[#E5E5E5] active:bg-[#DAD8D6]'
              }`}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </OfficeTooltip>
        </div>
      </div>

      {/* CENTER ZONE: Document Title + Global Search Bar */}
      <div className="flex items-center gap-3 max-w-[550px] w-full justify-center px-4">
        {/* Document Title */}
        <div className="flex items-center gap-1 group cursor-pointer shrink-0">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={() => {
                  if (tempTitle.trim()) onTitleChange(tempTitle.trim());
                  setIsEditingTitle(false);
                }}
                autoFocus
                className={`px-1.5 py-0.5 rounded text-xs outline-none ring-1 ring-[#D83B01] ${
                  isDark ? 'bg-[#2B2B2B] text-white' : 'bg-white text-black'
                }`}
              />
            </form>
          ) : (
            <OfficeTooltip title="Tên tệp trình chiếu" description="Bấm để đổi tên tài liệu PowerPoint">
              <div
                onClick={() => {
                  setTempTitle(documentTitle);
                  setIsEditingTitle(true);
                }}
                className={`flex items-center gap-1 font-semibold text-[12px] px-1.5 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
                }`}
              >
                <span>{documentTitle}</span>
                <span className="font-normal opacity-70">- PowerPoint</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </div>
            </OfficeTooltip>
          )}
        </div>

        {/* Global Search Bar (Office Tell Me / Search Alt+Q) */}
        <div className="relative w-64 max-w-full">
          <OfficeTooltip title="Search (Alt+Q)" shortcut="Alt+Q" vietnameseDesc="Tìm nhanh lệnh, công cụ hoặc trợ giúp">
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-[4px] border text-xs transition-all ${
                isDark
                  ? searchFocused
                    ? 'bg-[#1E1E1E] border-[#D83B01] ring-1 ring-[#D83B01]'
                    : 'bg-[#2C2C2C] border-[#3B3A39] hover:bg-[#343332]'
                  : searchFocused
                  ? 'bg-white border-[#D83B01] ring-1 ring-[#D83B01] shadow-xs'
                  : 'bg-[#EDEBE9] border-[#E1DFDD] hover:bg-white'
              }`}
            >
              <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent border-none outline-none w-full text-xs placeholder:text-inherit placeholder:opacity-60"
              />
            </div>
          </OfficeTooltip>
        </div>
      </div>

      {/* RIGHT ZONE: Teaching Guide + Theme Switch + Comments + Share + Window controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* TEACHING GUIDE BUTTON */}
        <OfficeTooltip
          title="Chế độ Hướng Dẫn Học Sinh"
          description="Bật các điểm chú thích trên giao diện để giải thích từng thanh công cụ cho học sinh."
        >
          <button
            type="button"
            onClick={() => setTeacherMode(!teacherMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-medium transition-all text-[11px] cursor-pointer ${
              teacherMode
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs animate-pulse'
                : isDark
                ? 'bg-[#2F2E2D] hover:bg-[#3D3C3A] text-amber-300 border border-amber-400/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {teacherMode ? 'Đang bật Hướng Dẫn' : 'Hướng Dẫn Học Sinh'}
            </span>
          </button>
        </OfficeTooltip>

        {/* LIGHT / DARK MODE TOGGLE */}
        <OfficeTooltip
          title="Chuyển Giao diện Sáng / Tối"
          description="Xem PowerPoint ở chế độ Dark Mode (nền tối) hoặc Light Mode (nền sáng)."
        >
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] font-medium transition-all text-[11px] cursor-pointer ${
              isDark
                ? 'hover:bg-[#2F2E2D] text-slate-200 border border-slate-700/60'
                : 'hover:bg-[#E5E5E5] text-slate-700 border border-slate-300'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Giao diện Tối</span>
              </>
            )}
          </button>
        </OfficeTooltip>

        {/* Comments button */}
        <OfficeTooltip title="Comments" vietnameseDesc="Thêm nhận xét và phản hồi bài trình chiếu">
          <button
            type="button"
            className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-[11px] transition-all cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comments</span>
          </button>
        </OfficeTooltip>

        {/* Present in Teams */}
        {onStartSlideShow && (
          <OfficeTooltip title="Present in Teams" vietnameseDesc="Trình chiếu trực tiếp trong Microsoft Teams">
            <button
              type="button"
              onClick={onStartSlideShow}
              className={`hidden lg:flex items-center gap-1 px-2 py-1 rounded-[3px] text-[11px] transition-all cursor-pointer ${
                isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
              }`}
            >
              <Tv2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Present in Teams</span>
            </button>
          </OfficeTooltip>
        )}

        {/* Share Button (Distinctive Office PowerPoint Orange Accent #D83B01) */}
        <OfficeTooltip title="Share" shortcut="Chia sẻ bài thuyết trình" vietnameseDesc="Chia sẻ quyền xem/chỉnh sửa">
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-[#D83B01] hover:bg-[#C43E1C] active:bg-[#A83216] text-white font-medium text-[11px] transition-colors shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isCopied ? 'Đã chép' : 'Share'}</span>
          </button>
        </OfficeTooltip>

        {/* User Profile Avatar NA */}
        <OfficeTooltip title="Tài khoản giáo viên / học sinh" description="Nguyễn Văn A (Học viên)">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-semibold text-[10px] flex items-center justify-center cursor-pointer ring-1 ring-white/20 hover:ring-2 hover:ring-[#D83B01] transition-all">
            NA
          </div>
        </OfficeTooltip>

        {/* Windows Standard Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center ml-1">
          <button
            type="button"
            title="Minimize"
            className={`w-7 h-7 flex items-center justify-center rounded-[2px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
            }`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Maximize"
            className={`w-7 h-7 flex items-center justify-center rounded-[2px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D]' : 'hover:bg-[#E5E5E5]'
            }`}
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={onGoHome}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded-[2px] hover:bg-[#E81123] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default TitleBar;
