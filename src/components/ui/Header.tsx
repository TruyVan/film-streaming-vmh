import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Menu,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { ThemeMode } from '../../types/video';

interface HeaderProps {
  themeMode: ThemeMode;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeMode,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onGoHome,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isLight = themeMode === 'light';

  useEffect(() => {
    if (isSearchExpanded) {
      inputRef.current?.focus();
    }
  }, [isSearchExpanded]);

  const handleOpenSearch = () => {
    setIsSearchExpanded(true);
  };

  const handleCloseSearch = () => {
    setIsSearchExpanded(false);
  };

  const handleClearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCloseSearch();
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full h-14 px-2 sm:px-4 flex items-center justify-between transition-colors duration-150 ${
        isLight
          ? 'bg-[#FAF7F9]/95 text-slate-900 border-b border-slate-200/80'
          : 'bg-[#0f0f0f]/95 text-zinc-100 border-b border-white/[0.06]'
      } backdrop-blur-md`}
    >
      {/* EXPANDED SEARCH BAR MODE */}
      {isSearchExpanded ? (
        <div className="w-full flex items-center gap-2 max-w-3xl mx-auto animate-in fade-in duration-150">
          {/* Back/Close button */}
          <button
            type="button"
            onClick={handleCloseSearch}
            aria-label="Đóng tìm kiếm"
            title="Đóng tìm kiếm (Esc)"
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Search Input Box with X and Search Action */}
          <div className="flex-1 flex items-center">
            <div className="relative flex-1 flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm video sự kiện, teambuilding, karaoke..."
                aria-label="Nhập từ khóa tìm kiếm"
                className={`w-full h-10 pl-4 pr-10 rounded-l-full text-sm transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                    : 'bg-[#181818] border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500'
                }`}
              />

              {/* Nút X để xóa nhanh từ khóa khi đã nhập */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Xóa từ khóa"
                  title="Xóa nội dung"
                  className="absolute right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Nút Search để thao tác sau khi mở rộng */}
            <button
              type="button"
              onClick={handleCloseSearch}
              aria-label="Thực hiện tìm kiếm"
              title="Tìm kiếm"
              className={`h-10 px-4 sm:px-5 rounded-r-full border border-l-0 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#222222] hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* NORMAL COMPACT HEADER (Chỉ có Logo và Nút Tìm kiếm) */
        <div className="w-full flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Mở/đóng menu"
              title="Mở menu (Sidebar)"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200/70' : 'hover:bg-white/10'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              className="flex items-center gap-2 select-none whitespace-nowrap cursor-pointer group"
            >
              <span className="w-7 h-5 rounded-md bg-[#ff0033] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                Harry Potter Tube
              </span>
            </a>
          </div>

          {/* Right Action: Chỉ có Nút Tìm kiếm */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleOpenSearch}
              aria-label="Tìm kiếm video"
              title="Tìm kiếm (Bấm để mở ô nhập)"
              className={`h-9 px-3 sm:px-3.5 rounded-full flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                searchQuery
                  ? isLight
                    ? 'bg-[#F2BBC9]/60 text-slate-900 border border-[#F2A7CA]'
                    : 'bg-[#272727] text-[#F2A7CA] border border-[#F2A7CA]/40'
                  : isLight
                  ? 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-800'
                  : 'bg-[#222222] hover:bg-[#333333] text-zinc-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">
                {searchQuery ? `"${searchQuery}"` : 'Tìm kiếm'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
