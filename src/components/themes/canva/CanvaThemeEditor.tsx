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
import skyscraperImg from '../../../assets/images/canva_city_skyscrapers.jpg';
import { RotateCw, Film } from 'lucide-react';

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
  const [zoomLevel, setZoomLevel] = useState<number>(61);
  const [isFilmstripCollapsed, setIsFilmstripCollapsed] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<CanvaToolType | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>(
    video.title || 'Blue and White Modern Business Proposal Presentation'
  );
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [selectedElement, setSelectedElement] = useState<'video' | 'headline' | 'company' | null>('video');

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
      {/* 1. TOP NAVIGATION BAR matching Screenshot 2 */}
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

      {/* 2. CONTEXTUAL EDITING TOOLBAR matching Screenshot 2 */}
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
        {/* Left Canva Navigation Bar (Mẫu, Thành phần, Văn bản, Thương hiệu...) */}
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
                  <h4 className="text-xs font-bold">Mẫu trang chiếu & Tập phim ({seriesVideos.length})</h4>
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
                  <h4 className="text-xs font-bold">Văn bản & Mô tả bộ phim</h4>
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

        {/* Center Presentation Slide Canvas Viewport matching Screenshot 2 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main
            className={`flex-1 relative overflow-auto flex items-center justify-center p-4 sm:p-8 select-none transition-colors duration-200 ${
              isDark ? 'bg-[#0e1318]' : 'bg-[#0e1318]'
            }`}
          >
            {/* Scaled Presentation Container */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative shrink-0 shadow-2xl rounded-sm"
            >
              {/* Slide 16:9 Canvas (1120px x 630px base dimension matching Screenshot 2) */}
              <div
                className="w-[1120px] h-[630px] bg-white relative overflow-hidden text-slate-900 shadow-2xl"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {/* Background Right Geometric Cutout (Navy Blue #092648) matching Screenshot 2 */}
                <div
                  className="absolute -right-16 -top-20 w-[620px] h-[780px] bg-[#082245]"
                  style={{
                    clipPath: 'polygon(38% 0%, 100% 0%, 100% 100%, 0% 100%)',
                  }}
                />

                {/* Left Vertical Gradient Accent Bar matching Screenshot 2 */}
                <div className="absolute left-0 top-[200px] w-14 h-[240px] bg-gradient-to-r from-[#204a75] via-[#467fae] to-transparent rounded-r-2xl opacity-60 pointer-events-none" />

                {/* Top-Right Decorative White Circles matching Screenshot 2 */}
                <div className="absolute right-44 top-28 flex flex-col gap-3.5 z-10 pointer-events-none">
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                </div>

                {/* Chevrons Decoration matching Screenshot 2 */}
                <div className="absolute left-[540px] top-40 flex items-center gap-2 z-10 pointer-events-none">
                  <svg className="w-6 h-6 text-[#082245]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <svg className="w-6 h-6 text-[#082245]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <svg className="w-6 h-6 text-[#082245]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>

                {/* Element 1: Logo & Company Name "Larana, Inc." matching Screenshot 2 */}
                <div
                  onClick={() => setSelectedElement('company')}
                  className={`absolute left-16 top-14 flex items-center gap-3 cursor-pointer p-2 rounded transition-all duration-150 z-20 ${
                    selectedElement === 'company'
                      ? 'ring-2 ring-[#7d2ae8] ring-offset-2 bg-purple-500/5'
                      : 'hover:outline hover:outline-dashed hover:outline-1 hover:outline-purple-400'
                  }`}
                >
                  <div className="w-8 h-8 relative text-[#092648] flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-[#092648]">
                    Larana, Inc.
                  </span>
                </div>

                {/* Element 2: Main Headline "BUSINESS PROPOSAL" matching Screenshot 2 with Purple Canva Selection Box */}
                <div
                  onClick={() => setSelectedElement('headline')}
                  className={`absolute left-16 top-[180px] max-w-[480px] cursor-pointer p-3 rounded transition-all duration-150 z-20 ${
                    selectedElement === 'headline'
                      ? 'ring-2 ring-[#7d2ae8] ring-offset-2 bg-purple-500/5'
                      : 'hover:outline hover:outline-dashed hover:outline-1 hover:outline-purple-400'
                  }`}
                >
                  <h1
                    className="text-[54px] leading-[1.08] font-extrabold tracking-tight text-[#082245]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    BUSINESS
                    <br />
                    PROPOSAL
                  </h1>

                  {/* Canva Selection Handles matching Screenshot 2 */}
                  {selectedElement === 'headline' && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      {/* Canva Rotation Handle */}
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-[#7d2ae8]" />
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-[#7d2ae8] flex items-center justify-center shadow-xs">
                          <RotateCw className="w-2.5 h-2.5 text-[#7d2ae8]" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Element 3: Diamond Skyscraper Photo Frames matching Screenshot 2 */}
                <div className="absolute right-28 top-20 w-[420px] h-[440px] pointer-events-none z-10">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Primary Diamond Frame (Rotated 45 degrees) */}
                    <div
                      className="w-[280px] h-[280px] rotate-45 overflow-hidden rounded-xl border-[5px] border-white shadow-2xl relative z-10"
                      style={{
                        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <img
                        src={skyscraperImg}
                        alt="Canva Modern Architecture Skyscraper"
                        className="w-[380px] h-[380px] -rotate-45 object-cover -translate-x-12 -translate-y-12"
                      />
                    </div>

                    {/* Secondary overlapping diamond frame */}
                    <div className="absolute -left-12 bottom-6 w-[170px] h-[170px] rotate-45 overflow-hidden rounded-lg border-4 border-white shadow-xl z-20">
                      <img
                        src={skyscraperImg}
                        alt="City Highrise"
                        className="w-[260px] h-[260px] -rotate-45 object-cover -translate-x-10 -translate-y-6 brightness-110"
                      />
                    </div>
                  </div>
                </div>

                {/* Element 4: Contact details at bottom matching Screenshot 2 */}
                <div className="absolute left-16 bottom-10 flex flex-col gap-1.5 text-xs text-[#082245] font-medium z-10 pointer-events-none">
                  <div>🌐 www.reallygreatsite.com</div>
                  <div>✉️ hello@reallygreatsite.com</div>
                </div>

                {/* Element 5: EMBEDDED VIDEO PLAYER IN SLIDE CANVAS (Centrally positioned with Canva bounding box) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement('video');
                  }}
                  className={`absolute left-14 top-[140px] w-[500px] h-[290px] rounded-xl overflow-hidden bg-black shadow-2xl z-30 transition-all ${
                    selectedElement === 'video'
                      ? 'ring-2 ring-[#7d2ae8] ring-offset-2'
                      : 'hover:ring-1 hover:ring-[#7d2ae8]/50'
                  }`}
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

                  {/* Canva Selection Handles on Video Player */}
                  {selectedElement === 'video' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7d2ae8] rounded-full" />
                    </div>
                  )}
                </div>
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
                    className="text-neutral-400 hover:text-white cursor-pointer"
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

          {/* Bottom Filmstrip (Chuỗi các tập phim thuộc cùng phân loại matching Screenshot 2) */}
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

      {/* 4. BOTTOM FOOTER TOOLBAR matching Screenshot 2: Ghi chú, Đếm ngược, 61%, Trang 1 / X, Grid, Fullscreen */}
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
