import React, { useState, useMemo } from 'react';
import {
  Undo2,
  Redo2,
  Search,
  Settings,
  Sun,
  Moon,
  Bookmark,
  Share2,
  RotateCcw,
  Presentation,
  Tv2,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Clock,
  Film,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../../types/video';
import { CustomArtPlayer } from '../../player/CustomArtPlayer';
import { formatSeconds, formatVietnameseDate } from '../../../lib/progress';

interface PowerPointThemeEditorProps {
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

export const PowerPointThemeEditor: React.FC<PowerPointThemeEditorProps> = ({
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
  const [activeRibbonTab, setActiveRibbonTab] = useState<'home' | 'slideshow' | 'view'>('home');
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-150 ${
        isDark ? 'bg-[#202020] text-[#E1DFDD]' : 'bg-[#F3F2F1] text-[#323130]'
      }`}
    >
      {/* 1. TOP TITLE BAR (PowerPoint 365 Standard) */}
      <header
        className={`h-10 w-full flex items-center justify-between px-2 shrink-0 select-none text-xs border-b transition-colors duration-150 ${
          isDark
            ? 'bg-[#202020] text-[#E1DFDD] border-[#2B2B2B]'
            : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
        }`}
      >
        {/* Left Zone */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            onClick={onGoHome}
            className="flex items-center justify-center w-6 h-6 rounded bg-[#D83B01] shadow-xs text-white font-bold text-xs tracking-tighter cursor-pointer hover:brightness-110 active:scale-95 transition-transform"
            title="Về trang chủ PowerPoint"
          >
            P
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[11px] font-medium opacity-80"
          >
            <span>AutoSave</span>
            <div className="w-5 h-3 rounded-full bg-[#107C41] flex items-center justify-end p-0.5">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </button>

          <div className="h-4 w-px bg-current/15 mx-0.5" />

          <button
            type="button"
            className="p-1 rounded-[3px] hover:bg-current/10 opacity-70"
            title="Hoàn tác"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-[3px] hover:bg-current/10 opacity-70"
            title="Làm lại"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Presentation Document Title */}
        <div className="flex-1 max-w-md mx-3 text-center truncate">
          <span className="text-xs font-bold truncate block">
            {video.title} — {video.tags?.[0] || 'PowerPoint Film'}
          </span>
        </div>

        {/* Right Tools: SlideShow, Settings, Theme toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
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
            className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-amber-400' : 'hover:bg-[#E5E5E5] text-indigo-600'
            }`}
            title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-[3px] bg-[#D83B01] hover:brightness-110 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer ml-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Đã chép' : 'Chia sẻ'}</span>
          </button>
        </div>
      </header>

      {/* 2. RIBBON NAVIGATION TABS BAR (File, Home, Slide Show, View...) */}
      <div
        className={`h-7 px-2 flex items-center border-b shrink-0 text-xs font-medium select-none transition-colors ${
          isDark
            ? 'bg-[#252526] text-[#E1DFDD] border-[#333333]'
            : 'bg-[#EDEBE9] text-[#323130] border-[#D2D0CE]'
        }`}
      >
        {/* File button (Back to Backstage / Home) */}
        <button
          type="button"
          onClick={onGoHome}
          className="h-full px-3 bg-[#D83B01] text-white font-bold hover:brightness-110 active:brightness-95 flex items-center gap-1 cursor-pointer mr-1"
          title="Về trang chủ PowerPoint (Tất cả phim)"
        >
          <span>File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRibbonTab('home')}
          className={`h-full px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeRibbonTab === 'home'
              ? 'border-[#D83B01] text-[#D83B01]'
              : 'border-transparent hover:bg-current/5'
          }`}
        >
          Home
        </button>

        <button
          type="button"
          onClick={() => setActiveRibbonTab('slideshow')}
          className={`h-full px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeRibbonTab === 'slideshow'
              ? 'border-[#D83B01] text-[#D83B01]'
              : 'border-transparent hover:bg-current/5'
          }`}
        >
          Slide Show
        </button>

        <button
          type="button"
          onClick={() => setActiveRibbonTab('view')}
          className={`h-full px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeRibbonTab === 'view'
              ? 'border-[#D83B01] text-[#D83B01]'
              : 'border-transparent hover:bg-current/5'
          }`}
        >
          View
        </button>
      </div>

      {/* 3. RIBBON TOOLBAR AREA */}
      <div
        className={`h-14 px-3 flex items-center justify-between border-b shrink-0 text-xs transition-colors shadow-2xs ${
          isDark
            ? 'bg-[#2B2B2B] text-[#E1DFDD] border-[#3D3D3D]'
            : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Group 1: Navigation / Slide switching */}
          <div className="flex items-center gap-1 pr-3 border-r border-current/15">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => {
                if (hasPrev) onSelectVideo(seriesVideos[currentIndex - 1]);
              }}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                !hasPrev
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-current/10 cursor-pointer text-orange-500'
              }`}
              title="Tập trước đó"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Tập trước</span>
            </button>

            <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-[#D83B01]/15 text-[#D83B01]">
              Tập {currentIndex + 1} / {seriesVideos.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={() => {
                if (hasNext) onSelectVideo(seriesVideos[currentIndex + 1]);
              }}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                !hasNext
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-current/10 cursor-pointer text-orange-500'
              }`}
              title="Tập kế tiếp"
            >
              <span>Tập sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Group 2: Actions */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(video.id)}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500 text-white'
                  : 'hover:bg-current/10'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}</span>
            </button>

            {onResetProgress && (
              <button
                type="button"
                onClick={() => onResetProgress(video.id)}
                className="px-2.5 py-1.5 rounded hover:bg-current/10 flex items-center gap-1 font-semibold cursor-pointer"
                title="Phát lại từ 00:00"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Xem từ đầu</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Info in Ribbon */}
        <div className="hidden md:flex items-center gap-2 text-[11px] opacity-70 font-mono">
          <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold">
            {video.tags?.[0] || 'Phim'}
          </span>
          <span>{formatVietnameseDate(video.event_date)}</span>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE (SLIDE THUMBNAIL STRIP + SLIDE CANVAS) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Panel (Danh sách các tập phim trong bộ) */}
        <aside
          className={`w-64 shrink-0 border-r flex flex-col overflow-y-auto p-3 gap-2.5 select-none transition-colors ${
            isDark ? 'bg-[#252526] border-[#333333]' : 'bg-[#EDEBE9] border-[#D2D0CE]'
          }`}
        >
          <div className="flex items-center justify-between pb-1 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Slides / Tập phim ({seriesVideos.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {seriesVideos.map((item, index) => {
              const isSelected = item.id === video.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectVideo(item)}
                  className={`group flex items-start gap-2 p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D83B01] bg-[#D83B01]/10 ring-2 ring-[#D83B01]/50 shadow-sm'
                      : isDark
                      ? 'border-transparent bg-[#1E1E1E] hover:border-neutral-500'
                      : 'border-transparent bg-white hover:border-[#D2D0CE]'
                  }`}
                >
                  {/* Slide number */}
                  <span className="text-[10px] font-bold font-mono text-neutral-400 pt-1 w-4 text-right shrink-0">
                    {index + 1}
                  </span>

                  {/* Thumbnail viewport */}
                  <div className="w-24 aspect-video rounded overflow-hidden bg-black shrink-0 relative border border-current/10">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-orange-500">
                        <Film className="w-4 h-4" />
                      </div>
                    )}

                    <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[7px] font-mono text-white">
                      {item.duration || '00:00'}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h4
                      className={`text-[11px] font-bold truncate leading-tight ${
                        isSelected ? 'text-[#D83B01]' : ''
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-[9px] opacity-60 font-mono mt-0.5">
                      Tập {index + 1}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Canvas Area with Scaled Video Player */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main
            className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-auto relative select-none transition-colors ${
              isDark ? 'bg-[#292929]' : 'bg-[#E5E5E5]'
            }`}
          >
            {/* SLIDE CANVAS (16:9 Widescreen aspect ratio) */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative w-[1000px] h-[562px] shrink-0 shadow-2xl rounded-sm overflow-hidden bg-black border border-black/40"
            >
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

            {/* Notes Drawer below slide */}
            {notesOpen && (
              <div
                className={`w-full max-w-4xl mt-4 p-4 rounded-xl border shadow-md text-xs space-y-2 z-10 transition-colors ${
                  isDark ? 'bg-[#202020] border-[#333333]' : 'bg-white border-[#EDEBE9]'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-current/10">
                  <span className="font-bold flex items-center gap-1.5 text-orange-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Slide Notes & Mô Tả Bộ Phim</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotesOpen(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="opacity-80 leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                  {video.description || 'Không có ghi chú mô tả cho tập phim này.'}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 5. BOTTOM STATUS BAR */}
      <footer
        className={`h-7 px-3 flex items-center justify-between border-t text-xs font-medium select-none shrink-0 transition-colors ${
          isDark
            ? 'bg-[#202020] text-[#E1DFDD] border-[#2B2B2B]'
            : 'bg-[#F3F2F1] text-[#323130] border-[#E1DFDD]'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-orange-500 font-bold">
            Slide {currentIndex + 1} of {seriesVideos.length} (Tập {currentIndex + 1})
          </span>
          <span className="opacity-60 truncate max-w-[240px] hidden sm:inline">
            {video.title}
          </span>
        </div>

        {/* Status bar actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNotesOpen((prev) => !prev)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
              notesOpen ? 'bg-orange-500/20 text-orange-500' : 'hover:bg-current/10'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Notes</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
              className="p-0.5 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <input
              type="range"
              min={40}
              max={120}
              step={5}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-16 accent-orange-600 h-1 cursor-pointer"
            />
            <span className="font-mono text-[10px] w-8">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(120, z + 10))}
              className="p-0.5 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default PowerPointThemeEditor;
