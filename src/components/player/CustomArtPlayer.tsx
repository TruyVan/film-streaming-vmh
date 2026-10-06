import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  RotateCcw,
  RotateCw,
  Subtitles,
  PictureInPicture2,
  Maximize,
  Minimize,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Lock,
  Unlock,
} from 'lucide-react';
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

const SUN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

// Lucide HTML Static Icons
const REWIND_10_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(RotateCcw, { size: 20, strokeWidth: 2.2, className: 'lucide lucide-rotate-ccw' })
);
const FORWARD_10_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(RotateCw, { size: 20, strokeWidth: 2.2, className: 'lucide lucide-rotate-cw' })
);
const SETTING_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Settings, { size: 19, strokeWidth: 2, className: 'lucide lucide-settings' })
);
const SUBTITLES_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Subtitles, { size: 19, strokeWidth: 2, className: 'lucide lucide-subtitles' })
);
const PIP_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(PictureInPicture2, { size: 19, strokeWidth: 2, className: 'lucide lucide-picture-in-picture-2' })
);
const FULLSCREEN_MAX_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Maximize, { size: 19, strokeWidth: 2, className: 'lucide lucide-maximize' })
);
const FULLSCREEN_MIN_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Minimize, { size: 19, strokeWidth: 2, className: 'lucide lucide-minimize' })
);

const LOCK_ICON_HTML = renderToStaticMarkup(
  React.createElement(Lock, { size: 18, strokeWidth: 2.2 })
);
const UNLOCK_ICON_HTML = renderToStaticMarkup(
  React.createElement(Unlock, { size: 18, strokeWidth: 2.2 })
);

const PLAY_CENTER_HTML = renderToStaticMarkup(
  React.createElement(Play, { size: 34, fill: 'currentColor', style: { marginLeft: '3px' } })
);
const PAUSE_CENTER_HTML = renderToStaticMarkup(
  React.createElement(Pause, { size: 34, fill: 'currentColor' })
);
const PREV_BTN_HTML = renderToStaticMarkup(
  React.createElement(SkipBack, { size: 24, fill: 'currentColor' })
);
const NEXT_BTN_HTML = renderToStaticMarkup(
  React.createElement(SkipForward, { size: 24, fill: 'currentColor' })
);

