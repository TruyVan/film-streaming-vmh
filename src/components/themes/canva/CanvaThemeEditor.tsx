import React, { useState, useMemo } from 'react';
import {
  Home,
  CloudCheck,
  Undo2,
  Redo2,
  Settings,
  Sun,
  Moon,
  Bookmark,
  Share2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  FileText,
  Clock,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Film,
  Presentation,
} from 'lucide-react';
import {
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../../types/video';
import { CustomArtPlayer } from '../../player/CustomArtPlayer';
import { formatSeconds, formatVietnameseDate } from '../../../lib/progress';

interface CanvaThemeEditorProps {
  video: Video;
  seriesVideos: Video[];
  themeMode: ThemeMode;
  timestampBookmarks: TimestampBookmark[];
  onProgressUpdate: (progress: VideoProgress) => void;
  onQuickBookmarkTime: (currentTime: number) => void;
  externalSeekTime: { time: number; nonce: number } | null;
  onSelectVideo: (video: Video) => void;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onToggleThemeMode: () => void;
  isFavorite: boolean;
  onToggleFavorite: (videoId: string) => void;
  onResetProgress?: (videoId: string) => void;
}

export const CanvaThemeEditor: React.FC<CanvaThemeEditorProps> = ({
  video,
  seriesVideos,
  themeMode,
  timestampBookmarks,
  onProgressUpdate,
  onQuickBookmarkTime,
  externalSeekTime,
  onSelectVideo,
  onGoHome,
  onOpenSettings,
  onToggleThemeMode,
  isFavorite,
  onToggleFavorite,
  onResetProgress,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'episodes' | 'desc' | 'moments' | null>(null);

  const isDark = themeMode === 'dark';

  const currentIndex = useMemo(() => {
    return seriesVideos.findIndex((v) => v.id === video.id);
  }, [seriesVideos, video.id]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < seriesVideos.length - 1;

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const scale = zoomLevel / 100;

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden font-sans select-none ${
        isDark ? 'bg-[#0e1318] text-[#f2f3f5]' : 'bg-[#ebedf0] text-[#0e1318]'
      }`}
    >
      {/* 1. TOP NAVIGATION BAR (Teal-Purple Canva Gradient) */}
      <header className="h-[48px] bg-gradient-to-r from-[#00c4cc] via-[#2f6ced] to-[#7d2ae8] text-white flex items-center justify-between px-3 shrink-0 select-none shadow-sm z-30">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Home Button */}
          <button
            type="button"
            onClick={onGoHome}
            className="p-1.5 rounded-md hover:bg-white/15 active:bg-white/30 transition-all flex items-center justify-center cursor-pointer"
            title="Quay về trang chủ Canva"
          >
            <Home className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="h-4 w-px bg-white/25 mx-0.5" />

          {/* Badge phân loại */}
          <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-xs font-bold font-mono tracking-wide truncate max-w-[140px] sm:max-w-[200px]">
            {video.tags?.[0] || 'Phim'}
          </span>

          {/* Quick status */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-white/80 ml-2">
            <CloudCheck className="w-3.5 h-3.5 text-white" />
            <span>Tập {currentIndex + 1} / {seriesVideos.length}</span>
          </div>
        </div>

        {/* Center: Movie title */}
        <div className="flex-1 max-w-[500px] mx-3 text-center truncate">
          <span className="text-xs sm:text-sm font-bold tracking-wide text-white drop-shadow-xs truncate block">
            {video.title}
          </span>
        </div>

        {/* Right Tools: Settings, Theme toggle, Share */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Cài đặt hệ thống & Đổi giao diện"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài Đặt</span>
          </button>

          <button
            type="button"
            onClick={onToggleThemeMode}
            className="p-1.5 rounded-md hover:bg-white/15 text-white transition-all cursor-pointer"
            title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1 rounded-md bg-white text-slate-900 hover:bg-white/90 text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer ml-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Đã chép' : 'Chia sẻ'}</span>
          </button>
        </div>
      </header>

      {/* 2. SECONDARY CONTEXTUAL TOOLBAR */}
      <div
        className={`h-[40px] px-4 flex items-center justify-between border-b shrink-0 text-xs transition-colors duration-150 ${
          isDark ? 'bg-[#18191b] border-[#252830]' : 'bg-[#ffffff] border-[#e5e7eb]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold flex items-center gap-1.5 text-rose-500">
            <Film className="w-3.5 h-3.5" />
            <span>Tập {currentIndex + 1}: {video.title}</span>
          </span>

          <span className="text-[11px] opacity-60 font-mono">
            {formatVietnameseDate(video.event_date)} {video.duration && `• ${video.duration}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(video.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : isDark
                ? 'bg-white/10 hover:bg-white/15 text-zinc-300'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            <span>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
          </button>

          {onResetProgress && (
            <button
              type="button"
              onClick={() => onResetProgress(video.id)}
              className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
              title="Phát lại từ đầu (00:00)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. MIDDLE MAIN WORKSPACE: SIDEBAR + CENTER CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Canva Navigation Bar */}
        <aside
          className={`w-[60px] shrink-0 border-r flex flex-col items-center py-2.5 gap-1.5 z-20 transition-colors ${
            isDark ? 'bg-[#18191b] border-[#252830]' : 'bg-[#ffffff] border-[#e5e7eb]'
          }`}
        >
          <button
            type="button"
            onClick={() =>
              setActiveSidebarTab((prev) => (prev === 'episodes' ? null : 'episodes'))
            }
            className={`w-[50px] h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeSidebarTab === 'episodes'
                ? 'bg-purple-600 text-white shadow-xs'
                : isDark
                ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Danh sách tập phim"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-[9px] font-bold">Tập phim</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSidebarTab((prev) => (prev === 'desc' ? null : 'desc'))
            }
            className={`w-[50px] h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeSidebarTab === 'desc'
                ? 'bg-purple-600 text-white shadow-xs'
                : isDark
                ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Mô tả chi tiết phim"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[9px] font-bold">Mô tả</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveSidebarTab((prev) => (prev === 'moments' ? null : 'moments'))
            }
            className={`w-[50px] h-[48px] rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              activeSidebarTab === 'moments'
                ? 'bg-purple-600 text-white shadow-xs'
                : isDark
                ? 'text-neutral-400 hover:text-white hover:bg-white/5'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            title="Đánh dấu khoảnh khắc"
          >
            <Clock className="w-4 h-4" />
            <span className="text-[9px] font-bold">Khoảnh khắc</span>
          </button>
        </aside>

        {/* Flyout Panel when clicking Sidebar */}
        {activeSidebarTab && (
          <div
            className={`w-72 shrink-0 border-r overflow-y-auto p-4 z-20 transition-all ${
              isDark ? 'bg-[#141517] border-[#252830]' : 'bg-[#fcfcfd] border-[#e5e7eb]'
            }`}
          >
            {activeSidebarTab === 'episodes' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold">Các tập trong bộ ({seriesVideos.length})</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  {seriesVideos.map((item, idx) => {
                    const isSelected = item.id === video.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectVideo(item)}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10 shadow-xs'
                            : isDark
                            ? 'border-white/5 hover:bg-white/5'
                            : 'border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="w-10 h-6 rounded bg-purple-600/15 text-purple-500 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          Tập {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{item.title}</div>
                          <div className="text-[10px] opacity-60 font-mono">{item.duration}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSidebarTab === 'desc' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold">Mô tả bộ phim</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs leading-relaxed opacity-85 whitespace-pre-line">
                  {video.description || 'Không có mô tả chi tiết cho phim này.'}
                </p>
              </div>
            )}

            {activeSidebarTab === 'moments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold">Khoảnh khắc đã lưu ({timestampBookmarks.length})</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                {timestampBookmarks.length === 0 ? (
                  <p className="text-xs opacity-60 italic">Chưa có khoảnh khắc nào được đánh dấu.</p>
                ) : (
                  <div className="space-y-1.5">
                    {timestampBookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          isDark ? 'border-white/10 bg-white/5' : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <span className="font-mono text-purple-400 font-bold">
                          {formatSeconds(bm.time)}
                        </span>
                        <span className="truncate max-w-[140px] text-right">{bm.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Presentation Slide Canvas Viewport with Scaled Player */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main
            className={`flex-1 relative overflow-auto flex items-center justify-center p-4 sm:p-8 select-none transition-colors duration-200 ${
              isDark ? 'bg-[#0e1318]' : 'bg-[#ebedf0]'
            }`}
          >
            {/* Scaled Slide Presentation Container */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative shrink-0 shadow-2xl rounded-2xl overflow-hidden border border-white/10"
            >
              {/* Slide 16:9 Canvas Viewport */}
              <div className="w-[1080px] h-[608px] bg-black relative overflow-hidden flex items-center justify-center">
                <CustomArtPlayer
                  video={video}
                  themeMode={themeMode}
                  timestampBookmarks={timestampBookmarks}
                  onProgressUpdate={onProgressUpdate}
                  onQuickBookmarkTime={onQuickBookmarkTime}
                  externalSeekTime={externalSeekTime}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  onPrevVideo={() => {
                    if (hasPrev) onSelectVideo(seriesVideos[currentIndex - 1]);
                  }}
                  onNextVideo={() => {
                    if (hasNext) onSelectVideo(seriesVideos[currentIndex + 1]);
                  }}
                  onEndedNext={() => {
                    if (hasNext) onSelectVideo(seriesVideos[currentIndex + 1]);
                  }}
                />
              </div>
            </div>
          </main>

          {/* Bottom Filmstrip (Chuỗi các tập phim thuộc cùng phân loại) */}
          {!isFilmstripCollapsed ? (
            <div
              className={`h-[84px] px-3 flex items-center gap-2 border-t overflow-x-auto no-scrollbar select-none z-10 transition-colors duration-150 shrink-0 ${
                isDark ? 'bg-[#18191b] border-[#2d3139]' : 'bg-[#f4f5f7] border-[#e3e6eb]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsFilmstripCollapsed(true)}
                className={`px-1 py-3 rounded-md text-xs transition-colors shrink-0 ${
                  isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-800'
                }`}
                title="Thu gọn filmstrip"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {seriesVideos.map((item, idx) => {
                const isActive = item.id === video.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectVideo(item)}
                    className={`group relative shrink-0 w-[114px] h-[64px] rounded-lg overflow-hidden cursor-pointer transition-all duration-150 flex flex-col justify-between p-1 border shadow-xs ${
                      isActive
                        ? 'ring-2 ring-purple-600 border-transparent bg-purple-500/20'
                        : isDark
                        ? 'bg-[#22252a] border-[#363b44] hover:border-neutral-500'
                        : 'bg-white border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <div className="w-full h-full relative overflow-hidden rounded bg-black">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">
                          <Film className="w-4 h-4 text-purple-400" />
                        </div>
                      )}

                      <span className="absolute bottom-0.5 right-1 px-1 rounded text-[8px] font-mono bg-black/80 text-white">
                        {item.duration || '00:00'}
                      </span>
                    </div>

                    <div className="absolute top-1 left-1.5 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[8px] font-bold">
                      Tập {idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className={`h-2 border-t flex justify-end px-4 z-10 shrink-0 ${
                isDark ? 'bg-[#18191b] border-[#2d3139]' : 'bg-[#f4f5f7] border-[#e3e6eb]'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsFilmstripCollapsed(false)}
                className={`-translate-y-4 px-2.5 py-0.5 rounded shadow-md text-xs flex items-center gap-1 font-semibold cursor-pointer ${
                  isDark ? 'bg-[#22252a] text-white' : 'bg-white text-neutral-800'
                }`}
                title="Mở rộng filmstrip tập phim"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[10px]">Tập phim ({seriesVideos.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM FOOTER TOOLBAR */}
      <footer
        className={`h-[36px] px-4 flex items-center justify-between border-t text-[11px] shrink-0 font-medium transition-colors select-none ${
          isDark ? 'bg-[#18191b] border-[#252830] text-neutral-400' : 'bg-white border-[#e5e7eb] text-neutral-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-rose-500">
            Tập {currentIndex + 1} / {seriesVideos.length}
          </span>
          <span className="opacity-60 truncate max-w-[200px]">{video.title}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
            className="p-1 hover:text-white cursor-pointer"
            title="Thu nhỏ canvas"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={40}
            max={120}
            step={5}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-20 accent-purple-600 h-1 cursor-pointer"
          />

          <span className="font-mono text-[10px] w-9">{zoomLevel}%</span>

          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(120, z + 10))}
            className="p-1 hover:text-white cursor-pointer"
            title="Phóng to canvas"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
export default CanvaThemeEditor;
