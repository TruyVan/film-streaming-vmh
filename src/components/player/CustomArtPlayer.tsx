import React, { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import {
  SubtitleTrack,
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../types/video';
import {
  formatSeconds,
  getVideoProgress,
  saveVideoProgress,
} from '../../lib/progress';

interface CustomArtPlayerProps {
  video: Video;
  themeMode: ThemeMode;
  timestampBookmarks?: TimestampBookmark[];
  onProgressUpdate?: (progress: VideoProgress) => void;
  onQuickBookmarkTime?: (currentTime: number) => void;
  onEndedNext?: () => void;
  externalSeekTime?: { time: number; nonce: number } | null;
  onPrevVideo?: () => void;
  onNextVideo?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

// ==========================================
// PURE SVG ICONS (KHÔNG PHỤ THUỘC SERVER DOM)
// ==========================================
const ICONS = {
  sun: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  rewind10: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  forward10: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  subtitles: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13h4"/><path d="M15 13h2"/><path d="M7 9h2"/><path d="M13 9h4"/><rect width="20" height="14" x="2" y="5" rx="2"/></svg>`,
  pip: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="1"/></svg>`,
  maximize: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
  minimize: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  playCenter: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px;"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
  pauseCenter: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  prev: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" stroke-width="2.5"/></svg>`,
  next: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" stroke-width="2.5"/></svg>`,
  fastForward: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="color: #ffffff;"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>`,
  rewind: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(180deg); color: #ffffff;"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>`,
};

function parseHighlightsFromDescription(
  description: string | null
): { time: number; text: string }[] {
  if (!description) return [];
  const lines = description.split('\n');
  const highlights: { time: number; text: string }[] = [];
  const regex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*-\s*(.+)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const hasHours = Boolean(match[3]);
      const hours = hasHours ? parseInt(match[1], 10) : 0;
      const mins = hasHours ? parseInt(match[2], 10) : parseInt(match[1], 10);
      const secs = hasHours ? parseInt(match[3], 10) : parseInt(match[2], 10);
      const totalSeconds = hours * 3600 + mins * 60 + secs;
      const label = match[4].trim();
      if (label) {
        highlights.push({ time: totalSeconds, text: label });
      }
    }
  }
  return highlights;
}

export const CustomArtPlayer: React.FC<CustomArtPlayerProps> = ({
  video,
  timestampBookmarks = [],
  onProgressUpdate,
  onEndedNext,
  externalSeekTime,
  onPrevVideo,
  onNextVideo,
  hasPrev = false,
  hasNext = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const artInstanceRef = useRef<Artplayer | null>(null);
  const isScrubbingRef = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(false);

  // Giữ callback references luôn mới nhất
  const callbacksRef = useRef({
    onProgressUpdate,
    onEndedNext,
    onPrevVideo,
    onNextVideo,
    hasPrev,
    hasNext,
  });

  useEffect(() => {
    callbacksRef.current = {
      onProgressUpdate,
      onEndedNext,
      onPrevVideo,
      onNextVideo,
      hasPrev,
      hasNext,
    };
  });

  const [resumeBanner, setResumeBanner] = useState<number | null>(null);

  // Xử lý External Seek Time từ Bookmarks / Highlights
  useEffect(() => {
    if (externalSeekTime && artInstanceRef.current) {
      const art = artInstanceRef.current;
      art.currentTime = externalSeekTime.time;
      art.play().catch(() => {});
      art.notice.show = `Đã chuyển tới ${formatSeconds(externalSeekTime.time)}`;
    }
  }, [externalSeekTime]);

  // Cập nhật trạng thái nút Prev / Next UI
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const btnPrev = container.querySelector('.art-yt-btn-prev') as HTMLElement | null;
    const btnNext = container.querySelector('.art-yt-btn-next') as HTMLElement | null;

    if (btnPrev) {
      btnPrev.style.opacity = hasPrev ? '1' : '0.25';
      btnPrev.style.pointerEvents = hasPrev ? 'auto' : 'none';
      btnPrev.style.cursor = hasPrev ? 'pointer' : 'not-allowed';
    }
    if (btnNext) {
      btnNext.style.opacity = hasNext ? '1' : '0.25';
      btnNext.style.pointerEvents = hasNext ? 'auto' : 'none';
      btnNext.style.cursor = hasNext ? 'pointer' : 'not-allowed';
    }
  }, [hasPrev, hasNext]);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const saved = getVideoProgress(video.id);
    const initialVolume = saved?.volume ?? 0.85;
    const initialRate = saved?.playbackRate ?? 1;
    const initialBrightness = saved?.brightness ?? 100;

    const descHighlights = parseHighlightsFromDescription(video.description || null);
    const userHighlights = timestampBookmarks.map((b) => ({
      time: b.time,
      text: `★ ${b.label}`,
    }));
    const highlights = [...descHighlights, ...userHighlights];

    const subList: SubtitleTrack[] =
      video.subtitles && video.subtitles.length > 0
        ? video.subtitles
        : video.subtitle_url
        ? [{ name: 'Tiếng Việt', url: video.subtitle_url, default: true }]
        : [];

    const defaultSub = subList.find((s) => s.default) || subList[0];
    const hasConfiguredSubtitle = subList.length > 0 && Boolean(defaultSub?.url);

    // ==========================================
    // ACTION HELPERS
    // ==========================================
    const updateFullscreenIcon = (isFullscreen: boolean) => {
      const btn = containerRef.current?.querySelector(
        '.art-control-fullscreen-toggle'
      ) as HTMLElement | null;
      if (btn) {
        btn.innerHTML = isFullscreen ? ICONS.minimize : ICONS.maximize;
        btn.setAttribute('title', isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình');
      }
    };

    const toggleFullscreen = async () => {
      const art = artInstanceRef.current;
      if (!art) return;

      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      const videoEl = art.template?.$video as any;
      const playerEl = art.template?.$player as HTMLElement | null;

      if (art.fullscreen || art.fullscreenWeb || document.fullscreenElement) {
        if (document.fullscreenElement && document.exitFullscreen) {
          try { await document.exitFullscreen(); } catch {}
        }
        art.fullscreen = false;
        art.fullscreenWeb = false;
        updateFullscreenIcon(false);
        if (isMobile && screen.orientation && 'unlock' in screen.orientation) {
          try { screen.orientation.unlock(); } catch {}
        }
        art.notice.show = 'Đã thoát toàn màn hình';
        return;
      }

      if (videoEl && typeof videoEl.webkitEnterFullscreen === 'function' && !playerEl?.requestFullscreen) {
        videoEl.webkitEnterFullscreen();
        updateFullscreenIcon(true);
        return;
      }

      try {
        if (playerEl && playerEl.requestFullscreen) {
          await playerEl.requestFullscreen();
          art.fullscreen = true;
          updateFullscreenIcon(true);
          art.notice.show = 'Đã bật toàn màn hình';

          if (isMobile && screen.orientation && 'lock' in screen.orientation) {
            try { await (screen.orientation as any).lock('landscape'); } catch {}
          }
          return;
        }

        art.fullscreenWeb = true;
        updateFullscreenIcon(true);
        art.notice.show = 'Toàn màn hình (Web)';
      } catch {
        art.fullscreenWeb = true;
        updateFullscreenIcon(true);
      }
    };

    const togglePip = async () => {
      const art = artInstanceRef.current;
      if (!art) return;
      const videoEl = art.template?.$video as any;
      if (!videoEl) return;

      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          art.notice.show = 'Đã thoát hình trong nền';
          return;
        }

        if (
          typeof videoEl.webkitSupportsPresentationMode === 'function' &&
          videoEl.webkitSupportsPresentationMode('picture-in-picture') &&
          typeof videoEl.webkitSetPresentationMode === 'function'
        ) {
          const currentMode = videoEl.webkitPresentationMode;
          const nextMode = currentMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture';
          videoEl.webkitSetPresentationMode(nextMode);
          art.notice.show = nextMode === 'picture-in-picture' ? 'Đã bật PiP' : 'Đã thoát PiP';
          return;
        }

        if (videoEl.requestPictureInPicture) {
          await videoEl.requestPictureInPicture();
          art.notice.show = 'Đã bật hình trong nền (PiP)';
          return;
        }

        (art as any).mini = !(art as any).mini;
        art.notice.show = (art as any).mini ? 'Đã thu nhỏ góc màn hình' : 'Đã phóng to';
      } catch (err) {
        console.warn('PiP error:', err);
      }
    };

    // Tua có Debounce: Bảo vệ VPS khỏi bị flood Range requests
    let seekDebounceTimer: number | null = null;
    let pendingTargetTime: number | null = null;

    const seekRelative = (delta: number) => {
      const art = artInstanceRef.current;
      if (!art) return;
      const duration = art.duration || 0;
      const currentTime = art.currentTime || 0;
      const baseTime = pendingTargetTime !== null ? pendingTargetTime : currentTime;
      const targetTime = Math.max(0, Math.min(duration, baseTime + delta));
      pendingTargetTime = targetTime;

      const ratio = duration > 0 ? targetTime / duration : 0;
      const containerEl = containerRef.current;
      if (containerEl) {
        const playedEl = containerEl.querySelector('.art-progress-played') as HTMLElement | null;
        const indicatorEl = containerEl.querySelector('.art-progress-indicator') as HTMLElement | null;
        const timeCurrentEl = containerEl.querySelector('.art-time-current') as HTMLElement | null;
        if (playedEl) playedEl.style.width = `${ratio * 100}%`;
        if (indicatorEl) indicatorEl.style.left = `${ratio * 100}%`;
        if (timeCurrentEl) timeCurrentEl.textContent = formatSeconds(targetTime);
      }

      const direction = delta > 0 ? '⏩ Tua tới' : '⏪ Tua lùi';
      art.notice.show = `${direction} ${Math.abs(delta)}s (${formatSeconds(targetTime)})`;

      if (seekDebounceTimer) window.clearTimeout(seekDebounceTimer);
      seekDebounceTimer = window.setTimeout(() => {
        if (pendingTargetTime !== null && art) {
          art.currentTime = pendingTargetTime;
          pendingTargetTime = null;
        }
      }, 150);
    };

    // ==========================================
    // KHỞI TẠO ARTPLAYER
    // ==========================================
    const art = new Artplayer({
      container: containerRef.current,
      url: video.video_url,
      poster: video.thumbnail_url || '',
      volume: initialVolume,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: false,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: false,
      aspectRatio: false,
      playbackRate: true,
      fullscreen: false,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false,
      fastForward: true,
      gesture: false,
      theme: '#ff0033',
      lang: 'vi',
      hotkey: false,
      highlight: highlights,

      subtitle: {
        url: defaultSub?.url || '',
        type: defaultSub?.url?.endsWith('.vtt') ? 'vtt' : 'srt',
        style: {
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 'bold',
          textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px #000',
        },
      },

      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'auto',
        playsinline: 'true',
        'webkit-playsinline': 'true',
        'x5-playsinline': 'true',
      },

      layers: [
        {
          name: 'lock-screen-control',
          html: `
            <div class="art-layer-lock-action" style="position: absolute; top: 16px; right: 16px; z-index: 90; transition: opacity 0.25s ease; opacity: 1;">
              <button type="button" class="art-lock-btn" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.65); border: 1.5px solid rgba(255,255,255,0.3); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.5);" title="Khóa màn hình">
                ${ICONS.unlock}
              </button>
            </div>
          `,
        },
        {
          name: 'gesture-hud-indicator',
          html: `
            <div class="art-gesture-hud" style="display: none; position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); z-index: 85; background: rgba(0,0,0,0.75); border: 1.5px solid rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 16px; color: white; font-family: monospace; font-size: 14px; font-weight: bold; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); pointer-events: none;">
              <span class="art-hud-icon"></span>
              <span class="art-hud-text"></span>
            </div>
          `,
        },
        {
          name: 'youtube-touch-engine',
          html: `
            <div class="art-yt-overlay" style="position: absolute; inset: 0; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">
              <div class="art-yt-ripple-left" style="display: none; position: absolute; inset-y: 0; left: 0; width: 30%; height: 100%; background: radial-gradient(circle at left center, rgba(255,255,255,0.25) 0%, transparent 70%); pointer-events: none; align-items: center; justify-content: center; flex-direction: column;">
                <div>${ICONS.rewind}</div>
                <div style="color: #ffffff; font-size: 13px; font-weight: bold; font-family: monospace; margin-top: 4px; text-shadow: 0 1px 4px rgba(0,0,0,0.9);">-10s</div>
              </div>

              <!-- CỤM PLAY - PREV - NEXT (PPN) -->
              <div class="art-yt-center-controls" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 32px; background: transparent; transition: opacity 0.25s ease; opacity: 1; pointer-events: auto;">
                <button type="button" class="art-yt-btn-prev" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.5); border: 1.5px solid rgba(255,255,255,0.3); backdrop-filter: blur(6px); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4); cursor: pointer;" title="Tập trước đó">
                  ${ICONS.prev}
                </button>

                <button type="button" class="art-yt-btn-play" style="width: 68px; height: 68px; border-radius: 50%; background: rgba(0,0,0,0.65); border: 2px solid rgba(255,255,255,0.45); backdrop-filter: blur(8px); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 24px rgba(0,0,0,0.6);" title="Phát / Tạm dừng">
                  ${ICONS.playCenter}
                </button>

                <button type="button" class="art-yt-btn-next" style="width
