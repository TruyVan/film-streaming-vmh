import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Menu,
  ArrowLeft,
  Film,
  FolderHeart,
  CornerDownLeft,
} from 'lucide-react';
import { ThemeMode, Video } from '../../types/video';

interface HeaderProps {
  themeMode: ThemeMode;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onGoHome: () => void;
  videos?: Video[];
  customTopics?: string[];
  onSearchSubmit?: (query: string) => void;
  onSelectVideo?: (video: Video) => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeMode,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onGoHome,
  videos = [],
  customTopics = [],
  onSearchSubmit,
  onSelectVideo,
  onSelectCategory,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const isLight = themeMode === 'light';

  // Tự động focus vào ô tìm kiếm khi mở trên mobile
  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileInputRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  // Đóng gợi ý tìm kiếm khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tính toán gợi ý tìm kiếm hoàn toàn trên local (In-memory, 0ms latency)
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { films: [], categories: [] };

    const matchedCategories = (customTopics || [])
      .filter((cat) => cat.toLowerCase().includes(q))
      .slice(0, 3);

    const matchedFilms = (videos || [])
      .filter((v) => !v.deleted_at)
      .filter((v) => {
        const titleMatch = v.title.toLowerCase().includes(q);
        const tagMatch = (v.tags || []).some((t) => t.toLowerCase().includes(q));
        return titleMatch || tagMatch;
      })
      .slice(0, 5);

