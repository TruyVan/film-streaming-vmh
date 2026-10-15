import React, { useState, useMemo } from 'react';
import {
  Search,
  Home,
  PlusSquare,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Bookmark,
  History,
  Play,
  Film,
  Presentation,
  Key,
  Clock,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ThemeMode, Video, VideoProgress } from '../../../types/video';
import { formatSeconds, formatVietnameseDate } from '../../../lib/progress';

interface PowerPointThemeHomeProps {
  videos: Video[];
  allVideos: Video[];
  themeMode: ThemeMode;
  progressMap: Record<string, VideoProgress>;
  favoriteIds: string[];
  customTopics: string[];
  activeCategory: string;
  searchQuery: string;
  isLoading?: boolean;
  onSelectVideo: (video: Video) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  onToggleFavorite: (videoId: string) => void;
  onOpenSettings: () => void;
  onToggleThemeMode: () => void;
  onOpenEditor: () => void;
}

export const PowerPointThemeHome: React.FC<PowerPointThemeHomeProps> = ({
  videos,
  themeMode,
  progressMap,
  favoriteIds,
  customTopics,
  activeCategory,
  searchQuery,
  isLoading = false,
  onSelectVideo,
  onCategoryChange,
  onSearchChange,
  onToggleFavorite,
  onOpenSettings,
  onToggleThemeMode,
  onOpenEditor,
}) => {
  const [activeNav, setActiveNav] = useState<'home' | 'categories' | 'favorites'>('home');

  const isDark = themeMode === 'dark';

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter((v) => {
      if (v.deleted_at) return false;
      const matchesCategory =
        activeCategory === 'ALL' ||
        (v.tags || []).some(
          (t) => t.toLowerCase() === activeCategory.toLowerCase()
        );
      if (!matchesCategory) return false;
      if (!q) return true;
      const inTitle = v.title.toLowerCase().includes(q);
      const inTags = (v.tags || []).some((t) => t.toLowerCase().includes(q));
      return inTitle || inTags;
    });
  }, [videos, activeCategory, searchQuery]);

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-150 ${
        isDark ? 'bg-[#202020] text-[#E1DFDD]' : 'bg-[#F3F2F1] text-[#323130]'
      }`}
    >
      {/* 1. TOP TITLE BAR (PowerPoint 365 Standard) */}
      <header
        className={`h-11 w-full flex items-center justify-between px-3 shrink-0 text-xs border-b transition-colors ${
          isDark
            ? 'bg-[#202020] text-[#E1DFDD] border-[#2B2B2B]'
            : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* PowerPoint Orange App Icon */}
          <div className="flex items-center justify-center w-6 h-6 rounded bg-[#D83B01] shadow-xs text-white font-bold text-xs tracking-tighter shrink-0">
            P
          </div>
          <span className="font-bold text-sm tracking-tight truncate hidden sm:inline">
            PowerPoint — Rạp Phim Web
          </span>
        </div>

        {/* Center Search Input (PowerPoint style) */}
        <div className="flex-1 max-w-lg mx-3 relative">
          <div
            className={`flex items-center w-full h-7 px-3 rounded text-xs border transition-all ${
              isDark
                ? 'bg-[#2B2B2B] border-[#3D3D3D] text-[#E1DFDD] focus-within:border-[#D83B01]'
                : 'bg-white border-[#D2D0CE] text-[#323130] focus-within:border-[#D83B01]'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm bài trình chiếu, tập phim hoặc phân loại..."
              className="flex-1 bg-transparent text-xs focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-rose-400' : 'hover:bg-[#E5E5E5] text-rose-600'
            }`}
            title="Cài đặt hệ thống & Đổi giao diện"
          >
            <Settings className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Cài Đặt</span>
          </button>

          <button
            type="button"
            onClick={onToggleThemeMode}
            className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-amber-400' : 'hover:bg-[#E5E5E5] text-indigo-600'
            }`}
            title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <div className="w-6 h-6 rounded-full bg-[#D83B01] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            HP
          </div>
        </div>
      </header>

      {/* 2. MAIN BACKSTAGE / PORTAL VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Column */}
        <nav
          className={`w-52 shrink-0 border-r py-3 px-2 flex flex-col justify-between select-none transition-colors ${
            isDark ? 'bg-[#252526] border-[#333333]' : 'bg-[#FFFFFF] border-[#EDEBE9]'
          }`}
        >
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveNav('home');
                onCategoryChange('ALL');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                activeNav === 'home' && activeCategory === 'ALL'
                  ? isDark
                    ? 'bg-[#37373D] text-white'
                    : 'bg-[#EDEBE9] text-black'
                  : isDark
                  ? 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                  : 'hover:bg-[#F3F2F1] text-[#484644]'
              }`}
            >
              <Home className="w-4 h-4 text-[#D83B01]" />
              <span>Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={onOpenEditor}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#2A2D2E] text-[#CCCCCC]' : 'hover:bg-[#F3F2F1] text-[#484644]'
              }`}
            >
              <Presentation className="w-4 h-4 text-orange-400" />
              <span>Slide Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('categories')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                activeNav === 'categories'
                  ? isDark
                    ? 'bg-[#37373D] text-white'
                    : 'bg-[#EDEBE9] text-black'
                  : isDark
                  ? 'hover:bg-[#2A2D2E] text-[#CCCCCC]'
                  : 'hover:bg-[#F3F2F1] text-[#484644]'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>Bộ phim / Phân loại</span>
            </button>
          </div>

          <div className="border-t pt-2 space-y-1 border-current/10">
            <button
              type="button"
              onClick={onOpenSettings}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                isDark ? 'hover:bg-[#2A2D2E] text-rose-400' : 'hover:bg-[#F3F2F1] text-rose-600'
              }`}
            >
              <Settings className="w-4 h-4 text-rose-500" />
              <span>Cài đặt hệ thống</span>
            </button>
          </div>
        </nav>

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar">
          {/* Greeting Hero */}
          <div className="space-y-1 border-b pb-5 border-current/10">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <span>Chào mừng đến với Rạp Phim PowerPoint</span>
              <Sparkles className="w-5 h-5 text-orange-500" />
            </h1>
            <p className="text-xs opacity-70">
              Khám phá các bộ phim và chuỗi bài trình chiếu điện ảnh. Chọn một tập phim để bắt đầu chiếu trên Slide Canvas.
            </p>
          </div>

          {/* New Presentation Series Cards (Phân loại phim) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Các bộ phim theo phân loại:</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div
                onClick={() => onCategoryChange('ALL')}
                className={`p-3 rounded-lg border flex flex-col justify-between aspect-video cursor-pointer transition-all ${
                  activeCategory === 'ALL'
                    ? 'border-[#D83B01] bg-[#D83B01]/10 ring-1 ring-[#D83B01]'
                    : isDark
                    ? 'border-[#333333] bg-[#252526] hover:border-neutral-500'
                    : 'border-[#EDEBE9] bg-white hover:border-[#D2D0CE]'
                }`}
              >
                <div className="w-full flex items-center justify-between opacity-60 text-[10px] font-mono">
                  <span>Tất cả</span>
                  <PlusSquare className="w-3.5 h-3.5 text-[#D83B01]" />
                </div>
                <div className="font-bold text-xs truncate">Tất cả phim</div>
                <div className="text-[10px] opacity-60 font-mono">{videos.length} tập</div>
              </div>

              {customTopics.map((topic) => {
                const isSelected = activeCategory.toLowerCase() === topic.toLowerCase();
                const count = videos.filter(
                  (v) => !v.deleted_at && (v.tags || []).some((t) => t.toLowerCase() === topic.toLowerCase())
                ).length;

                return (
                  <div
                    key={topic}
                    onClick={() => onCategoryChange(topic)}
                    className={`p-3 rounded-lg border flex flex-col justify-between aspect-video cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#D83B01] bg-[#D83B01]/10 ring-1 ring-[#D83B01]'
                        : isDark
                        ? 'border-[#333333] bg-[#252526] hover:border-neutral-500'
                        : 'border-[#EDEBE9] bg-white hover:border-[#D2D0CE]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between opacity-60 text-[10px] font-mono">
                      <span>Slide Bộ</span>
                      <Presentation className="w-3.5 h-3.5 text-[#D83B01]" />
                    </div>
                    <div className="font-bold text-xs truncate">{topic}</div>
                    <div className="text-[10px] opacity-60 font-mono">{count} tập phim</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Presentations (Danh sách phim gần đây / Tất cả phim) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Gần đây & Danh sách tập phim ({filteredList.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-16 rounded-lg animate-pulse ${
                      isDark ? 'bg-[#252526]' : 'bg-[#E5E5E5]'
                    }`}
                  />
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div
                className={`p-10 rounded-xl border text-center space-y-2.5 ${
                  isDark ? 'border-[#333333] bg-[#252526]' : 'border-[#EDEBE9] bg-white'
                }`}
              >
                <Film className="w-8 h-8 mx-auto text-orange-500 opacity-60" />
                <p className="text-xs font-semibold">Không tìm thấy tập phim nào.</p>
                <button
                  type="button"
                  onClick={() => {
                    onCategoryChange('ALL');
                    onSearchChange('');
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#D83B01] text-white text-xs font-bold cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>
            ) : (
              <div
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isDark ? 'border-[#333333] bg-[#252526]' : 'border-[#EDEBE9] bg-white'
                }`}
              >
                <div className="divide-y divide-current/10">
                  {filteredList.map((video) => {
                    const isFav = favoriteIds.includes(video.id);
                    const prog = progressMap[video.id];

                    return (
                      <div
                        key={video.id}
                        onClick={() => onSelectVideo(video)}
                        className={`group p-3 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-[#2F2F30]' : 'hover:bg-[#F3F2F1]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Slide mini thumbnail */}
                          <div className="w-24 h-14 rounded overflow-hidden bg-black shrink-0 relative border border-current/10">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#1e1e1e] flex items-center justify-center text-orange-500">
                                <Presentation className="w-5 h-5" />
                              </div>
                            )}

                            <span className="absolute bottom-0.5 right-1 px-1 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                              {video.duration || '00:00'}
                            </span>
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <h3 className="text-xs sm:text-sm font-bold truncate group-hover:text-orange-500 transition-colors">
                              {video.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[11px] opacity-65 font-mono">
                              <span className="px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-400 font-semibold font-mono">
                                {video.tags?.[0] || 'Phim'}
                              </span>
                              <span>{formatVietnameseDate(video.event_date)}</span>
                              {prog && prog.currentTime > 3 && (
                                <span className="text-rose-500 font-bold">
                                  • Xem {formatSeconds(prog.currentTime)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(video.id);
                            }}
                            className={`p-1.5 rounded hover:bg-current/10 transition-colors ${
                              isFav ? 'text-rose-500' : 'text-neutral-400'
                            }`}
                            title={isFav ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                          >
                            <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>

                          <div className="w-8 h-8 rounded-full bg-[#D83B01] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default PowerPointThemeHome;
