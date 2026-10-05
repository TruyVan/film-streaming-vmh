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
  React.createElement(RotateCcw, {
    size: 20,
    strokeWidth: 2.2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-rotate-ccw',
  })
);

const FORWARD_10_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(RotateCw, {
    size: 20,
    strokeWidth: 2.2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-rotate-cw',
  })
);

const SUBTITLES_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Subtitles, {
    size: 19,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-subtitles',
  })
);

const PIP_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(PictureInPicture2, {
    size: 19,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-picture-in-picture-2',
  })
);

const FULLSCREEN_MAX_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Maximize, {
    size: 19,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-maximize',
  })
);

const FULLSCREEN_MIN_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Minimize, {
    size: 19,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-minimize',
  })
);

const SETTING_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Settings, {
    size: 20,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-settings',
  })
);

const PLAY_CENTER_HTML = renderToStaticMarkup(
  React.createElement(Play, { size: 36, fill: 'currentColor' })
);
const PAUSE_CENTER_HTML = renderToStaticMarkup(
  React.createElement(Pause, { size: 36, fill: 'currentColor' })
);
const PREV_BTN_HTML = renderToStaticMarkup(
  React.createElement(SkipBack, { size: 26, fill: 'currentColor' })
);
const NEXT_BTN_HTML = renderToStaticMarkup(
  React.createElement(SkipForward, { size: 26, fill: 'currentColor' })
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

  // Handle external seek requests
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

    // Chuẩn hóa danh sách đa phụ đề
    const subList: SubtitleTrack[] =
      video.subtitles && video.subtitles.length > 0
        ? video.subtitles
        : video.subtitle_url
        ? [{ name: 'Tiếng Việt', url: video.subtitle_url, default: true }]
        : [];

    const defaultSub = subList.find((s) => s.default) || subList[0];
    const hasConfiguredSubtitle = subList.length > 0;

    const togglePip = async () => {
      const art = artInstanceRef.current;
      if (!art) return;
      const videoEl = art.template?.$video as HTMLVideoElement | null;
      if (!videoEl) return;

      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          art.notice.show = 'Đã thoát hình trong nền (PiP)';
          return;
        }

        if (videoEl.requestPictureInPicture) {
          await videoEl.requestPictureInPicture();
          art.notice.show = 'Đã bật hình trong nền (PiP)';
          return;
        }

        if (
          (videoEl as any).webkitSupportsPresentationMode &&
          typeof (videoEl as any).webkitSetPresentationMode === 'function'
        ) {
          const currentMode = (videoEl as any).webkitPresentationMode;
          const nextMode =
            currentMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture';
          (videoEl as any).webkitSetPresentationMode(nextMode);
          art.notice.show =
            nextMode === 'picture-in-picture'
              ? 'Đã bật hình trong nền (PiP)'
              : 'Đã thoát hình trong nền';
          return;
        }

        (art as any).mini = !(art as any).mini;
        art.notice.show = (art as any).mini
          ? 'Đã thu nhỏ góc màn hình'
          : 'Đã phóng to khung phát';
      } catch (err: any) {
        console.warn('PiP failed:', err);
      }
    };

    // FULLSCREEN + XOAY NGANG GYROSCOPE CHO MOBILE
    const toggleFullscreen = async () => {
      const art = artInstanceRef.current;
      if (!art) return;

      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (art.fullscreenWeb) {
        art.fullscreenWeb = false;
        updateFullscreenButtonIcon(false);
        art.notice.show = 'Đã thoát toàn màn hình';
        if (isMobile && screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock();
          } catch {}
        }
        return;
      }

      if (document.fullscreenElement || art.fullscreen) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
        } catch {
          art.fullscreen = false;
        }
        updateFullscreenButtonIcon(false);
        art.notice.show = 'Đã thoát toàn màn hình';
        if (isMobile && screen.orientation && 'unlock' in screen.orientation) {
          try {
            screen.orientation.unlock();
          } catch {}
        }
        return;
      }

      try {
        const playerEl = art.template?.$player;
        if (document.fullscreenEnabled && playerEl && playerEl.requestFullscreen) {
          await playerEl.requestFullscreen();
          updateFullscreenButtonIcon(true);
          art.notice.show = 'Đã bật toàn màn hình';
        } else {
          art.fullscreenWeb = true;
          updateFullscreenButtonIcon(true);
          art.notice.show = 'Toàn màn hình (Web Fullscreen)';
        }

        if (isMobile && screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (err) {
            console.warn('Orientation lock error:', err);
          }
        }
      } catch (err) {
        art.fullscreenWeb = true;
        updateFullscreenButtonIcon(true);
        art.notice.show = 'Toàn màn hình (Web Fullscreen)';
      }
    };

    const updateFullscreenButtonIcon = (isFullscreen: boolean) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const btn = containerEl.querySelector(
        '.art-control-fullscreen-toggle'
      ) as HTMLElement | null;
      if (btn) {
        btn.innerHTML = isFullscreen
          ? FULLSCREEN_MIN_LUCIDE_HTML
          : FULLSCREEN_MAX_LUCIDE_HTML;
        btn.setAttribute(
          'title',
          isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'
        );
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
      miniProgressBar: true,
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

      subtitle: defaultSub
        ? {
            url: defaultSub.url,
            type: defaultSub.url.endsWith('.vtt') ? 'vtt' : 'srt',
            style: {
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 'bold',
              textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px #000',
            },
          }
        : undefined,

      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'metadata',
        playsInline: true,
      },

      layers: [
        {
          name: 'top-settings-control',
          html: `
            <div class="art-layer-top-actions">
              <button type="button" class="art-top-setting-btn" title="Cài đặt phát video (Độ sáng, Tốc độ, Phụ đề)">
                ${SETTING_LUCIDE_HTML}
              </button>
            </div>
          `,
          mounted($el, artPlayerInstance: Artplayer) {
            const btn = $el.querySelector('.art-top-setting-btn');
            if (btn) {
              const handleOpenSetting = (ev: Event) => {
                ev.stopPropagation();
                ev.preventDefault();
                artPlayerInstance.setting.toggle();
              };
              btn.addEventListener('click', handleOpenSetting);
              btn.addEventListener('touchend', handleOpenSetting);
            }
          },
        },

        // ==============================================================
        // 2. YOUTUBE TOUCH ENGINE: SỬ DỤNG artPlayerInstance AN TOÀN TUYỆT ĐỐI
        // ==============================================================
        {
          name: 'youtube-touch-engine',
          html: `
            <div class="art-yt-overlay" style="position: absolute; inset: 0; z-index: 15; user-select: none; -webkit-tap-highlight-color: transparent;">
              <div class="art-yt-ripple-left" style="display: none; position: absolute; inset-y: 0; left: 0; width: 40%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); pointer-events: none; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 32px;">⏪</div>
                <div style="color: #fff; font-size: 13px; font-weight: bold; font-family: monospace; margin-top: 4px;">-10s</div>
              </div>

              <div class="art-yt-center-controls" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 40px; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); transition: opacity 0.25s ease; opacity: 0; pointer-events: none;">
                <button type="button" class="art-yt-btn-prev" style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, opacity 0.2s;" title="Tập trước đó">
                  ${PREV_BTN_HTML}
                </button>

                <button type="button" class="art-yt-btn-play" style="width: 72px; height: 72px; border-radius: 50%; background: #ff0033; border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(255,0,51,0.5); transition: transform 0.15s;" title="Phát / Tạm dừng">
                  ${PLAY_CENTER_HTML}
                </button>

                <button type="button" class="art-yt-btn-next" style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, opacity 0.2s;" title="Tập kế tiếp">
                  ${NEXT_BTN_HTML}
                </button>
              </div>

              <div class="art-yt-ripple-right" style="display: none; position: absolute; inset-y: 0; right: 0; width: 40%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); pointer-events: none; align-items: center; justify-content: center; flex-direction: column;">
                <div style="font-size: 32px;">⏩</div>
                <div style="color: #fff; font-size: 13px; font-weight: bold; font-family: monospace; margin-top: 4px;">+10s</div>
              </div>
            </div>
          `,
          mounted($el, artPlayerInstance: Artplayer) {
            const overlay = $el.querySelector('.art-yt-overlay') as HTMLElement | null;
            const centerControls = $el.querySelector('.art-yt-center-controls') as HTMLElement | null;
            const btnPlay = $el.querySelector('.art-yt-btn-play') as HTMLElement | null;
            const btnPrev = $el.querySelector('.art-yt-btn-prev') as HTMLElement | null;
            const btnNext = $el.querySelector('.art-yt-btn-next') as HTMLElement | null;
            const rippleLeft = $el.querySelector('.art-yt-ripple-left') as HTMLElement | null;
            const rippleRight = $el.querySelector('.art-yt-ripple-right') as HTMLElement | null;

            if (!overlay || !centerControls || !btnPlay || !btnPrev || !btnNext) return;

            if (hasPrev) {
              btnPrev.style.opacity = '1';
              btnPrev.style.cursor = 'pointer';
              btnPrev.style.pointerEvents = 'auto';
            } else {
              btnPrev.style.opacity = '0.25';
              btnPrev.style.cursor = 'not-allowed';
              btnPrev.style.pointerEvents = 'none';
            }

            if (hasNext) {
              btnNext.style.opacity = '1';
              btnNext.style.cursor = 'pointer';
              btnNext.style.pointerEvents = 'auto';
            } else {
              btnNext.style.opacity = '0.25';
              btnNext.style.cursor = 'not-allowed';
              btnNext.style.pointerEvents = 'none';
            }

            let autoHideTimer: any = null;
            const showControlsUI = () => {
              centerControls.style.opacity = '1';
              centerControls.style.pointerEvents = 'auto';
              if (autoHideTimer) clearTimeout(autoHideTimer);
              autoHideTimer = setTimeout(() => {
                if (artPlayerInstance.playing) {
                  centerControls.style.opacity = '0';
                  centerControls.style.pointerEvents = 'none';
                }
              }, 3500);
            };

            const hideControlsUI = () => {
              if (artPlayerInstance.playing) {
                centerControls.style.opacity = '0';
                centerControls.style.pointerEvents = 'none';
              }
            };

            artPlayerInstance.on('play', () => {
              btnPlay.innerHTML = PAUSE_CENTER_HTML;
              showControlsUI();
            });

            artPlayerInstance.on('pause', () => {
              btnPlay.innerHTML = PLAY_CENTER_HTML;
              centerControls.style.opacity = '1';
              centerControls.style.pointerEvents = 'auto';
              if (autoHideTimer) clearTimeout(autoHideTimer);
            });

            btnPlay.addEventListener('click', (e) => {
              e.stopPropagation();
              artPlayerInstance.toggle();
            });

            btnPrev.addEventListener('click', (e) => {
              e.stopPropagation();
              onPrevVideoRef.current?.();
            });

            btnNext.addEventListener('click', (e) => {
              e.stopPropagation();
              onNextVideoRef.current?.();
            });

            let lastTapTime = 0;
            let lastTapX = 0;

            const handleTapInteraction = (clientX: number) => {
              const rect = overlay.getBoundingClientRect();
              const offsetX = clientX - rect.left;
              const width = rect.width;
              const now = Date.now();

              const isDoubleTap = now - lastTapTime < 320;
              const isSameSide =
                (offsetX < width * 0.35 && lastTapX < width * 0.35) ||
                (offsetX > width * 0.65 && lastTapX > width * 0.65);

              if (isDoubleTap && isSameSide) {
                if (offsetX < width * 0.35) {
                  seekRelative(-10);
                  if (rippleLeft) {
                    rippleLeft.style.display = 'flex';
                    setTimeout(() => {
                      rippleLeft.style.display = 'none';
                    }, 500);
                  }
                } else if (offsetX > width * 0.65) {
                  seekRelative(10);
                  if (rippleRight) {
                    rippleRight.style.display = 'flex';
                    setTimeout(() => {
                      rippleRight.style.display = 'none';
                    }, 500);
                  }
                }
                lastTapTime = 0;
                hideControlsUI();
              } else {
                lastTapTime = now;
                lastTapX = offsetX;
                if (centerControls.style.opacity === '1') {
                  hideControlsUI();
                } else {
                  showControlsUI();
                }
              }
            };

            overlay.addEventListener('click', (e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              handleTapInteraction(e.clientX);
            });

            overlay.addEventListener('touchend', (e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              if (e.changedTouches && e.changedTouches[0]) {
                handleTapInteraction(e.changedTouches[0].clientX);
              }
            });
          },
        },
      ],

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
                  { html: 'Tắt phụ đề', url: '', default: !defaultSub },
                  ...subList.map((s) => ({
                    html: s.name,
                    url: s.url,
                    default: s.url === defaultSub?.url,
                  })),
                ],
                onSelect: (item: any) => {
                  if (!art.subtitle) return 'Chưa có phụ đề';
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

      // BẢO VỆ PHỤ ĐỀ: CHỈ BẬT KHI ĐỐI TƯỢNG SUBTITLE THỰC SỰ TỒN TẠI
      if (hasConfiguredSubtitle && art.subtitle) {
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
    });

    // KÉO GIỮ CHẤM ĐỎ TIẾN TRÌNH (SCRUBBING)
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
          tipEl.style.opacity = '1';
          tipEl.style.transform = 'scale(1.1)';
        }

        art.currentTime = targetSeconds;
        art.notice.show = `🎯 ${formatSeconds(targetSeconds)} / ${formatSeconds(totalDuration)}`;

        if (commitSeek) {
          art.currentTime = targetSeconds;
        }
      };

      const handleScrubStart = (e: TouchEvent | MouseEvent) => {
        isDragging = true;
        wasPlayingBeforeDrag = art.playing;
        if (art.playing) art.pause();
        playerEl?.classList.add('art-is-scrubbing');
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubMove = (e: TouchEvent | MouseEvent) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubEnd = (e: TouchEvent | MouseEvent) => {
        if (!isDragging) return;
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

    // BỘ PHÍM TẮT ĐIỀU KHIỂN
    const handleKeyDown = (e: KeyboardEvent) => {
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