    return { films: matchedFilms, categories: matchedCategories };
  }, [searchQuery, videos, customTopics]);

  const hasSuggestions =
    showSuggestions &&
    searchQuery.trim().length > 0 &&
    (suggestions.categories.length > 0 || suggestions.films.length > 0);

  const handleClearSearch = () => {
    onSearchChange('');
    setShowSuggestions(false);
    desktopInputRef.current?.focus();
    mobileInputRef.current?.focus();
  };

  const handleExecuteSearch = () => {
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  // Render chung dropdown gợi ý tìm kiếm
  const renderSuggestionsDropdown = () => {
    if (!hasSuggestions) return null;

    return (
      <div
        className={`absolute top-11 left-0 right-12 z-[100] mt-1 rounded-2xl border shadow-2xl overflow-hidden transition-all animate-in fade-in duration-100 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            : 'bg-[#18181c] border-white/15 text-zinc-100 shadow-black/80'
        }`}
      >
        {/* Gợi ý phân loại */}
        {suggestions.categories.length > 0 && (
          <div className="p-2 border-b border-black/5 dark:border-white/5 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <FolderHeart className="w-3 h-3" />
              <span>Phân loại phim</span>
            </div>
            {suggestions.categories.map((cat) => (
              <div
                key={cat}
                onClick={() => {
                  setShowSuggestions(false);
                  setIsMobileSearchOpen(false);
                  if (onSelectCategory) onSelectCategory(cat);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-white/10 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{cat}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-mono">
                  Xem bộ phim →
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Gợi ý phim */}
        {suggestions.films.length > 0 && (
          <div className="p-2 space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <Film className="w-3 h-3" />
              <span>Tập phim phù hợp</span>
            </div>
            {suggestions.films.map((film) => (
              <div
                key={film.id}
                onClick={() => {
                  setShowSuggestions(false);
                  setIsMobileSearchOpen(false);
                  if (onSelectVideo) onSelectVideo(film);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-white/10 text-zinc-200'
                }`}
              >
                <div className="w-14 h-9 rounded-md overflow-hidden bg-black/40 shrink-0 border border-slate-200 dark:border-white/10">
                  {film.thumbnail_url ? (
                    <img
                      src={film.thumbnail_url}
                      alt={film.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      <Film className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate">{film.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] opacity-65 font-mono">
                    {film.tags?.[0] && (
                      <span className="text-rose-500 font-semibold truncate">
                        {film.tags[0]}
                      </span>
                    )}
                    {film.duration && <span>• {film.duration}</span>}
                  </div>
                </div>

                <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Nút xem toàn bộ kết quả */}
        <div
          onClick={handleExecuteSearch}
          className={`p-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold cursor-pointer transition-colors ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 text-rose-600'
              : 'bg-white/[0.02] hover:bg-white/10 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Xem tất cả kết quả cho &quot;{searchQuery}&quot;</span>
          </div>
          <span className="text-[10px] font-mono opacity-65">Enter ↵</span>
        </div>
      </div>
    );
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full h-14 px-2 sm:px-4 flex items-center justify-between transition-colors duration-150 ${
        isLight
          ? 'bg-[#FAF7F9]/95 text-slate-900 border-b border-slate-200/80'
          : 'bg-[#0f0f0f]/95 text-zinc-100 border-b border-white/[0.06]'
      } backdrop-blur-md`}
    >
      {/* MOBILE FULL SEARCH BAR (Chỉ khi mobile bấm nút search) */}
      {isMobileSearchOpen ? (
        <div className="md:hidden w-full flex items-center gap-2 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            aria-label="Đóng tìm kiếm"
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
              isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center relative">
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm kiếm phim, series..."
              className={`w-full h-10 pl-4 pr-10 rounded-l-full text-xs focus:outline-none ${
                isLight
                  ? 'bg-white border border-slate-300 text-slate-900'
                  : 'bg-[#181818] border border-zinc-700 text-zinc-100'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleExecuteSearch}
              className={`h-10 px-4 rounded-r-full border border-l-0 flex items-center justify-center ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-[#222222] border-zinc-700 text-zinc-300'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
            {renderSuggestionsDropdown()}
          </div>
        </div>
      ) : (
        /* STANDARD HEADER: Logo (Left) — Search Box (Center) — Empty/Spacer (Right) */
        <div className="w-full flex items-center justify-between gap-4">
          {/* LEFT: Logo & Sidebar Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
              <img
                src="https://krvabedjwomlyhsjande.supabase.co/storage/v1/object/public/assets/favicon.png"
                alt="Logo"
                className="w-7 h-7 object-contain rounded-md"
              />
              <span className="font-display text-base sm:text-lg font-extrabold tracking-tight">
                Harry Potter Tube
              </span>
            </a>
          </div>

          {/* CENTER: DESKTOP SEARCH BOX LUÔN CỐ ĐỊNH Ở CHÍNH GIỮA TRANG */}
          <div
            ref={searchContainerRef}
            className="hidden md:flex flex-1 max-w-xl mx-auto items-center relative"
          >
            <div className="relative flex-1 flex items-center">
              <input
                ref={desktopInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm phim, series, tập phim theo tên hoặc phân loại..."
                aria-label="Nhập từ khóa tìm kiếm"
                className={`w-full h-10 pl-4 pr-10 rounded-l-full text-xs sm:text-sm transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-400 shadow-2xs'
                    : 'bg-[#181818] border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500'
                }`}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Xóa từ khóa"
                  className="absolute right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExecuteSearch}
              aria-label="Thực hiện tìm kiếm"
              title="Tìm kiếm (Enter)"
              className={`h-10 px-5 rounded-r-full border border-l-0 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#222222] hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            {renderSuggestionsDropdown()}
          </div>

          {/* RIGHT: MOBILE SEARCH ICON (Chỉ hiển thị trên Mobile) & CÂN BẰNG DESKTOP */}
          <div className="flex items-center shrink-0">
            {/* Nút icon kính lúp trên Mobile để mở bung ô tìm kiếm */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              aria-label="Mở tìm kiếm"
              className={`md:hidden w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'
              }`}
            >
              <Search className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Cân đối khoảng trắng trên Desktop để ô search ở giữa trang tuyệt đối */}
            <div className="hidden md:block w-32" />
          </div>
        </div>
      )}
    </header>
  );
};
export default Header;
