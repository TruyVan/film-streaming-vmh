import React, { useState, useMemo } from 'react';
import {
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../../types/video';
import { CanvaTopNav } from './CanvaTopNav';
import { CanvaToolbar } from './CanvaToolbar';
import { CanvaSidebar, CanvaToolType } from './CanvaSidebar';
import { CanvaFilmstrip } from './CanvaFilmstrip';
import { CanvaFooter } from './CanvaFooter';
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
  const [activeSidebarTab, setActiveSidebarTab] = useState<CanvaToolType | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>(video.title);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

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
      <CanvaTopNav
        theme={themeMode}
        onToggleTheme={onToggleThemeMode}
        title={documentTitle}
        onTitleChange={setDocumentTitle}
        onNavigateHome={onGoHome}
        onOpenSettings={onOpenSettings}
        onShare={handleCopyLink}
        isCopied={copiedLink}
      />

      {/* 2. SECONDARY CONTEXTUAL EDITING TOOLBAR (Full Canva Controls) */}
      <CanvaToolbar
        theme={themeMode}
        documentTitle={documentTitle}
        onDuplicateElement={() => {
          if (hasNext) onSelectVideo(seriesVideos[currentIndex + 1]);
        }}
        onDeleteElement={() => {
          if (onResetProgress) onResetProgress(video.id);
        }}
      />

      {/* 3. MIDDLE MAIN WORKSPACE: SIDEBAR + CENTER CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Canva Navigation Bar (Mẫu, Thành phần, Văn bản, Tải lên...) */}
        <CanvaSidebar
          theme={themeMode}
          activeTab={activeSidebarTab}
          onTabSelect={(tab) =>
            setActiveSidebarTab((prev) => (prev === tab ? null : tab))
          }
        />

        {/* Flyout panel when clicking sidebar tool */}
        {activeSidebarTab && (
          <div
            className={`w-72 shrink-0 border-r overflow-y-auto p-4 z-20 transition-all ${
              isDark
                ? 'bg-[#141517] border-[#252830]'
                : 'bg-[#fcfcfd] border-[#e5e7eb]'
            }`}
          >
            {activeSidebarTab === 'templates' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold">Tập phim trong bộ ({seriesVideos.length})</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="text-neutral-400 hover:text-white text-xs cursor-pointer"
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
                            ? 'border-purple-500 bg-purple-500/10 shadow-xs ring-1 ring-purple-500/40'
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

            {activeSidebarTab === 'text' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                  <h4 className="text-xs font-bold">Mô tả & Thông tin bộ phim</h4>
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab(null)}
                    className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs leading-relaxed opacity-85 whitespace-pre-line">
                  {video.description || 'Không có mô tả chi tiết cho phim này.'}
                </div>
              </div>
            )}

            {activeSidebarTab !== 'templates' && activeSidebarTab !== 'text' && (
              <div className="space-y-3 text-center py-6 text-xs text-neutral-400">
                <div className="font-bold text-sm text-neutral-300">Công cụ Canva</div>
                <p>Khung chiếu phim đang hoạt động tối ưu bên trong Slide Canvas 16:9.</p>
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab(null)}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold cursor-pointer mt-2"
                >
                  Đóng bảng công cụ
                </button>
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

            {/* Notes overlay if opened */}
            {isNotesOpen && (
              <div
                className={`absolute bottom-4 left-8 right-8 max-w-3xl mx-auto p-4 rounded-xl border shadow-xl text-xs space-y-2 z-30 transition-colors ${
                  isDark ? 'bg-[#18191b] border-white/15' : 'bg-white border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-black/5 dark:border-white/5 font-bold text-rose-500">
                  <span>Ghi chú bài học / Mô tả phim</span>
                  <button
                    type="button"
                    onClick={() => setIsNotesOpen(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <p className="opacity-80 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                  {video.description || 'Không có ghi chú mô tả cho tập phim này.'}
                </p>
              </div>
            )}
          </main>

          {/* Bottom Filmstrip (Chuỗi các tập phim thuộc cùng phân loại) */}
          <CanvaFilmstrip
            theme={themeMode}
            seriesVideos={seriesVideos}
            activeVideoId={video.id}
            onSelectVideo={onSelectVideo}
            isCollapsed={isFilmstripCollapsed}
            onToggleCollapse={() => setIsFilmstripCollapsed(!isFilmstripCollapsed)}
          />
        </div>
      </div>

      {/* 4. BOTTOM FOOTER TOOLBAR */}
      <CanvaFooter
        theme={themeMode}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        currentSlide={currentIndex + 1}
        totalSlides={seriesVideos.length}
        onTogglePresentation={() => {
          const videoContainer = document.querySelector('.art-video-player');
          if (videoContainer) {
            (videoContainer as any).requestFullscreen?.();
          }
        }}
        onToggleNotes={() => setIsNotesOpen((prev) => !prev)}
        isNotesOpen={isNotesOpen}
      />
    </div>
  );
};
export default CanvaThemeEditor;
