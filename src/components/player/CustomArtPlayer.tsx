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
// PURE SVG ICONS
// ==========================================
const ICON_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
const ICON_REWIND_10 = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const ICON_FORWARD_10 = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>';
const ICON_SETTINGS = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_SUBTITLES = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13h4"/><path d="M15 13h2"/><path d="M7 9h2"/><path d="M13 9h4"/><rect width="20" height="14" x="2" y="5" rx="2"/></svg>';
const ICON_PIP = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="1"/></svg>';
const ICON_MAXIMIZE = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
const ICON_MINIMIZE = '<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>';
const ICON_LOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const ICON_UNLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
const ICON_PLAY_CENTER = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="margin-left:3px;"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
const ICON_PAUSE_CENTER = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
const ICON_PREV = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" stroke-width="2.5"/></svg>';
const ICON_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" stroke-width="2.5"/></svg>';
const ICON_FAST_FORWARD = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="color:#ffffff;"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>';
const ICON_REWIND = '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style="transform:rotate(180deg);color:#ffffff;"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>';

// ==========================================
// LAYER TEMPLATES
// ==========================================
const LOCK_LAYER_HTML = [
  '<div class="art-layer-lock-action" style="position:absolute;top:16px;right:16px;z-index:999999;transition:opacity 0.25s ease;opacity:1;">',
  '  <button type="button" class="art-lock-btn" style="width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.65);border:1.5px solid rgba(255,255,255,0.3);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,0.5);pointer-events:auto;" title="Khóa màn hình">',
  '    ' + ICON_UNLOCK,
  '  </button>',
  '</div>',
].join('');

const HUD_LAYER_HTML = [
  '<div class="art-gesture-hud" style="display:none;position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);z-index:85;background:rgba(0,0,0,0.85);border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(10px);padding:12px 24px;border-radius:16px;color:white;font-family:monospace;font-size:14px;font-weight:bold;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.7);pointer-events:none;">',
  '  <span class="art-hud-icon"></span>',
  '  <span class="art-hud-text"></span>',
  '</div>',
].join('');

