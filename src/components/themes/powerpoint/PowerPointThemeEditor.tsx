import React, { useState, useMemo } from 'react';
import {
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../../types/video';
import { TitleBar } from './TitleBar';
import { RibbonTabs } from './RibbonTabs';
import { RibbonHomeTab } from './RibbonHomeTab';
import { RibbonOtherTabs } from './RibbonOtherTabs';
import { SlideThumbnails } from './SlideThumbnails';
import { StatusBar } from './StatusBar';
import { CustomArtPlayer } from '../../player/CustomArtPlayer';
import { RibbonTabId, FontState, ParagraphState, DrawingState } from './types';
import { formatSeconds, formatVietnameseDate } from '../../../lib/progress';
import { FileText, Clock, RotateCcw } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<RibbonTabId>('home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(75);
  const [documentTitle, setDocumentTitle] = useState<string>(video.title);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  // Formatting state for full Ribbon fidelity
  const [fontState, setFontState] = useState<FontState>({
    family: 'Aptos Display (Headings)',
    size: 48,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    shadow: false,
    charSpacing: 'normal',
    caseType: 'sentence',
    highlightColor: '#FFFF00',
    fontColor: '#000000',
  });

  const [paragraphState, setParagraphState] = useState<ParagraphState>({
    align: 'center',
    bullets: false,
    numbering: false,
    indent: 0,
    lineSpacing: 1.0,
    textDirection: 'horizontal',
    alignText: 'middle',
  });

  const [drawingState, setDrawingState] = useState<DrawingState>({
    selectedShape: 'Square',
    shapeFill: '#4F81BD',
    shapeOutline: '#17365D',
    shapeEffects: 'none',
  });

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
      {/* 1. TOP TITLE BAR (Office PowerPoint 365) */}
      <TitleBar
        theme={themeMode}
        onToggleTheme={onToggleThemeMode}
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        onStartSlideShow={() => {
          const el = document.querySelector('.art-video-player');
          if (el) (el as any).requestFullscreen?.();
        }}
        onOpenSettings={onOpenSettings}
        onGoHome={onGoHome}
        onShare={handleCopyLink}
        isCopied={copiedLink}
      />

      {/* 2. RIBBON TABS BAR */}
      <RibbonTabs
        theme={themeMode}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (ribbonCollapsed) setRibbonCollapsed(false);
        }}
        ribbonCollapsed={ribbonCollapsed}
        onToggleCollapse={() => setRibbonCollapsed(!ribbonCollapsed)}
        onGoHome={onGoHome}
      />

      {/* 3. RIBBON TOOLBAR AREA (Full fidelity Office Ribbon) */}
      {!ribbonCollapsed && (
        <div className="shrink-0 border-b border-current/15 shadow-2xs">
          {activeTab === 'home' ? (
            <RibbonHomeTab
              theme={themeMode}
              fontState={fontState}
              onChangeFontState={(u) => setFontState((prev) => ({ ...prev, ...u }))}
              paragraphState={paragraphState}
              onChangeParagraphState={(u) => setParagraphState((prev) => ({ ...prev, ...u }))}
              drawingState={drawingState}
              onChangeDrawingState={(u) => setDrawingState((prev) => ({ ...prev, ...u }))}
              onPrevEpisode={() => {
                if (hasPrev) onSelectVideo(seriesVideos[currentIndex - 1]);
              }}
              onNextEpisode={() => {
                if (hasNext) onSelectVideo(seriesVideos[currentIndex + 1]);
              }}
              hasPrev={hasPrev}
              hasNext={hasNext}
              isFavorite={isFavorite}
              onToggleFavorite={() => onToggleFavorite(video.id)}
              onShare={handleCopyLink}
              isCopied={copiedLink}
            />
          ) : (
            <RibbonOtherTabs
              theme={themeMode}
              activeTab={activeTab}
              onStartSlideShow={() => {
                const el = document.querySelector('.art-video-player');
                if (el) (el as any).requestFullscreen?.();
              }}
            />
          )}
        </div>
      )}

      {/* 4. MAIN WORKSPACE (SLIDE THUMBNAILS PANEL + CENTER SLIDE CANVAS) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left SlideThumbnails Panel (Danh sách tập phim) */}
        <SlideThumbnails
          theme={themeMode}
          seriesVideos={seriesVideos}
          activeVideoId={video.id}
          onSelectVideo={onSelectVideo}
        />

        {/* Center Slide Canvas Viewport with Scaled Video Player */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main
            className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-auto relative select-none transition-colors ${
              isDark ? 'bg-[#292929]' : 'bg-[#E5E5E5]'
            }`}
          >
            {/* 16:9 SLIDE CANVAS CONTAINER */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative w-[1000px] h-[562px] shrink-0 shadow-2xl rounded-xs overflow-hidden bg-black border border-black/40"
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

            {/* Slide Notes Drawer below slide */}
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
                    className="text-neutral-400 hover:text-white cursor-pointer"
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
      <StatusBar
        theme={themeMode}
        currentSlideIndex={currentIndex}
        totalSlides={seriesVideos.length}
        zoomLevel={zoomLevel}
        onChangeZoom={setZoomLevel}
        onResetZoom={() => setZoomLevel(75)}
        onStartSlideShow={() => {
          const el = document.querySelector('.art-video-player');
          if (el) (el as any).requestFullscreen?.();
        }}
        onToggleNotes={() => setNotesOpen((prev) => !prev)}
        isNotesOpen={notesOpen}
      />
    </div>
  );
};
export default PowerPointThemeEditor;