const FAST_FORWARD_ICON_HTML = renderToStaticMarkup(
  React.createElement(FastForward, { size: 34, fill: 'currentColor', style: { color: '#ffffff' } })
);
const REWIND_ICON_HTML = renderToStaticMarkup(
  React.createElement(FastForward, {
    size: 34,
    fill: 'currentColor',
    style: { transform: 'rotate(180deg)', color: '#ffffff' },
  })
);

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
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onEndedNextRef = useRef(onEndedNext);
  const onPrevVideoRef = useRef(onPrevVideo);
  const onNextVideoRef = useRef(onNextVideo);

  const [resumeBanner, setResumeBanner] = useState<number | null>(null);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
    onEndedNextRef.current = onEndedNext;
    onPrevVideoRef.current = onPrevVideo;
    onNextVideoRef.current = onNextVideo;
  }, [onProgressUpdate, onEndedNext, onPrevVideo, onNextVideo]);

  useEffect(() => {
    if (externalSeekTime && artInstanceRef.current) {
      artInstanceRef.current.currentTime = externalSeekTime.time;
      artInstanceRef.current.play();
      artInstanceRef.current.notice.show = `Đã chuyển tới ${formatSeconds(
        externalSeekTime.time
      )}`;
    }
  }, [externalSeekTime]);

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
      } catch (err: any) {
        console.warn('PiP error:', err);
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
        updateFullscreenButtonIcon(false);
        if (isMobile && screen.orientation && 'unlock' in screen.orientation) {
          try { screen.orientation.unlock(); } catch {}
        }
        art.notice.show = 'Đã thoát toàn màn hình';
        return;
      }

      if (videoEl && typeof videoEl.webkitEnterFullscreen === 'function' && !playerEl?.requestFullscreen) {
        videoEl.webkitEnterFullscreen();
        updateFullscreenButtonIcon(true);
        return;
      }

      try {
        if (playerEl && playerEl.requestFullscreen) {
          await playerEl.requestFullscreen();
          art.fullscreen = true;
          updateFullscreenButtonIcon(true);
          art.notice.show = 'Đã bật toàn màn hình';

          if (isMobile && screen.orientation && 'lock' in screen.orientation) {
            try {
              await (screen.orientation as any).lock('landscape');
            } catch {}
          }
          return;
        }

        art.fullscreenWeb = true;
        updateFullscreenButtonIcon(true);
        art.notice.show = 'Toàn màn hình (Web)';
      } catch (err) {
        art.fullscreenWeb = true;
        updateFullscreenButtonIcon(true);
      }
    };

    const updateFullscreenButtonIcon = (isFullscreen: boolean) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const btn = containerEl.querySelector('.art-control-fullscreen-toggle') as HTMLElement | null;
      if (btn) {
        btn.innerHTML = isFullscreen ? FULLSCREEN_MIN_LUCIDE_HTML : FULLSCREEN_MAX_LUCIDE_HTML;
        btn.setAttribute('title', isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình');
      }
    };

    let pendingSeekTarget: number | null = null;
    let seekDebounceTimeout: number | null = null;

    const seekRelative = (delta: number) => {
      const art = artInstanceRef.current;
      if (!art) return;
      const duration = art.duration || 0;
      const currentTime = art.currentTime || 0;
      const baseTime = pendingSeekTarget !== null ? pendingSeekTarget : currentTime;
      const targetTime = Math.max(0, Math.min(duration, baseTime + delta));
      pendingSeekTarget = targetTime;

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

      art.currentTime = targetTime;
      const direction = delta > 0 ? '⏩ Tua tới' : '⏪ Tua lùi';
      art.notice.show = `${direction} ${Math.abs(delta)}s (${formatSeconds(targetTime)})`;

      if (seekDebounceTimeout) window.clearTimeout(seekDebounceTimeout);
      seekDebounceTimeout = window.setTimeout(() => {
        pendingSeekTarget = null;
      }, 350);
    };

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
        // 1. NÚT KHÓA MÀN HÌNH ĐÃ DỜI LÊN GÓC TRÊN BÊN PHẢI (TRÁNH XA BANNER THÔNG BÁO)
        {
          name: 'lock-screen-control',
          html: `
            <div class="art-layer-lock-action" style="position: absolute; top: 16px; right: 16px; z-index: 65; transition: opacity 0.25s ease; opacity: 1;">
              <button type="button" class="art-lock-btn" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.55); border: 1.5px solid rgba(255,255,255,0.25); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: transform 0.15s, background 0.2s;" title="Khóa màn hình">
                ${UNLOCK_ICON_HTML}
              </button>
            </div>
          `,
        },

        // 2. HUD VUỐT ĐỘ SÁNG & ÂM LƯỢNG
        {
          name: 'gesture-hud-indicator',
          html: `
            <div class="art-gesture-hud" style="display: none; position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); z-index: 70; background: rgba(0,0,0,0.7); border: 1.5px solid rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 16px; color: white; font-family: monospace; font-size: 14px; font-weight: bold; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); pointer-events: none;">
              <span class="art-hud-icon"></span>
              <span class="art-hud-text"></span>
            </div>
          `,
        },

        // 3. TẦNG CỬ CHỈ TRONG SUỐT VỚI NÚT KÍNH MỜ
        {
          name: 'youtube-touch-engine',
          html: `
            <div class="art-yt-overlay" style="position: absolute; inset: 0; z-index: 10; user-select: none; -webkit-tap-highlight-color: transparent;">
              <!-- Sóng tua bên trái (30%) -->
              <div class="art-yt-ripple-left" style="display: none; position: absolute; inset-y: 0; left: 0; width: 30%; height: 100%; background: radial-gradient(circle at left center, rgba(255,255,255,0.25) 0%, transparent 70%); pointer-events: none; align-items: center; justify-content: center; flex-direction: column;">
                <div>${REWIND_ICON_HTML}</div>
                <div style="color: #ffffff; font-size: 13px; font-weight: bold; font-family: monospace; margin-top: 4px; text-shadow: 0 1px 4px rgba(0,0,0,0.9);">-10s</div>
              </div>

              <!-- Cụm nút trung tâm -->
              <div class="art-yt-center-controls" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 32px; background: transparent; transition: opacity 0.25s ease; opacity: 1; pointer-events: auto;">
                <button type="button" class="art-yt-btn-prev" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.45); border: 1.5px solid rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.15s, opacity 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.4); cursor: pointer;" title="Tập trước đó">
                  ${PREV_BTN_HTML}
                </button>

                <button type="button" class="art-yt-btn-play" style="width: 68px; height: 68px; border-radius: 50%; background: rgba(0,0,0,0.6); border: 2px solid rgba(255,255,255,0.4); backdrop-filter: blur(8px); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 24px rgba(0,0,0,0.6); transition: transform 0.15s;" title="Phát / Tạm dừng">
                  ${PLAY_CENTER_HTML}
                </button>

                <button type="button" class="art-yt-btn-next" style="width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.45); border: 1.5px solid rgba(255,255,255,0.25); backdrop-filter: blur(6px); color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.15s, opacity 0.2s; box-shadow: 0 4px 14px rgba(0,0,0,0.4); cursor: pointer;" title="Tập kế tiếp">
                  ${NEXT_BTN_HTML}
                </button>
              </div>

              <!-- Sóng tua bên phải (30%) -->
              <div class="art-yt-ripple-right" style="display: none; position: absolute; inset-y: 0; right: 0; width: 30%; height: 100%; background: radial-gradient(circle at right center, rgba(255,255,255,0.25) 0%, transparent 70%); pointer-events: none; align-items: center; justify-content: center; flex-direction: column;">
                <div>${FAST_FORWARD_ICON_HTML}</div>
                <div style="color: #ffffff; font-size: 13px; font-weight: bold; font-family: monospace; margin-top: 4px; text-shadow: 0 1px 4px rgba(0,0,0,0.9);">+10s</div>
              </div>
            </div>
          `,
        },
      ],

      // ==============================================================
      // CONTROLS ĐÁY: NÚT CÀI ĐẶT ĐÃ CHUYỂN XUỐNG CẠNH PHỤ ĐỀ (INDEX 30)
      // ==============================================================
      controls: [
        {
          name: 'rewind-10s',
          position: 'left',
          index: 10,
          html: REWIND_10_LUCIDE_HTML,
          tooltip: 'Tua lùi 10 giây',
          click: () => {
            seekRelative(-10);
          },
        },
        {
          name: 'forward-10s',
          position: 'left',
          index: 11,
          html: FORWARD_10_LUCIDE_HTML,
          tooltip: 'Tua tới 10 giây',
          click: () => {
            seekRelative(10);
          },
        },
        // NÚT CÀI ĐẶT NẰM Ở MÉP DƯỚI BÊN PHẢI (CẠNH PHỤ ĐỀ)
        {
          name: 'setting-bottom-btn',
          position: 'right',
          index: 30,
          html: SETTING_LUCIDE_HTML,
          tooltip: 'Cài đặt (Độ sáng, Tốc độ, Phụ đề)',
          click: () => {
            art.setting.toggle();
          },
        },
        {
          name: 'subtitles-toggle',
          position: 'right',
          index: 35,
          html: SUBTITLES_LUCIDE_HTML,
          tooltip: hasConfiguredSubtitle ? 'Bật / Tắt Phụ đề' : 'Chưa có phụ đề',
          click: () => {
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
          html: PIP_LUCIDE_HTML,
          tooltip: 'Hình trong nền',
          click: async () => {
            await togglePip();
          },
        },
        {
          name: 'fullscreen-toggle',
          position: 'right',
          index: 55,
          html: FULLSCREEN_MAX_LUCIDE_HTML,
          tooltip: 'Toàn màn hình',
          click: async () => {
            await toggleFullscreen();
          },
        },
      ],

      // MENU CÀI ĐẶT
      settings: [
        {
          html: 'Độ sáng',
          icon: SUN_ICON_SVG,
          tooltip: `${initialBrightness}%`,
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
            onProgressUpdateRef.current?.(updated);
            return val + '%';
          },
          onRange(item) {
            const rawVal = Array.isArray(item.range)
              ? item.range[0]
              : Number(item.$range?.value ?? item.range ?? 100);
            const val = Number.isFinite(rawVal) ? rawVal : 100;
            if (art.template?.$video) {
              art.template.$video.style.filter = 'brightness(' + val + '%)';
            }
            const updated = saveVideoProgress(video.id, { brightness: val });
            onProgressUpdateRef.current?.(updated);
            art.notice.show = `Độ sáng khung hình: ${val}%`;
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

    art.on('fullscreen', (state) => {
      updateFullscreenButtonIcon(state);
    });

    art.on('fullscreenWeb', (state) => {
      updateFullscreenButtonIcon(state);
    });

    const handleDocumentFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      updateFullscreenButtonIcon(isFs || Boolean(art.fullscreenWeb));
    };

    document.addEventListener('fullscreenchange', handleDocumentFullscreenChange);

    // ==============================================================
    // KHÓA ĐỒNG BỘ ĐÁY + CƠ CHẾ KHÓA MÀN HÌNH TRIỆT ĐỂ
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
        art.notice.show = `Tiếp tục xem từ ${formatSeconds(saved.currentTime)}`;
        window.setTimeout(() => setResumeBanner(null), 4500);
      }

      const containerEl = containerRef.current;
      if (!containerEl) return;

      // ==============================================================
      // FIX CSS VÀNG: MENU CÀI ĐẶT MỞ TỪ DƯỚI LÊN & FIX PADDING SUBMENU
      // ==============================================================
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        /* Menu Cài đặt nổi lên từ dưới đáy (Bottom-up) */
        .art-video-player .art-settings {
          z-index: 100 !important;
          pointer-events: auto !important;
          bottom: 52px !important;
          right: 12px !important;
        }
        .art-video-player .art-setting {
          z-index: 101 !important;
          pointer-events: auto !important;
        }
        /* Sửa lỗi bị cắt padding mục cuối cùng trong menu cài đặt */
        .art-video-player .art-setting-inner,
        .art-video-player .art-setting-panel {
          padding-bottom: 20px !important;
          max-height: 280px !important;
          overflow-y: auto !important;
          pointer-events: auto !important;
        }
        .art-video-player.art-setting-show .art-yt-overlay {
          display: none !important;
          pointer-events: none !important;
        }
        .art-video-player .art-bottom {
          z-index: 50 !important;
          pointer-events: none !important;
        }
        .art-video-player .art-controls,
        .art-video-player .art-progress {
          pointer-events: auto !important;
        }
        .art-video-player .art-progress {
          width: 100% !important;
          position: absolute !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 40px !important;
        }
        .art-video-player .art-progress-tip {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .art-video-player .art-progress:hover .art-progress-tip,
        .art-video-player.art-is-scrubbing .art-progress-tip {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .art-video-player .art-control {
            min-width: 40px !important;
            min-height: 40px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `;
      containerEl.appendChild(styleTag);

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

      // ==========================================
      // CHẾ ĐỘ KHÓA MÀN HÌNH TRIỆT ĐỂ (STRICT LOCK MODE)
      // ==========================================
      let isScreenLocked = false;
      let lockHideTimer: any = null;

      const showLockBtn = () => {
        if (!lockContainer) return;
        lockContainer.style.opacity = '1';
        lockContainer.style.pointerEvents = 'auto';
        if (lockHideTimer) clearTimeout(lockHideTimer);
        if (art.playing) {
          lockHideTimer = setTimeout(() => {
            lockContainer.style.opacity = '0';
            lockContainer.style.pointerEvents = 'none';
          }, 1000);
        }
      };

      const hideLockBtn = () => {
        if (!lockContainer) return;
        lockContainer.style.opacity = '0';
        lockContainer.style.pointerEvents = 'none';
      };

      if (btnLock && lockContainer) {
        const handleLockToggle = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          isScreenLocked = !isScreenLocked;
          btnLock.innerHTML = isScreenLocked ? LOCK_ICON_HTML : UNLOCK_ICON_HTML;
          btnLock.style.background = isScreenLocked ? 'rgba(255,0,51,0.85)' : 'rgba(0,0,0,0.55)';
          art.notice.show = isScreenLocked ? '🔒 Đã khóa màn hình' : '🔓 Đã mở khóa màn hình';

          if (isScreenLocked) {
            // KHÓA TRIỆT ĐỂ: Ẩn sạch tất cả nút chức năng
            if (centerControls) {
              centerControls.style.opacity = '0';
              centerControls.style.pointerEvents = 'none';
            }
            art.controls.show = false;
            showLockBtn();
          } else {
            // MỞ KHÓA: Hiện lại các nút điều khiển
            if (centerControls) {
              centerControls.style.opacity = '1';
              centerControls.style.pointerEvents = 'auto';
            }
            art.controls.show = true;
            showLockBtn();
          }
        };

        btnLock.addEventListener('click', handleLockToggle);
        btnLock.addEventListener('touchend', handleLockToggle);
      }

      // Tự động ẩn 3 nút sau 1.2 giây
      let autoHideTimer: any = null;
      const resetHideTimer = () => {
        if (autoHideTimer) clearTimeout(autoHideTimer);
        if (art.playing && !isScreenLocked) {
          autoHideTimer = setTimeout(() => {
            if (art.playing && !isScreenLocked) {
              if (centerControls) {
                centerControls.style.opacity = '0';
                centerControls.style.pointerEvents = 'none';
              }
              if (lockContainer) lockContainer.style.opacity = '0';
              art.controls.show = false;
            }
          }, 1200);
        }
      };

      // Gắn touchend trực tiếp cho các nút điều khiển đáy
      const fsBtn = containerEl.querySelector('.art-control-fullscreen-toggle');
      if (fsBtn) {
        fsBtn.addEventListener('touchend', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (!isScreenLocked) toggleFullscreen();
        });
      }

      const pipBtn = containerEl.querySelector('.art-control-pip-toggle');
      if (pipBtn) {
        pipBtn.addEventListener('touchend', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (!isScreenLocked) togglePip();
        });
      }

      const subBtn = containerEl.querySelector('.art-control-subtitles-toggle');
      if (subBtn) {
        subBtn.addEventListener('touchend', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (!isScreenLocked) {
            if (!hasConfiguredSubtitle || !art.subtitle) {
              art.notice.show = 'Video này chưa có phụ đề';
              return;
            }
            art.subtitle.show = !art.subtitle.show;
            art.notice.show = art.subtitle.show ? 'Đã bật phụ đề' : 'Đã tắt phụ đề';
          }
        });
      }

      const settingBottomBtn = containerEl.querySelector('.art-control-setting-bottom-btn');
      if (settingBottomBtn) {
        settingBottomBtn.addEventListener('touchend', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (!isScreenLocked) art.setting.toggle();
        });
      }

      if (overlay && centerControls && btnPlay && btnPrev && btnNext) {
        btnPrev.style.opacity = hasPrev ? '1' : '0.25';
        btnPrev.style.pointerEvents = hasPrev ? 'auto' : 'none';
        btnPrev.style.cursor = hasPrev ? 'pointer' : 'not-allowed';

        btnNext.style.opacity = hasNext ? '1' : '0.25';
        btnNext.style.pointerEvents = hasNext ? 'auto' : 'none';
        btnNext.style.cursor = hasNext ? 'pointer' : 'not-allowed';

        art.on('control', (state: boolean) => {
          if (isScreenLocked) return;
          if (art.playing) {
            centerControls.style.opacity = '0';
            centerControls.style.pointerEvents = 'none';
          } else {
            const isSettingOpen = art.setting && art.setting.show;
            if (state && !isSettingOpen) {
              centerControls.style.opacity = '1';
              centerControls.style.pointerEvents = 'auto';
            } else {
              centerControls.style.opacity = '0';
              centerControls.style.pointerEvents = 'none';
            }
          }
        });

        art.on('setting', (state: boolean) => {
          if (state) {
            centerControls.style.opacity = '0';
            centerControls.style.pointerEvents = 'none';
          } else if (!art.playing && !isScreenLocked) {
            centerControls.style.opacity = '1';
            centerControls.style.pointerEvents = 'auto';
          }
        });

        art.on('play', () => {
          btnPlay.innerHTML = PAUSE_CENTER_HTML;
          resetHideTimer();
        });

        art.on('pause', () => {
          btnPlay.innerHTML = PLAY_CENTER_HTML;
          if (!isScreenLocked) {
            art.controls.show = true;
            centerControls.style.opacity = '1';
            centerControls.style.pointerEvents = 'auto';
            if (lockContainer) lockContainer.style.opacity = '1';
          }
          if (autoHideTimer) clearTimeout(autoHideTimer);
        });

        const executeDirectPlay = () => {
          if (art.template?.$video) {
            const v = art.template.$video as HTMLVideoElement;
            if (v.paused) {
              const promise = v.play();
              if (promise !== undefined) promise.catch(() => art.play().catch(() => {}));
            } else {
              v.pause();
            }
          } else {
            art.toggle();
          }
        };

        btnPlay.addEventListener('click', (e) => {
          e.stopPropagation();
          executeDirectPlay();
        });
        btnPlay.addEventListener('touchend', (e) => {
          e.stopPropagation();
          executeDirectPlay();
        });

        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          onPrevVideoRef.current?.();
        });

        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          onNextVideoRef.current?.();
        });

        // ==========================================
        // VUỐT FULLSCREEN: ĐỘ SÁNG (TRÁI) & ÂM LƯỢNG (PHẢI)
        // ==========================================
        let touchStartX = 0;
        let touchStartY = 0;
        let isVerticalSwiping = false;
        let swipeTarget: 'brightness' | 'volume' | null = null;
        let initialBrightnessVal = 100;
        let initialVolumeVal = 0.85;

        overlay.addEventListener('touchstart', (e: TouchEvent) => {
          if (isScreenLocked || e.touches.length !== 1) return;
          const touch = e.touches[0];
          const rect = overlay.getBoundingClientRect();
          touchStartX = touch.clientX - rect.left;
          touchStartY = touch.clientY - rect.top;
          isVerticalSwiping = false;

          const savedVal = getVideoProgress(video.id);
          initialBrightnessVal = savedVal?.brightness ?? 100;
          initialVolumeVal = art.volume ?? 0.85;

          if (touchStartX < rect.width * 0.4) swipeTarget = 'brightness';
          else if (touchStartX > rect.width * 0.6) swipeTarget = 'volume';
          else swipeTarget = null;
        }, { passive: true });

        overlay.addEventListener('touchmove', (e: TouchEvent) => {
          if (isScreenLocked || !swipeTarget || e.touches.length !== 1) return;
          const touch = e.touches[0];
          const rect = overlay.getBoundingClientRect();
          const deltaY = touchStartY - (touch.clientY - rect.top);
          const deltaX = Math.abs((touch.clientX - rect.left) - touchStartX);

          if (Math.abs(deltaY) > 15 && Math.abs(deltaY) > deltaX) {
            isVerticalSwiping = true;
            const percentDelta = (deltaY / rect.height) * 150;

            if (swipeTarget === 'brightness') {
              const nextBrightness = Math.round(Math.max(50, Math.min(200, initialBrightnessVal + percentDelta)));
              if (art.template?.$video) {
                art.template.$video.style.filter = `brightness(${nextBrightness}%)`;
              }
              saveVideoProgress(video.id, { brightness: nextBrightness });
              if (hudContainer && hudText && hudIcon) {
                hudContainer.style.display = 'flex';
                hudIcon.innerHTML = '☀️';
                hudText.textContent = `Độ sáng: ${nextBrightness}%`;
              }
            } else if (swipeTarget === 'volume') {
              const nextVol = Math.max(0, Math.min(1, initialVolumeVal + (deltaY / rect.height)));
              art.volume = nextVol;
              if (art.template?.$video) art.template.$video.volume = nextVol;
              saveVideoProgress(video.id, { volume: nextVol });
              if (hudContainer && hudText && hudIcon) {
                hudContainer.style.display = 'flex';
                hudIcon.innerHTML = nextVol === 0 ? '🔇' : '🔊';
                hudText.textContent = `Âm lượng: ${Math.round(nextVol * 100)}%`;
              }
            }
          }
        }, { passive: true });

        overlay.addEventListener('touchend', () => {
          if (hudContainer) {
            setTimeout(() => { hudContainer.style.display = 'none'; }, 600);
          }
        });

        // ==========================================
        // CẢM BIẾN CHẠM: PHÂN BIỆT RÕ KHÓA MÀN HÌNH VÀ CỬ CHỈ
        // ==========================================
        let lastTapTime = 0;
        let lastTapSide: 'left' | 'right' | 'center' | null = null;
        let singleTapTimer: any = null;

        overlay.addEventListener('pointerup', (e: PointerEvent) => {
          if (isVerticalSwiping) {
            isVerticalSwiping = false;
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

          // KHI ĐANG KHÓA MÀN HÌNH: CHỈ ẨN / HIỆN NÚT Ổ KHÓA!
          if (isScreenLocked) {
            if (lockContainer) {
              if (lockContainer.style.opacity === '1') hideLockBtn();
              else showLockBtn();
            }
            return;
          }

          if (!art.playing) {
            executeDirectPlay();
            return;
          }

          const rect = overlay.getBoundingClientRect();
          const offsetX = e.clientX - rect.left;
          const width = rect.width;
          const now = Date.now();

          let currentSide: 'left' | 'right' | 'center' = 'center';
          if (offsetX < width * 0.30) currentSide = 'left';
          else if (offsetX > width * 0.70) currentSide = 'right';
          else currentSide = 'center';

          const isDoubleClick =
            now - lastTapTime < 300 &&
            lastTapSide === currentSide;

          if (isDoubleClick) {
            if (singleTapTimer) {
              clearTimeout(singleTapTimer);
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

            if (singleTapTimer) clearTimeout(singleTapTimer);
            singleTapTimer = setTimeout(() => {
              const isControlsShowing = centerControls.style.opacity === '1';
              if (isControlsShowing) {
                centerControls.style.opacity = '0';
                centerControls.style.pointerEvents = 'none';
                if (lockContainer) hideLockBtn();
                art.controls.show = false;
              } else {
                centerControls.style.opacity = '1';
                centerControls.style.pointerEvents = 'auto';
                if (lockContainer) showLockBtn();
                art.controls.show = true;
                resetHideTimer();
              }
              singleTapTimer = null;
            }, 260);
          }
        });
      }
    });

    // SCRUBBING TIẾN TRÌNH
    let cleanupScrubListeners: (() => void) | null = null;
    art.on('ready', () => {
      const containerEl = containerRef.current;
      if (!containerEl) return;

      const progressEl = containerEl.querySelector('.art-progress') as HTMLElement | null;
      const playedEl = containerEl.querySelector('.art-progress-played') as HTMLElement | null;
      const indicatorEl = containerEl.querySelector('.art-progress-indicator') as HTMLElement | null;
      const tipEl = containerEl.querySelector('.art-progress-tip') as HTMLElement | null;
      const playerEl = containerEl.querySelector('.art-video-player') as HTMLElement | null;

      if (!progressEl) return;

      let isDragging = false;
      let wasPlayingBeforeDrag = false;

      const getRatioFromEvent = (e: TouchEvent | MouseEvent): number => {
        const rect = progressEl.getBoundingClientRect();
        let clientX = 0;
        if ('touches' in e && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
        } else {
          clientX = (e as MouseEvent).clientX;
        }
        const offset = clientX - rect.left;
        return Math.max(0, Math.min(1, offset / rect.width));
      };

      const updateVisualScrub = (ratio: number, commitSeek: boolean) => {
        const totalDuration = art.duration || 0;
        const targetSeconds = ratio * totalDuration;

        if (playedEl) playedEl.style.width = `${ratio * 100}%`;
        if (indicatorEl) indicatorEl.style.left = `${ratio * 100}%`;
        if (tipEl) {
          tipEl.textContent = formatSeconds(targetSeconds);
          tipEl.style.left = `${ratio * 100}%`;
        }

        art.currentTime = targetSeconds;
        art.notice.show = `🎯 ${formatSeconds(targetSeconds)} / ${formatSeconds(totalDuration)}`;

        if (commitSeek) {
          art.currentTime = targetSeconds;
        }
      };

      const handleScrubStart = (e: TouchEvent | MouseEvent) => {
        if (isScreenLocked) return;
        isDragging = true;
        wasPlayingBeforeDrag = art.playing;
        if (art.playing) art.pause();
        playerEl?.classList.add('art-is-scrubbing');
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubMove = (e: TouchEvent | MouseEvent) => {
        if (isScreenLocked || !isDragging) return;
        if (e.cancelable) e.preventDefault();
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubEnd = (e: TouchEvent | MouseEvent) => {
        if (isScreenLocked || !isDragging) return;
        isDragging = false;
        playerEl?.classList.remove('art-is-scrubbing');
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, true);
        if (wasPlayingBeforeDrag) art.play();
      };

      progressEl.addEventListener('touchstart', handleScrubStart, { passive: false });
      window.addEventListener('touchmove', handleScrubMove, { passive: false });
      window.addEventListener('touchend', handleScrubEnd, { passive: true });
      window.addEventListener('touchcancel', handleScrubEnd, { passive: true });

      progressEl.addEventListener('mousedown', handleScrubStart);
      window.addEventListener('mousemove', handleScrubMove);
      window.addEventListener('mouseup', handleScrubEnd);

      cleanupScrubListeners = () => {
        progressEl.removeEventListener('touchstart', handleScrubStart);
        window.removeEventListener('touchmove', handleScrubMove);
        window.removeEventListener('touchend', handleScrubEnd);
        window.removeEventListener('touchcancel', handleScrubEnd);

        progressEl.removeEventListener('mousedown', handleScrubStart);
        window.removeEventListener('mousemove', handleScrubMove);
        window.removeEventListener('mouseup', handleScrubEnd);
      };
    });

    let lastSavedSecond = -1;
    art.on('video:timeupdate', () => {
      const currentSec = Math.floor(art.currentTime);
      if (currentSec !== lastSavedSecond && currentSec % 2 === 0) {
        lastSavedSecond = currentSec;
        const updated = saveVideoProgress(video.id, {
          currentTime: art.currentTime,
          duration: art.duration || 0,
          playbackRate: art.playbackRate,
          volume: art.volume,
        });
        onProgressUpdateRef.current?.(updated);
      }
    });

    art.on('video:ratechange', () => {
      const updated = saveVideoProgress(video.id, { playbackRate: art.playbackRate });
      onProgressUpdateRef.current?.(updated);
    });

    art.on('video:volumechange', () => {
      const updated = saveVideoProgress(video.id, { volume: art.muted ? 0 : art.volume });
      onProgressUpdateRef.current?.(updated);
    });

    art.on('video:ended', () => {
      const updated = saveVideoProgress(video.id, { currentTime: 0, duration: art.duration || 0 });
      onProgressUpdateRef.current?.(updated);
      onEndedNextRef.current?.();
    });

    // PHÍM TẮT BÀN PHÍM
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScreenLocked) return;
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputFocused || e.ctrlKey || e.metaKey || e.altKey) return;

      const isSpace =
        e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || (e as any).keyCode === 32;

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
        art.notice.show = `🔊 Âm lượng: ${nextVol}%`;
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        onProgressUpdateRef.current?.(updated);
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
          art.notice.show = `🔉 Âm lượng: ${nextVol}%`;
        }
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        onProgressUpdateRef.current?.(updated);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePip();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        art.muted = !art.muted;
        art.notice.show = art.muted ? '🔇 Đã tắt tiếng' : `🔊 Âm lượng: ${Math.round(art.volume * 100)}%`;
        const updated = saveVideoProgress(video.id, { volume: art.muted ? 0 : art.volume });
        onProgressUpdateRef.current?.(updated);
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
          updateFullscreenButtonIcon(false);
          art.notice.show = 'Đã thoát toàn màn hình';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleDocumentFullscreenChange);
      if (cleanupScrubListeners) cleanupScrubListeners();
      if (artInstanceRef.current) {
        artInstanceRef.current.destroy(false);
        artInstanceRef.current = null;
      }
    };
  }, [
    video.id,
    video.video_url,
    video.thumbnail_url,
    video.subtitle_url,
    video.subtitles,
    video.description,
    hasPrev,
    hasNext,
  ]);

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