const TOUCH_ENGINE_LAYER_HTML = [
  '<div class="art-yt-overlay" style="position:absolute;inset:0;z-index:10;user-select:none;-webkit-tap-highlight-color:transparent;">',
  '  <div class="art-yt-ripple-left" style="display:none;position:absolute;inset-y:0;left:0;width:30%;height:100%;background:radial-gradient(circle at left center,rgba(255,255,255,0.25) 0%,transparent 70%);pointer-events:none;align-items:center;justify-content:center;flex-direction:column;">',
  '    <div>' + ICON_REWIND + '</div>',
  '    <div style="color:#ffffff;font-size:13px;font-weight:bold;font-family:monospace;margin-top:4px;text-shadow:0 1px 4px rgba(0,0,0,0.9);">-10s</div>',
  '  </div>',
  '  <div class="art-yt-center-controls" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:32px;background:transparent;transition:opacity 0.25s ease;opacity:1;">',
  '    <button type="button" class="art-yt-btn-prev" style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.5);border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(6px);color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);cursor:pointer;" title="Tập trước đó">',
  '      ' + ICON_PREV,
  '    </button>',
  '    <button type="button" class="art-yt-btn-play" style="width:68px;height:68px;border-radius:50%;background:rgba(0,0,0,0.65);border:2px solid rgba(255,255,255,0.45);backdrop-filter:blur(8px);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,0.6);" title="Phát / Tạm dừng">',
  '      ' + ICON_PLAY_CENTER,
  '    </button>',
  '    <button type="button" class="art-yt-btn-next" style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.5);border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(6px);color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);cursor:pointer;" title="Tập kế tiếp">',
  '      ' + ICON_NEXT,
  '    </button>',
  '  </div>',
  '  <div class="art-yt-ripple-right" style="display:none;position:absolute;inset-y:0;right:0;width:30%;height:100%;background:radial-gradient(circle at right center,rgba(255,255,255,0.25) 0%,transparent 70%);pointer-events:none;align-items:center;justify-content:center;flex-direction:column;">',
  '    <div>' + ICON_FAST_FORWARD + '</div>',
  '    <div style="color:#ffffff;font-size:13px;font-weight:bold;font-family:monospace;margin-top:4px;text-shadow:0 1px 4px rgba(0,0,0,0.9);">+10s</div>',
  '  </div>',
  '</div>',
].join('');

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

  useEffect(() => {
    if (externalSeekTime && artInstanceRef.current && !isLockedRef.current) {
      const art = artInstanceRef.current;
      art.currentTime = externalSeekTime.time;
      art.play().catch(() => {});
      art.notice.show = 'Đã chuyển tới ' + formatSeconds(externalSeekTime.time);
    }
  }, [externalSeekTime]);

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
      text: '★ ' + b.label,
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

    const updateFullscreenIcon = (isFullscreen: boolean) => {
      const btn = containerRef.current?.querySelector(
        '.art-control-fullscreen-toggle'
      ) as HTMLElement | null;
      if (btn) {
        btn.innerHTML = isFullscreen ? ICON_MINIMIZE : ICON_MAXIMIZE;
        btn.setAttribute('title', isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình');
      }
    };

    const toggleFullscreen = async () => {
      const art = artInstanceRef.current;
      if (!art || isLockedRef.current) return;

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
      if (!art || isLockedRef.current) return;
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

        const artAny = art as any;
        artAny.mini = !artAny.mini;
        art.notice.show = artAny.mini ? 'Đã thu nhỏ góc màn hình' : 'Đã phóng to';
      } catch (err) {
        console.warn('PiP error:', err);
      }
    };

    let seekDebounceTimer: number | null = null;
    let pendingTargetTime: number | null = null;

    const seekRelative = (delta: number) => {
      const art = artInstanceRef.current;
      if (!art || isLockedRef.current) return;
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
        if (playedEl) playedEl.style.width = ratio * 100 + '%';
        if (indicatorEl) indicatorEl.style.left = ratio * 100 + '%';
        if (timeCurrentEl) timeCurrentEl.textContent = formatSeconds(targetTime);
      }

      const direction = delta > 0 ? '⏩ Tua tới' : '⏪ Tua lùi';
      art.notice.show = direction + ' ' + Math.abs(delta) + 's (' + formatSeconds(targetTime) + ')';

      if (seekDebounceTimer) window.clearTimeout(seekDebounceTimer);
      seekDebounceTimer = window.setTimeout(() => {
        if (pendingTargetTime !== null && art) {
          art.currentTime = pendingTargetTime;
          pendingTargetTime = null;
        }
      }, 150);
    };

    // ==============================================================
    // KHỞI TẠO ARTPLAYER
    // ==============================================================
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
        escape: false,
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
          html: LOCK_LAYER_HTML,
        },
        {
          name: 'gesture-hud-indicator',
          html: HUD_LAYER_HTML,
        },
        {
          name: 'youtube-touch-engine',
          html: TOUCH_ENGINE_LAYER_HTML,
        },
      ],

      controls: [
        {
          name: 'rewind-10s',
          position: 'left',
          index: 10,
          html: ICON_REWIND_10,
          tooltip: 'Tua lùi 10 giây',
          click: () => seekRelative(-10),
        },
        {
          name: 'forward-10s',
          position: 'left',
          index: 11,
          html: ICON_FORWARD_10,
          tooltip: 'Tua tới 10 giây',
          click: () => seekRelative(10),
        },
        {
          name: 'custom-setting-btn',
          position: 'right',
          index: 30,
          html: ICON_SETTINGS,
          tooltip: 'Cài đặt',
          click: (_control: any, event: any) => {
            if (event && typeof event.stopPropagation === 'function') {
              event.stopPropagation();
              event.preventDefault();
            }
            art.setting.show = !art.setting.show;
          },
        },
        {
          name: 'subtitles-toggle',
          position: 'right',
          index: 35,
          html: ICON_SUBTITLES,
          tooltip: hasConfiguredSubtitle ? 'Bật / Tắt Phụ đề' : 'Chưa có phụ đề',
          click: () => {
            if (isLockedRef.current) return;
            if (!hasConfiguredSubtitle || !art.subtitle) {
              art.notice.show = 'Video này chưa có phụ đề';
              return;
            }
            art.subtitle.show = !art.subtitle.show;
            art.notice.show = art.subtitle.show ? 'Đã bật phụ đề' : 'Đã tắt phụ đề';
          },
        },
        {
          name: 'pip-toggle',
          position: 'right',
          index: 45,
          html: ICON_PIP,
          tooltip: 'Hình trong nền',
          click: async () => await togglePip(),
        },
        {
          name: 'fullscreen-toggle',
          position: 'right',
          index: 55,
          html: ICON_MAXIMIZE,
          tooltip: 'Toàn màn hình',
          click: async () => await toggleFullscreen(),
        },
      ],

      settings: [
        {
          html: 'Độ sáng',
          icon: ICON_SUN,
          tooltip: initialBrightness + '%',
          range: [initialBrightness, 50, 200, 5],
          onChange(item) {
            const rawVal = Array.isArray(item.range)
              ? item.range[0]
              : Number(item.$range?.value ?? item.range ?? 100);
            const val = Number.isFinite(rawVal) ? rawVal : 100;
            if (art.template?.$video) {
              art.template.$video.style.filter = 'brightness(' + val + '%)';
            }
            const updated = saveVideoProgress(video.id, { brightness: val });
            callbacksRef.current.onProgressUpdate?.(updated);
            return val + '%';
          },
        },
        ...(subList.length > 0
          ? [
              {
                html: 'Phụ đề (Subtitles)',
                width: 250,
                tooltip: defaultSub?.name || 'Tắt',
                selector: [
                  { html: 'Tắt phụ đề', url: '', default: !hasConfiguredSubtitle },
                  ...subList.map((s) => ({
                    html: s.name,
                    url: s.url,
                    default: s.url === defaultSub?.url,
                  })),
                ],
                onSelect: (item: any) => {
                  if (!art.subtitle) return 'Chưa có';
                  if (!item.url) {
                    art.subtitle.show = false;
                    return 'Đã tắt';
                  }
                  art.subtitle.show = true;
                  art.subtitle.switch(item.url, { name: item.html });
                  return item.html;
                },
              },
            ]
          : []),
      ],
    });

    artInstanceRef.current = art;

    art.on('fullscreen', (state) => updateFullscreenIcon(state));
    art.on('fullscreenWeb', (state) => updateFullscreenIcon(state));

    const handleDocumentFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      updateFullscreenIcon(isFs || Boolean(art.fullscreenWeb));
    };
    document.addEventListener('fullscreenchange', handleDocumentFullscreenChange);

    // ==============================================================
    // READY HANDLER
    // ==============================================================
    art.on('ready', () => {
      try {
        art.controls.remove('playAndPause');
        art.controls.remove('aspectRatio');
        art.controls.remove('flip');
      } catch {}

      if (art.template?.$video) {
        art.template.$video.style.filter = 'brightness(' + initialBrightness + '%)';
        art.template.$video.volume = initialVolume;
      }
      if (initialRate && initialRate !== 1) {
        art.playbackRate = initialRate;
      }
      if (hasConfiguredSubtitle && art.subtitle && defaultSub?.url) {
        art.subtitle.show = true;
      }

      if (
        saved &&
        saved.currentTime > 3 &&
        (!art.duration || saved.currentTime < art.duration - 5)
      ) {
        art.currentTime = saved.currentTime;
        setResumeBanner(saved.currentTime);
        art.notice.show = 'Tiếp tục xem từ ' + formatSeconds(saved.currentTime);
        window.setTimeout(() => setResumeBanner(null), 4500);
      }

      const containerEl = containerRef.current;
      if (!containerEl) return;

      const playerEl = containerEl.querySelector('.art-video-player') as HTMLElement | null;
      const overlay = containerEl.querySelector('.art-yt-overlay') as HTMLElement | null;
      const centerControls = containerEl.querySelector('.art-yt-center-controls') as HTMLElement | null;
      const btnPlay = containerEl.querySelector('.art-yt-btn-play') as HTMLElement | null;
      const btnPrev = containerEl.querySelector('.art-yt-btn-prev') as HTMLElement | null;
      const btnNext = containerEl.querySelector('.art-yt-btn-next') as HTMLElement | null;
      const rippleLeft = containerEl.querySelector('.art-yt-ripple-left') as HTMLElement | null;
      const rippleRight = containerEl.querySelector('.art-yt-ripple-right') as HTMLElement | null;
      const lockContainer = containerEl.querySelector('.art-layer-lock-action') as HTMLElement | null;
      const btnLock = containerEl.querySelector('.art-lock-btn') as HTMLElement | null;
      const hudContainer = containerEl.querySelector('.art-gesture-hud') as HTMLElement | null;
      const hudIcon = containerEl.querySelector('.art-hud-icon') as HTMLElement | null;
      const hudText = containerEl.querySelector('.art-hud-text') as HTMLElement | null;

      // ==============================================================
      // INJECT CSS: BẢO VỆ TUYỆT ĐỐI CHẾ ĐỘ LOCK VÀ MENU
      // ==============================================================
      let styleTag = containerEl.querySelector('#art-custom-styles') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'art-custom-styles';
        containerEl.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        .art-video-player .art-control-setting {
          display: none !important;
        }

        .art-video-player .art-control svg {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 19px !important;
          height: 19px !important;
        }

        .art-video-player.art-setting-show .art-yt-overlay,
        .art-video-player.art-settings-show .art-yt-overlay {
          display: none !important;
          pointer-events: none !important;
        }

        .art-video-player .art-subtitle i,
        .art-video-player .art-subtitle em {
          font-style: italic !important;
        }
        .art-video-player .art-subtitle b,
        .art-video-player .art-subtitle strong {
          font-weight: bold !important;
        }
        .art-video-player .art-subtitle u {
          text-decoration: underline !important;
        }

        /* KHÓA TUYỆT ĐỐI: CHẶN TOÀN BỘ CHẠM VÀ CLICK VÀO VIDEO KHI KHÓA */
        .art-video-player.art-is-locked .art-video,
        .art-video-player.art-is-locked .art-mask,
        .art-video-player.art-is-locked .art-bottom,
        .art-video-player.art-is-locked .art-controls,
        .art-video-player.art-is-locked .art-progress,
        .art-video-player.art-is-locked .art-yt-center-controls,
        .art-video-player.art-is-locked .art-settings,
        .art-video-player.art-is-locked .art-setting,
        .art-video-player.art-is-locked .art-state {
          display: none !important;
          pointer-events: none !important;
        }

        .art-video-player.art-is-locked {
          cursor: not-allowed !important;
        }

        .art-video-player.art-is-locked .art-layer-lock-action {
          display: block !important;
          pointer-events: auto !important;
          z-index: 9999999 !important;
        }
      `;

      // ==============================================================
      // QUẢN LÝ ẨN/HIỆN PHÍM CHỨC NĂNG (CHUẨN 1 GIÂY TRÊN MOBILE)
      // ==============================================================
      let hideTimer: number | null = null;
      let isUiShowing = true;

      const resetControlsTimer = (delay = 1000) => {
        if (hideTimer) window.clearTimeout(hideTimer);
        if (art.playing && !isLockedRef.current) {
          hideTimer = window.setTimeout(() => {
            if (art.playing && !isLockedRef.current) {
              hideUI();
            }
          }, delay);
        }
      };

      const showUI = () => {
        if (isLockedRef.current) return;
        isUiShowing = true;
        if (centerControls) {
          centerControls.style.opacity = '1';
          centerControls.style.pointerEvents = 'auto';
        }
        if (lockContainer) {
          lockContainer.style.opacity = '1';
          lockContainer.style.pointerEvents = 'auto';
        }
        art.controls.show = true;
        resetControlsTimer(1200); // Tự ẩn sau 1.2s rất gọn gàng
      };

      const hideUI = () => {
        if (isLockedRef.current) return;
        isUiShowing = false;
        if (centerControls) {
          centerControls.style.opacity = '0';
          centerControls.style.pointerEvents = 'none';
        }
        if (lockContainer) {
          lockContainer.style.opacity = '0';
          lockContainer.style.pointerEvents = 'none';
        }
        art.controls.show = false;
      };

      containerEl.onmousemove = () => {
        if (!isLockedRef.current) showUI();
      };

      art.on('play', () => {
        if (btnPlay) btnPlay.innerHTML = ICON_PAUSE_CENTER;
        showUI();
      });

      art.on('pause', () => {
        if (btnPlay) btnPlay.innerHTML = ICON_PLAY_CENTER;
        if (hideTimer) window.clearTimeout(hideTimer);
        if (!isLockedRef.current) {
          isUiShowing = true;
          if (centerControls) {
            centerControls.style.opacity = '1';
            centerControls.style.pointerEvents = 'auto';
          }
          if (lockContainer) {
            lockContainer.style.opacity = '1';
            lockContainer.style.pointerEvents = 'auto';
          }
          art.controls.show = true;
        }
      });

      // Nhấp nháy nút Lock khi người dùng cố chạm vào màn hình lúc đang khóa
      let lockBtnPingTimer: number | null = null;
      const pingLockBtn = () => {
        if (!lockContainer) return;
        lockContainer.style.opacity = '1';
        lockContainer.style.pointerEvents = 'auto';
        if (btnLock) {
          btnLock.style.transform = 'scale(1.2)';
          setTimeout(() => { if (btnLock) btnLock.style.transform = 'scale(1)'; }, 200);
        }
        if (lockBtnPingTimer) window.clearTimeout(lockBtnPingTimer);
        lockBtnPingTimer = window.setTimeout(() => {
          if (isLockedRef.current) {
            lockContainer.style.opacity = '0.35';
          }
        }, 1500);
      };

      if (btnLock && lockContainer) {
        btnLock.onclick = (e) => {
          e.stopPropagation();
          isLockedRef.current = !isLockedRef.current;

          if (isLockedRef.current) {
            playerEl?.classList.add('art-is-locked');
            btnLock.innerHTML = ICON_LOCK;
            btnLock.style.background = 'rgba(255,0,51,0.85)';
            art.notice.show = '🔒 Đã khóa màn hình';
            hideUI();
            pingLockBtn();
          } else {
            playerEl?.classList.remove('art-is-locked');
            btnLock.innerHTML = ICON_UNLOCK;
            btnLock.style.background = 'rgba(0,0,0,0.65)';
            art.notice.show = '🔓 Đã mở khóa';
            showUI();
          }
        };
      }

      const handleTogglePlay = () => {
        if (isLockedRef.current) {
          pingLockBtn();
          return;
        }
        if (art.template?.$video) {
          const v = art.template.$video as HTMLVideoElement;
          if (v.paused) {
            v.play().catch(() => art.play().catch(() => {}));
          } else {
            v.pause();
          }
        } else {
          art.toggle();
        }
      };

      if (btnPlay) {
        btnPlay.onclick = (e) => {
          e.stopPropagation();
          handleTogglePlay();
        };
      }

      if (btnPrev) {
        btnPrev.onclick = (e) => {
          e.stopPropagation();
          callbacksRef.current.onPrevVideo?.();
        };
      }

      if (btnNext) {
        btnNext.onclick = (e) => {
          e.stopPropagation();
          callbacksRef.current.onNextVideo?.();
        };
      }

      // ==============================================================
      // GESTURE & TOUCH ENGINE: PHÂN TÁCH RẠCH RÒI VUỐT VÀ CHẠM
      // ==============================================================
      let lastTapTime = 0;
      let lastTapSide: 'left' | 'right' | 'center' | null = null;
      let singleTapTimer: number | null = null;
      let hasSwipedDuringTouch = false;

      if (overlay) {
        // Chặn tuyệt đối nếu màn hình đang bị khóa
        overlay.onpointerdown = (e) => {
          if (isLockedRef.current) {
            e.stopPropagation();
            pingLockBtn();
          }
        };

        overlay.onclick = (e: MouseEvent) => {
          if (isLockedRef.current) {
            e.stopPropagation();
            pingLockBtn();
            return;
          }

          if (hasSwipedDuringTouch) {
            hasSwipedDuringTouch = false;
            return;
          }

          const target = e.target as HTMLElement;
          if (
            target.closest('.art-setting') ||
            target.closest('.art-settings') ||
            target.closest('.art-bottom') ||
            target.closest('.art-layer-lock-action') ||
            target.closest('button')
          ) {
            return;
          }

          if (art.setting && art.setting.show) {
            art.setting.show = false;
            return;
          }

          const rect = overlay.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const width = rect.width;
          const now = Date.now();

          let currentSide: 'left' | 'right' | 'center' = 'center';
          if (offsetX < width * 0.3) currentSide = 'left';
          else if (offsetX > width * 0.7) currentSide = 'right';
          else currentSide = 'center';

          const isDoubleClick = now - lastTapTime < 280 && lastTapSide === currentSide;

          if (isDoubleClick) {
            if (singleTapTimer) {
              window.clearTimeout(singleTapTimer);
              singleTapTimer = null;
            }

            if (currentSide === 'left') {
              seekRelative(-10);
              if (rippleLeft) {
                rippleLeft.style.display = 'flex';
                setTimeout(() => { rippleLeft.style.display = 'none'; }, 450);
              }
            } else if (currentSide === 'right') {
              seekRelative(10);
              if (rippleRight) {
                rippleRight.style.display = 'flex';
                setTimeout(() => { rippleRight.style.display = 'none'; }, 450);
              }
            } else {
              toggleFullscreen();
            }

            lastTapTime = 0;
            lastTapSide = null;
          } else {
            lastTapTime = now;
            lastTapSide = currentSide;

            if (singleTapTimer) window.clearTimeout(singleTapTimer);
            singleTapTimer = window.setTimeout(() => {
              if (isUiShowing) {
                hideUI();
              } else {
                showUI();
              }
              singleTapTimer = null;
            }, 250);
          }
        };

        // --- GESTURE VUỐT TRÊN MOBILE ---
        let touchStartX = 0;
        let touchStartY = 0;
        let isVerticalSwiping = false;
        let swipeTarget: 'brightness' | 'volume' | null = null;
        let initialBrightnessVal = 100;
        let initialVolumeVal = 0.85;

        overlay.addEventListener('touchstart', (e: TouchEvent) => {
          if (isLockedRef.current || e.touches.length !== 1) return;

          // ĐIỀU KIỆN ĐẶC BIỆT CỦA ANH:
          // Chỉ cho phép vuốt khi phím chức năng ĐANG ẨN!
          // Nếu UI đang hiện: VÔ HIỆU HÓA VUỐT HOÀN TOÀN!
          if (isUiShowing) {
            swipeTarget = null;
            return;
          }

          const touch = e.touches[0];
          const rect = overlay.getBoundingClientRect();
          touchStartX = touch.clientX - rect.left;
          touchStartY = touch.clientY - rect.top;
          isVerticalSwiping = false;
          hasSwipedDuringTouch = false;

          const savedVal = getVideoProgress(video.id);
          initialBrightnessVal = savedVal?.brightness ?? 100;
          initialVolumeVal = art.volume ?? 0.85;

          if (touchStartX < rect.width * 0.4) swipeTarget = 'brightness';
          else if (touchStartX > rect.width * 0.6) swipeTarget = 'volume';
          else swipeTarget = null;
        }, { passive: true });

        overlay.addEventListener('touchmove', (e: TouchEvent) => {
          if (isLockedRef.current || !swipeTarget || e.touches.length !== 1) return;
          const touch = e.touches[0];
          const rect = overlay.getBoundingClientRect();
          const deltaY = touchStartY - (touch.clientY - rect.top);
          const deltaX = Math.abs(touch.clientX - rect.left - touchStartX);

          if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > deltaX) {
            isVerticalSwiping = true;
            hasSwipedDuringTouch = true; // Đánh dấu đã vuốt, cấm bật UI khi thả tay

            const percentDelta = (deltaY / rect.height) * 150;

            if (swipeTarget === 'brightness') {
              const nextBrightness = Math.round(
                Math.max(50, Math.min(200, initialBrightnessVal + percentDelta))
              );
              if (art.template?.$video) {
                art.template.$video.style.filter = 'brightness(' + nextBrightness + '%)';
              }
              saveVideoProgress(video.id, { brightness: nextBrightness });
              if (hudContainer && hudText && hudIcon) {
                hudContainer.style.display = 'flex';
                hudIcon.innerHTML = '☀️';
                hudText.textContent = 'Độ sáng: ' + nextBrightness + '%';
              }
            } else if (swipeTarget === 'volume') {
              const nextVol = Math.max(0, Math.min(1, initialVolumeVal + deltaY / rect.height));
              art.volume = nextVol;
              if (art.template?.$video) art.template.$video.volume = nextVol;
              saveVideoProgress(video.id, { volume: nextVol });
              if (hudContainer && hudText && hudIcon) {
                hudContainer.style.display = 'flex';
                hudIcon.innerHTML = nextVol === 0 ? '🔇' : '🔊';
                hudText.textContent = 'Âm lượng: ' + Math.round(nextVol * 100) + '%';
              }
            }
          }
        }, { passive: true });

        overlay.addEventListener('touchend', () => {
          if (hudContainer) {
            setTimeout(() => { hudContainer.style.display = 'none'; }, 600);
          }
          if (isVerticalSwiping) {
            setTimeout(() => { hasSwipedDuringTouch = false; }, 300);
          }
        });
      }

      // ==============================================================
      // ZERO-LAG SCRUBBING
      // ==============================================================
      const progressEl = containerEl.querySelector('.art-progress') as HTMLElement | null;
      const playedEl = containerEl.querySelector('.art-progress-played') as HTMLElement | null;
      const indicatorEl = containerEl.querySelector('.art-progress-indicator') as HTMLElement | null;
      const tipEl = containerEl.querySelector('.art-progress-tip') as HTMLElement | null;
      const timeCurrentEl = containerEl.querySelector('.art-time-current') as HTMLElement | null;

      if (progressEl) {
        let wasPlayingBeforeDrag = false;
        let scrubRatio = 0;

        const getRatio = (e: TouchEvent | MouseEvent): number => {
          const rect = progressEl.getBoundingClientRect();
          let clientX = 0;
          if ('touches' in e && e.touches.length > 0) clientX = e.touches[0].clientX;
          else if ('changedTouches' in e && e.changedTouches.length > 0)
            clientX = e.changedTouches[0].clientX;
          else clientX = (e as MouseEvent).clientX;
          return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        };

        const updateVisualsOnly = (ratio: number) => {
          const duration = art.duration || 0;
          const currentSec = ratio * duration;
          if (playedEl) playedEl.style.width = ratio * 100 + '%';
          if (indicatorEl) indicatorEl.style.left = ratio * 100 + '%';
          if (tipEl) {
            tipEl.textContent = formatSeconds(currentSec);
            tipEl.style.left = ratio * 100 + '%';
          }
          if (timeCurrentEl) timeCurrentEl.textContent = formatSeconds(currentSec);
        };

        const onDragStart = (e: TouchEvent | MouseEvent) => {
          if (isLockedRef.current) return;
          isScrubbingRef.current = true;
          wasPlayingBeforeDrag = art.playing;
          if (art.playing) art.pause();

          scrubRatio = getRatio(e);
          updateVisualsOnly(scrubRatio);

          window.addEventListener('mousemove', onDragMove);
          window.addEventListener('mouseup', onDragEnd);
          window.addEventListener('touchmove', onDragMove, { passive: false });
          window.addEventListener('touchend', onDragEnd);
          window.addEventListener('touchcancel', onDragEnd);
        };

        const onDragMove = (e: TouchEvent | MouseEvent) => {
          if (!isScrubbingRef.current) return;
          if (e.cancelable) e.preventDefault();
          scrubRatio = getRatio(e);
          updateVisualsOnly(scrubRatio);
        };

        const onDragEnd = (e: TouchEvent | MouseEvent) => {
          if (!isScrubbingRef.current) return;
          isScrubbingRef.current = false;
          scrubRatio = getRatio(e);

          window.removeEventListener('mousemove', onDragMove);
          window.removeEventListener('mouseup', onDragEnd);
          window.removeEventListener('touchmove', onDragMove);
          window.removeEventListener('touchend', onDragEnd);
          window.removeEventListener('touchcancel', onDragEnd);

          const targetSeconds = scrubRatio * (art.duration || 0);
          art.currentTime = targetSeconds;
          art.notice.show = '🎯 ' + formatSeconds(targetSeconds);

          if (wasPlayingBeforeDrag) {
            art.play().catch(() => {});
          }
        };

        progressEl.addEventListener('mousedown', onDragStart);
        progressEl.addEventListener('touchstart', onDragStart, { passive: false });
      }
    });

    // ==========================================
    // TIẾN TRÌNH & PROGRESS WATCHDOG
    // ==========================================
    let lastSavedSec = -1;
    art.on('video:timeupdate', () => {
      if (isScrubbingRef.current) return;

      const currentSec = Math.floor(art.currentTime);
      if (currentSec !== lastSavedSec && currentSec % 2 === 0) {
        lastSavedSec = currentSec;
        const updated = saveVideoProgress(video.id, {
          currentTime: art.currentTime,
          duration: art.duration || 0,
          playbackRate: art.playbackRate,
          volume: art.volume,
        });
        callbacksRef.current.onProgressUpdate?.(updated);
      }
    });

    art.on('video:ratechange', () => {
      const updated = saveVideoProgress(video.id, { playbackRate: art.playbackRate });
      callbacksRef.current.onProgressUpdate?.(updated);
    });

    art.on('video:volumechange', () => {
      const updated = saveVideoProgress(video.id, { volume: art.muted ? 0 : art.volume });
      callbacksRef.current.onProgressUpdate?.(updated);
    });

    art.on('video:ended', () => {
      const updated = saveVideoProgress(video.id, { currentTime: 0, duration: art.duration || 0 });
      callbacksRef.current.onProgressUpdate?.(updated);
      callbacksRef.current.onEndedNext?.();
    });

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLockedRef.current) return;
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput || e.ctrlKey || e.metaKey || e.altKey) return;

      const isSpace = e.code === 'Space' || e.key === ' ';

      if (isSpace || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && typeof (activeEl as HTMLElement).blur === 'function') {
          (activeEl as HTMLElement).blur();
        }
        art.toggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        seekRelative(-10);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        seekRelative(10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (art.muted) art.muted = false;
        const currentVol = Math.round((art.volume ?? 0.85) * 100);
        const nextVol = Math.min(100, currentVol + 5);
        art.volume = nextVol / 100;
        if (art.template?.$video) art.template.$video.volume = nextVol / 100;
        art.notice.show = '🔊 Âm lượng: ' + nextVol + '%';
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        callbacksRef.current.onProgressUpdate?.(updated);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const currentVol = Math.round((art.volume ?? 0.85) * 100);
        const nextVol = Math.max(0, currentVol - 5);
        art.volume = nextVol / 100;
        if (art.template?.$video) art.template.$video.volume = nextVol / 100;
        if (nextVol === 0) {
          art.muted = true;
          art.notice.show = '🔇 Tắt âm';
        } else {
          if (art.muted) art.muted = false;
          art.notice.show = '🔉 Âm lượng: ' + nextVol + '%';
        }
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        callbacksRef.current.onProgressUpdate?.(updated);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePip();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        art.muted = !art.muted;
        art.notice.show = art.muted
          ? '🔇 Đã tắt tiếng'
          : '🔊 Âm lượng: ' + Math.round(art.volume * 100) + '%';
        const updated = saveVideoProgress(video.id, { volume: art.muted ? 0 : art.volume });
        callbacksRef.current.onProgressUpdate?.(updated);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (hasConfiguredSubtitle && art.subtitle) {
          art.subtitle.show = !art.subtitle.show;
          art.notice.show = art.subtitle.show ? 'Đã bật phụ đề' : 'Đã tắt phụ đề';
        } else {
          art.notice.show = 'Video này chưa có phụ đề';
        }
      } else if (e.key === 'Escape') {
        if (art.fullscreenWeb) {
          e.preventDefault();
          art.fullscreenWeb = false;
          updateFullscreenIcon(false);
          art.notice.show = 'Đã thoát toàn màn hình';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleDocumentFullscreenChange);
      if (seekDebounceTimer) window.clearTimeout(seekDebounceTimer);
      if (artInstanceRef.current) {
        artInstanceRef.current.destroy(false);
        artInstanceRef.current = null;
      }
    };
  }, [video.id, video.video_url]);

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg isolate">
        <div ref={containerRef} className="w-full h-full" />

        {resumeBanner !== null && (
          <div className="pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/85 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-lg text-xs text-zinc-100">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Tiếp tục xem từ</span>
            <span className="font-mono font-semibold text-white">
              {formatSeconds(resumeBanner)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomArtPlayer;
