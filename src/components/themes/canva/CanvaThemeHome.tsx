import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutTemplate,
  BookOpen,
  Presentation,
  Heart,
  Video as VideoIcon,
  Printer,
  FileText,
  SquareCheck,
  Table,
  Code2,
  Globe,
  Mail,
  Camera,
  Maximize,
  CloudUpload,
  MoreHorizontal,
  Home,
  GraduationCap,
  FolderOpen,
  LayoutGrid,
  Crown,
  Sparkles,
  Bell,
  PanelLeft,
  Plus,
  Play,
  Film,
  Calendar,
  Clock,
  Bookmark,
  Sun,
  Moon,
  Settings,
} from 'lucide-react';
import { ThemeMode, Video, VideoProgress } from '../../../types/video';
import { formatSeconds, formatVietnameseDate } from '../../../lib/progress';

interface CanvaThemeHomeProps {
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

export const CanvaThemeHome: React.FC<CanvaThemeHomeProps> = ({
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
  const [activeNav, setActiveNav] = useState('home');
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  const isDark = themeMode === 'dark';

  const triggerClickFeedback = (id: string, cb?: () => void) => {
    setClickedBtn(id);
    setTimeout(() => setClickedBtn(null), 180);
    if (cb) cb();
  };

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
      className={`w-screen h-screen flex overflow-hidden select-none font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0e1318] text-[#f2f3f5]' : 'bg-[#fafafa] text-[#0e1318]'
      }`}
    >
      {/* 1. Left Sidebar of Canva */}
      <aside
        className={`w-[72px] shrink-0 flex flex-col items-center justify-between py-3 z-30 border-r transition-colors duration-150 ${
          isDark ? 'bg-[#18191b] border-[#252830]' : 'bg-[#ffffff] border-[#e5e7eb]'
        }`}
      >
        <div className="flex flex-col items-center w-full gap-2">
          {/* Collapse Panel Button */}
          <button
            type="button"
            onClick={() => triggerClickFeedback('panel-toggle')}
            className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${
              isDark
                ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Bảng điều khiển Canva"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* + Xem Phim Button */}
          <button
            type="button"
            onClick={() => triggerClickFeedback('create-btn', onOpenEditor)}
            className="w-[54px] h-[48px] rounded-xl bg-gradient-to-br from-[#8b3dff] to-[#5124b5] hover:brightness-110 active:scale-95 text-white flex flex-col items-center justify-center shadow-md transition-all duration-150 cursor-pointer"
            title="Mở trình chiếu phim"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
            <span className="text-[10px] font-bold leading-tight">Xem</span>
          </button>

          {/* Navigation Links */}
          <div className="flex flex-col items-center w-full gap-1 mt-1">
            <button
              type="button"
              onClick={() => {
                setActiveNav('home');
                onCategoryChange('ALL');
              }}
              className={`w-[64px] h-[52px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 relative cursor-pointer ${
                activeNav === 'home' && activeCategory === 'ALL'
                  ? isDark
                    ? 'bg-white/10 text-white font-semibold'
                    : 'bg-neutral-100 text-neutral-900 font-semibold'
                  : isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60'
              }`}
            >
              <Home className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[10px] leading-none">Trang chủ</span>
              {activeNav === 'home' && (
                <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-purple-600 rounded-r-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('templates')}
              className={`w-[64px] h-[52px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer ${
                activeNav === 'templates'
                  ? isDark ? 'bg-white/10 text-white' : 'bg-neutral-100 text-neutral-900'
                  : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[2]" />
              <span className="text-[10px] leading-none">Phim bộ</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSettings()}
              className="w-[64px] h-[52px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10"
              title="Cài đặt hệ thống & Đổi giao diện"
            >
              <Settings className="w-4 h-4 stroke-[2] text-rose-500" />
              <span className="text-[10px] leading-none text-rose-500 font-bold">Cài đặt</span>
            </button>
          </div>
        </div>

        {/* Bottom Group */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onToggleThemeMode}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              isDark ? 'text-amber-400 hover:bg-white/10' : 'text-indigo-600 hover:bg-neutral-100'
            }`}
            title={isDark ? 'Đổi sang giao diện Sáng' : 'Đổi sang giao diện Tối'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-xs">
            HP
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto relative no-scrollbar">
        {/* Floating Top Right Bar */}
        <div className="absolute top-4 right-6 z-40 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-md transition-all cursor-pointer ${
              isDark
                ? 'bg-[#18191b] hover:bg-[#252830] text-rose-400 border border-[#2d3139]'
                : 'bg-white hover:bg-neutral-50 text-rose-600 border border-neutral-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-rose-500" />
            <span>Cài Đặt</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditor}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8b3dff] to-[#6c28d9] hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Mở Canva Player</span>
          </button>
        </div>

        {/* Hero Section */}
        <div
          className={`w-full pt-10 pb-8 px-6 relative overflow-hidden transition-colors duration-200 ${
            isDark
              ? 'bg-gradient-to-b from-[#063b40]/50 via-[#1e1338]/60 to-transparent'
              : 'bg-gradient-to-b from-[#e0f7fa]/70 via-[#f3e8ff]/50 to-transparent'
          }`}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-cyan-500/10 blur-[90px] pointer-events-none rounded-full" />

          <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#20c5d2] via-[#38bdf8] to-[#a855f7] mb-3">
              Hôm nay bạn muốn thưởng thức phim gì?
            </h1>
            <p className="text-xs sm:text-sm opacity-75 max-w-xl mb-5">
              Rạp phim cá nhân chất lượng cao phong cách Canva Design. Chọn một tập phim để mở khung chiếu Slide Canvas.
            </p>

            {/* Canva Search Box */}
            <div className="w-full max-w-2xl relative">
              <div
                className={`flex items-center w-full h-11 px-4 rounded-full border shadow-lg transition-all ${
                  isDark
                    ? 'bg-[#18191b] border-white/15 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20'
                    : 'bg-white border-neutral-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20'
                }`}
              >
                <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Tìm kiếm phim theo tên, series hoặc phân loại..."
                  className="flex-1 bg-transparent text-xs sm:text-sm focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="p-1 rounded-full text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-2 mt-5 overflow-x-auto max-w-full pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => onCategoryChange('ALL')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeCategory === 'ALL'
                    ? 'bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white shadow-sm'
                    : isDark
                    ? 'bg-white/10 hover:bg-white/15 text-zinc-300'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                Tất cả ({videos.length})
              </button>

              {customTopics.map((topic) => {
                const isSelected = activeCategory.toLowerCase() === topic.toLowerCase();
                const count = videos.filter(
                  (v) => !v.deleted_at && (v.tags || []).some((t) => t.toLowerCase() === topic.toLowerCase())
                ).length;

                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => onCategoryChange(topic)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white shadow-sm'
                        : isDark
                        ? 'bg-white/10 hover:bg-white/15 text-zinc-300'
                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    <span>{topic}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Bản Thiết Kế Phim Mới Nhất</span>
              </h2>
              <p className="text-xs opacity-65">
                {filteredList.length} tập phim đang sẵn sàng chiếu
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-video rounded-2xl animate-pulse ${
                    isDark ? 'bg-white/5' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div
              className={`p-12 rounded-2xl border text-center space-y-3 ${
                isDark ? 'bg-[#18191b] border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <Film className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
              <h3 className="text-sm font-bold">Không tìm thấy bộ phim phù hợp</h3>
              <p className="text-xs opacity-65">
                Thử chọn một phân loại khác hoặc xóa từ khóa tìm kiếm.
              </p>
              <button
                type="button"
                onClick={() => {
                  onCategoryChange('ALL');
                  onSearchChange('');
                }}
                className="px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold cursor-pointer"
              >
                Hiển thị tất cả
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredList.map((video) => {
                const isFav = favoriteIds.includes(video.id);
                const prog = progressMap[video.id];
                const progressPercent =
                  prog && prog.duration > 0
                    ? Math.min(100, Math.round((prog.currentTime / prog.duration) * 100))
                    : 0;

                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-xl ${
                      isDark
                        ? 'bg-[#18191b] border-[#252830] hover:border-purple-500/50'
                        : 'bg-white border-neutral-200 hover:border-purple-400'
                    }`}
                  >
                    {/* Thumbnail Viewport (16:9) */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#121824] via-[#1e1338] to-[#2d1124] flex flex-col items-center justify-center p-3 text-center">
                          <Film className="w-7 h-7 text-purple-400 mb-1" />
                          <span className="text-[11px] font-bold text-zinc-200 line-clamp-1">
                            {video.title}
                          </span>
                        </div>
                      )}

                      {/* Play overlay button */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#8b3dff] to-[#00c4cc] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Tag */}
                      {video.duration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-white backdrop-blur-xs">
                          {video.duration}
                        </span>
                      )}

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(video.id);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80'
                        }`}
                        title={isFav ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Progress bar */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-mono">
                          {video.tags?.[0] || 'Phim'}
                        </span>
                        <span className="text-[11px] opacity-60 font-mono">
                          {formatVietnameseDate(video.event_date)}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold line-clamp-1 group-hover:text-purple-400 transition-colors">
                        {video.title}
                      </h3>

                      {prog && prog.currentTime > 3 && (
                        <p className="text-[10px] font-mono text-cyan-400">
                          Đang xem {formatSeconds(prog.currentTime)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CanvaThemeHome;
