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
} from 'lucide-react';
import Artplayer from 'artplayer';
import {
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
}

const SUN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

// Lucide React Outline Icons
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

// Nút Cài đặt phía trên bên phải khung chiếu video bằng Lucide React Settings
const SETTING_LUCIDE_HTML = renderToStaticMarkup(
  React.createElement(Settings, {
    size: 20,
    strokeWidth: 2,
    style: { fill: 'none', stroke: 'currentColor' },
    className: 'lucide lucide-settings',
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const artInstanceRef = useRef<Artplayer | null>(null);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onEndedNextRef = useRef(onEndedNext);

  const [resumeBanner, setResumeBanner] = useState<number | null>(null);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
    onEndedNextRef.current = onEndedNext;
  }, [onProgressUpdate, onEndedNext]);

  // Handle external seek requests (e.g. from timestamp bookmark clicks)
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

    const descHighlights = parseHighlightsFromDescription(video.description);
    const userHighlights = timestampBookmarks.map((b) => ({
      time: b.time,
      text: `★ ${b.label}`,
    }));
    const highlights = [...descHighlights, ...userHighlights];

    const hasConfiguredSubtitle = Boolean(video.subtitle_url?.trim());
    const isVtt = video.subtitle_url?.toLowerCase().includes('.vtt');

    /*
     * HÀM XỬ LÝ HÌNH TRONG NỀN (PICTURE-IN-PICTURE):
     * Hỗ trợ chuẩn HTML5 requestPictureInPicture, Safari WebKit Presentation Mode,
     * và chế độ Mini Mode góc dưới nếu iframe của browser chặn PiP.
     */
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

        // Safari / iOS PresentationMode
        if (
          (videoEl as any).webkitSupportsPresentationMode &&
          typeof (videoEl as any).webkitSetPresentationMode === 'function'
        ) {
          const currentMode = (videoEl as any).webkitPresentationMode;
          const nextMode =
            currentMode === 'picture-in-picture'
              ? 'inline'
              : 'picture-in-picture';
          (videoEl as any).webkitSetPresentationMode(nextMode);
          art.notice.show =
            nextMode === 'picture-in-picture'
              ? 'Đã bật hình trong nền (PiP)'
              : 'Đã thoát hình trong nền';
          return;
        }

        // Fallback: Chế độ thu nhỏ góc màn hình (Mini Mode)
        (art as any).mini = !(art as any).mini;
        art.notice.show = (art as any).mini
          ? 'Đã thu nhỏ góc màn hình'
          : 'Đã phóng to khung phát';
      } catch (err: any) {
        console.warn('PiP failed in iframe environment, falling back:', err);
        try {
          (art as any).mini = !(art as any).mini;
          art.notice.show = (art as any).mini
            ? 'Đã thu nhỏ góc màn hình (Hình trong nền)'
            : 'Đã phóng to khung phát';
        } catch {
          art.notice.show = 'Trình duyệt không hỗ trợ PiP trong iframe này';
        }
      }
    };

    /*
     * HÀM XỬ LÝ TOÀN MÀN HÌNH (FULLSCREEN):
     * Thử HTML5 native requestFullscreen, nếu bị chặn (do iframe/sandbox/mobile),
     * tự động chuyển sang Web Fullscreen (100vw x 100vh) đảm bảo hoạt động 100%.
     */
    const toggleFullscreen = async () => {
      const art = artInstanceRef.current;
      if (!art) return;

      // Nếu đang ở Web Fullscreen, thoát ra
      if (art.fullscreenWeb) {
        art.fullscreenWeb = false;
        updateFullscreenButtonIcon(false);
        art.notice.show = 'Đã thoát toàn màn hình';
        return;
      }

      // Nếu đang ở Native Fullscreen, thoát ra
      if (document.fullscreenElement || art.fullscreen) {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch {
          art.fullscreen = false;
        }
        updateFullscreenButtonIcon(false);
        art.notice.show = 'Đã thoát toàn màn hình';
        return;
      }

      // Thử Native Fullscreen trước
      try {
        const playerEl = art.template?.$player;
        if (
          document.fullscreenEnabled &&
          playerEl &&
          playerEl.requestFullscreen
        ) {
          await playerEl.requestFullscreen();
          updateFullscreenButtonIcon(true);
          art.notice.show = 'Đã bật toàn màn hình';
        } else {
          art.fullscreenWeb = true;
          updateFullscreenButtonIcon(true);
          art.notice.show = 'Toàn màn hình (Web Fullscreen)';
        }
      } catch (err) {
        // Iframe chặn Fullscreen hoặc Mobile không hỗ trợ Element Fullscreen -> Dùng Web Fullscreen
        console.warn(
          'Native fullscreen failed, fallback to fullscreenWeb:',
          err
        );
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

      // Cập nhật ngay lập tức chấm đỏ và thanh tiến trình đỏ để người dùng thấy phản hồi tức thì
      const ratio = duration > 0 ? targetTime / duration : 0;
      const containerEl = containerRef.current;
      if (containerEl) {
        const playedEl = containerEl.querySelector(
          '.art-progress-played'
        ) as HTMLElement | null;
        const indicatorEl = containerEl.querySelector(
          '.art-progress-indicator'
        ) as HTMLElement | null;
        const timeCurrentEl = containerEl.querySelector(
          '.art-time-current'
        ) as HTMLElement | null;
        if (playedEl) playedEl.style.width = `${ratio * 100}%`;
        if (indicatorEl) indicatorEl.style.left = `${ratio * 100}%`;
        if (timeCurrentEl) timeCurrentEl.textContent = formatSeconds(targetTime);
      }

      art.currentTime = targetTime;
      const direction = delta > 0 ? '⏩ Tua tới' : '⏪ Tua lùi';
      art.notice.show = `${direction} ${Math.abs(delta)}s (${formatSeconds(
        targetTime
      )})`;

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
      pip: false, // Dùng custom PiP control để đảm bảo không lỗi
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: false,
      aspectRatio: false,
      playbackRate: true,
      fullscreen: false, // Dùng custom Fullscreen control
      fullscreenWeb: true, // Cho phép fallback Web Fullscreen
      subtitleOffset: false, // Ẩn khỏi bảng setting vì đã có nút phụ đề ở mép dưới
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false,
      fastForward: true,
      gesture: true,
      theme: '#ff0033',
      lang: 'en',
      hotkey: false, // Quản lý hotkey tùy biến chuẩn yêu cầu
      highlight: highlights,
      subtitle: {
        url: video.subtitle_url || '',
        type: isVtt ? 'vtt' : 'srt',
        style: {
          color: '#ffffff',
          fontSize: '22px',
          fontWeight: 'bold',
          textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px #000',
        },
      },
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'metadata',
        playsInline: true,
      },
      layers: [
        /*
         * NÚT CÀI ĐẶT PHÍA TRÊN BÊN PHẢI KHUNG CHIẾU VIDEO
         */
        {
          name: 'top-settings-control',
          html: `
            <div class="art-layer-top-actions">
              <button type="button" class="art-top-setting-btn" title="Cài đặt phát video (Độ sáng, Tốc độ)">
                ${SETTING_LUCIDE_HTML}
              </button>
            </div>
          `,
          mounted($el) {
            const btn = $el.querySelector('.art-top-setting-btn');
            if (btn) {
              const handleOpenSetting = (ev: Event) => {
                ev.stopPropagation();
                ev.preventDefault();
                art.setting.toggle();
              };
              btn.addEventListener('click', handleOpenSetting);
              btn.addEventListener('touchend', handleOpenSetting);
            }
          },
        },
      ],
      /*
       * IN-PLAYER CONTROLS:
       * - Nút tua: Lucide React RotateCcw & RotateCw Outline
       * - Nút Phụ đề: Subtitles do Dev cấu hình
       * - Nút Hình trong nền: PictureInPicture2 (có fallback mini player)
       * - Nút Toàn màn hình: Maximize/Minimize (có fallback web fullscreen)
       */
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
          tooltip: hasConfiguredSubtitle
            ? 'Bật / Tắt Phụ đề (SRT/VTT)'
            : 'Chưa có phụ đề',
          click: () => {
            if (!hasConfiguredSubtitle || !art.subtitle.url) {
              art.notice.show =
                'Video này chưa có phụ đề';
              return;
            }
            art.subtitle.show = !art.subtitle.show;
            art.notice.show = art.subtitle.show
              ? 'Đã bật phụ đề'
              : 'Đã tắt phụ đề';
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
      ],
    });

    artInstanceRef.current = art;

    // Listen to Fullscreen changes
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

    document.addEventListener(
      'fullscreenchange',
      handleDocumentFullscreenChange
    );

    // Remove small play/pause button and built-in duplicate controls
    art.on('ready', () => {
      try {
        art.controls.remove('playAndPause');
        art.controls.remove('aspectRatio');
        art.controls.remove('flip');
      } catch {
        // Handled via CSS
      }

      if (art.template?.$video) {
        art.template.$video.style.filter =
          'brightness(' + initialBrightness + '%)';
        // Đặt âm lượng độc lập cho video từ thiết lập đã lưu
        art.template.$video.volume = initialVolume;
      }

      if (initialRate && initialRate !== 1) {
        art.playbackRate = initialRate;
      }

      // If subtitle is configured, enable it by default
      if (hasConfiguredSubtitle) {
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

    /*
     * TỐI ƯU TRẢI NGHIỆM VUỐT / KÉO GIỮ CHẤM ĐỎ TIẾN TRÌNH (TOUCH & POINTER SCRUBBING)
     */
    let cleanupScrubListeners: (() => void) | null = null;

    art.on('ready', () => {
      const containerEl = containerRef.current;
      if (!containerEl) return;

      const progressEl = containerEl.querySelector(
        '.art-progress'
      ) as HTMLElement | null;
      const playedEl = containerEl.querySelector(
        '.art-progress-played'
      ) as HTMLElement | null;
      const indicatorEl = containerEl.querySelector(
        '.art-progress-indicator'
      ) as HTMLElement | null;
      const tipEl = containerEl.querySelector(
        '.art-progress-tip'
      ) as HTMLElement | null;
      const playerEl = containerEl.querySelector(
        '.art-video-player'
      ) as HTMLElement | null;

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

        if (playedEl) {
          playedEl.style.width = `${ratio * 100}%`;
        }
        if (indicatorEl) {
          indicatorEl.style.left = `${ratio * 100}%`;
        }
        if (tipEl) {
          tipEl.textContent = formatSeconds(targetSeconds);
          tipEl.style.left = `${ratio * 100}%`;
          tipEl.style.opacity = '1';
          tipEl.style.transform = 'scale(1.1)';
        }

        art.currentTime = targetSeconds;
        art.notice.show = `🎯 ${formatSeconds(targetSeconds)} / ${formatSeconds(
          totalDuration
        )}`;

        if (commitSeek) {
          art.currentTime = targetSeconds;
        }
      };

      const handleScrubStart = (e: TouchEvent | MouseEvent) => {
        isDragging = true;
        wasPlayingBeforeDrag = art.playing;
        if (art.playing) {
          art.pause();
        }
        playerEl?.classList.add('art-is-scrubbing');
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubMove = (e: TouchEvent | MouseEvent) => {
        if (!isDragging) return;
        if (e.cancelable) {
          e.preventDefault();
        }
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, false);
      };

      const handleScrubEnd = (e: TouchEvent | MouseEvent) => {
        if (!isDragging) return;
        isDragging = false;
        playerEl?.classList.remove('art-is-scrubbing');
        const ratio = getRatioFromEvent(e);
        updateVisualScrub(ratio, true);

        if (wasPlayingBeforeDrag) {
          art.play();
        }
      };

      progressEl.addEventListener('touchstart', handleScrubStart, {
        passive: false,
      });
      window.addEventListener('touchmove', handleScrubMove, {
        passive: false,
      });
      window.addEventListener('touchend', handleScrubEnd, { passive: true });
      window.addEventListener('touchcancel', handleScrubEnd, {
        passive: true,
      });

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
      const updated = saveVideoProgress(video.id, {
        playbackRate: art.playbackRate,
      });
      onProgressUpdateRef.current?.(updated);
    });

    art.on('video:volumechange', () => {
      const updated = saveVideoProgress(video.id, {
        volume: art.muted ? 0 : art.volume,
      });
      onProgressUpdateRef.current?.(updated);
    });

    art.on('video:ended', () => {
      const updated = saveVideoProgress(video.id, {
        currentTime: 0,
        duration: art.duration || 0,
      });
      onProgressUpdateRef.current?.(updated);
      onEndedNextRef.current?.();
    });

    /*
     * BỘ PHÍM TẮT ĐIỀU KHIỂN CHUẨN:
     * - Dấu cách (Space / K): Tạm dừng / Phát video (chống cuộn trang & chống kích hoạt nhầm nút đang focus)
     * - Mũi tên Trái / Phải: Tua lùi / Tua tới 5s (hoặc J / L: 10s)
     * - Mũi tên Lên / Xuống: Tăng / Giảm âm lượng video (hoạt động độc lập với âm lượng hệ thống)
     * - Phím F: Toàn màn hình (Fullscreen)
     * - Phím P: Hình trong nền (Picture-in-Picture)
     * - Phím M: Tắt / Mở âm thanh video
     * - Phím C: Bật / Tắt phụ đề
     * - Phím Escape: Thoát toàn màn hình
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputFocused || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const isSpace =
        e.code === 'Space' ||
        e.key === ' ' ||
        e.key === 'Spacebar' ||
        (e as any).keyCode === 32;

      // 1. Phím Space hoặc K: Tạm dừng / Phát video
      if (isSpace || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        e.stopPropagation();

        // Bỏ focus phần tử hiện tại để tránh Space kích hoạt lại nút vừa bấm
        if (activeEl && typeof (activeEl as HTMLElement).blur === 'function') {
          (activeEl as HTMLElement).blur();
        }

        const videoEl = art.template?.$video as HTMLVideoElement | null;
        if (videoEl) {
          if (videoEl.paused) {
            const playPromise = videoEl.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                art.play().catch(() => {});
              });
            }
            art.notice.show = '▶ Đang phát';
          } else {
            videoEl.pause();
            art.notice.show = '⏸ Tạm dừng';
          }
        } else {
          art.toggle();
        }
        return;
      }
      // 2. Mũi tên Trái: Tua lùi 5s
      else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        seekRelative(-5);
      }
      // Mũi tên Phải: Tua tới 5s
      else if (e.code === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        seekRelative(5);
      }
      // Phím j / l: Tua 10s
      else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        seekRelative(-10);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        e.stopPropagation();
        seekRelative(10);
      }
      // 3. Mũi tên Lên: Tăng âm lượng video độc lập (+5%)
      else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (art.muted) {
          art.muted = false;
        }
        const currentVol = Math.round((art.volume ?? 0.85) * 100);
        const nextVol = Math.min(100, currentVol + 5);
        art.volume = nextVol / 100;
        if (art.template?.$video) {
          art.template.$video.volume = nextVol / 100;
        }
        art.notice.show = `🔊 Âm lượng video: ${nextVol}%`;
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        onProgressUpdateRef.current?.(updated);
      }
      // Mũi tên Xuống: Giảm âm lượng video độc lập (-5%)
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const currentVol = Math.round((art.volume ?? 0.85) * 100);
        const nextVol = Math.max(0, currentVol - 5);
        art.volume = nextVol / 100;
        if (art.template?.$video) {
          art.template.$video.volume = nextVol / 100;
        }
        if (nextVol === 0) {
          art.muted = true;
          art.notice.show = '🔇 Tắt âm video: 0%';
        } else {
          if (art.muted) art.muted = false;
          art.notice.show = `🔉 Âm lượng video: ${nextVol}%`;
        }
        const updated = saveVideoProgress(video.id, { volume: nextVol / 100 });
        onProgressUpdateRef.current?.(updated);
      }
      // 4. Phím F: Bật / Tắt toàn màn hình
      else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
      // 5. Phím P: Bật / Tắt hình trong nền (PiP)
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePip();
      }
      // 6. Phím M: Tắt / Bật tiếng
      else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        art.muted = !art.muted;
        art.notice.show = art.muted
          ? '🔇 Đã tắt tiếng (Muted)'
          : `🔊 Âm lượng video: ${Math.round(art.volume * 100)}%`;
        const updated = saveVideoProgress(video.id, {
          volume: art.muted ? 0 : art.volume,
        });
        onProgressUpdateRef.current?.(updated);
      }
      // 7. Phím C: Bật / Tắt phụ đề
      else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (hasConfiguredSubtitle && art.subtitle.url) {
          art.subtitle.show = !art.subtitle.show;
          art.notice.show = art.subtitle.show
            ? 'Đã bật phụ đề'
            : 'Đã tắt phụ đề';
        } else {
          art.notice.show =
            'Video này chưa có phụ đề (do Kỹ thuật viên cấu hình khi tải lên)';
        }
      }
      // 8. Phím Escape: Thoát web fullscreen
      else if (e.key === 'Escape') {
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
      document.removeEventListener(
        'fullscreenchange',
        handleDocumentFullscreenChange
      );
      if (cleanupScrubListeners) {
        cleanupScrubListeners();
      }
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
    video.description,
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
