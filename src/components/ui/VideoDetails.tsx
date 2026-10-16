import React, { useState } from 'react';
import {
  Share2,
  Check,
  RotateCcw,
  Bookmark,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ThemeMode,
  TimestampBookmark,
  Video,
  VideoProgress,
} from '../../types/video';
import { formatSeconds, formatVietnameseDate } from '../../lib/progress';

interface VideoDetailsProps {
  video: Video;
  themeMode: ThemeMode;
  progress: VideoProgress | null;
  isFavorite: boolean;
  timestampBookmarks: TimestampBookmark[];
  activeTag: string;
  onToggleFavorite: (videoId: string) => void;
  onAddTimestampBookmark: (time: number, label: string) => void;
  onRemoveTimestampBookmark: (bookmarkId: string) => void;
  onTagClick: (tag: string) => void;
  onSeekTo: (seconds: number) => void;
  onResetProgress: (videoId: string) => void;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({
  video,
  themeMode,
  progress,
  isFavorite,
  timestampBookmarks,
  onToggleFavorite,
  onAddTimestampBookmark,
  onRemoveTimestampBookmark,
  onTagClick,
  onSeekTo,
  onResetProgress,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [bookmarkNote, setBookmarkNote] = useState<string>('');

  const isLight = themeMode === 'light';
  const currentSec = Math.floor(progress?.currentTime ?? 0);

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('v', video.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCreateMomentBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      bookmarkNote.trim() || `Khoảnh khắc tại ${formatSeconds(currentSec)}`;
    onAddTimestampBookmark(currentSec, label);
    setBookmarkNote('');
  };

  const renderDescriptionLine = (line: string, index: number) => {
    const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*-\s*(.+)$/;
    const match = line.trim().match(timeRegex);
    if (match) {
      const hasHours = Boolean(match[3]);
      const hours = hasHours ? parseInt(match[1], 10) : 0;
      const mins = hasHours ? parseInt(match[2], 10) : parseInt(match[1], 10);
      const secs = hasHours ? parseInt(match[3], 10) : parseInt(match[2], 10);
      const totalSeconds = hours * 3600 + mins * 60 + secs;
      const timeLabel = hasHours
        ? `${match[1]}:${match[2]}:${match[3]}`
        : `${match[1]}:${match[2]}`;
      const textLabel = match[4];

      return (
        <div key={index} className="flex items-baseline gap-2 py-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeekTo(totalSeconds);
            }}
            className="font-mono text-xs font-semibold text-rose-500 hover:underline cursor-pointer shrink-0"
          >
            {timeLabel}
          </button>
          <span>{textLabel}</span>
        </div>
      );
    }

    return (
      <p key={index} className="min-h-[1.25rem]">
        {line}
      </p>
    );
  };

  const descriptionText =
    video.description || 'Không có mô tả chi tiết cho video sự kiện này.';
  const descriptionLines = descriptionText.split('\n');
  const shouldTruncate =
    descriptionText.length > 140 || descriptionLines.length > 2;

  return (
    <section className="mt-3 space-y-3">
      {/* YouTube H1 Video Title */}
      <h1
        className={`text-lg sm:text-xl font-bold leading-snug ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}
      >
        {video.title}
      </h1>

      {/* Action Pills Row (Đã gỡ card thông tin Channel theo yêu cầu) */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onToggleFavorite(video.id)}
          aria-pressed={isFavorite}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isFavorite
              ? 'bg-[#F2A7CA] text-slate-950 font-bold'
              : isLight
              ? 'bg-slate-200/85 hover:bg-slate-300/80 text-slate-900'
              : 'bg-[#272727] hover:bg-[#3f3f3f] text-zinc-100'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${
              isFavorite ? 'fill-slate-950 text-slate-950' : ''
            }`}
          />
          <span>{isFavorite ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isLight
              ? 'bg-slate-200/85 hover:bg-slate-300/80 text-slate-900'
              : 'bg-[#272727] hover:bg-[#3f3f3f] text-zinc-100'
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Đã chép link</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ</span>
            </>
          )}
        </button>

        {progress && progress.currentTime > 3 && (
          <button
            type="button"
            onClick={() => onResetProgress(video.id)}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-slate-200/85 hover:bg-slate-300/80 text-slate-900'
                : 'bg-[#272727] hover:bg-[#3f3f3f] text-zinc-100'
            }`}
            title="Phát lại từ đầu (00:00)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xem từ đầu</span>
          </button>
        )}
      </div>

      {/* Shaded Description Box with Smooth Clickable Gradient Overlay */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`relative rounded-xl p-3.5 text-sm transition-all duration-200 cursor-pointer select-none group ${
          isLight
            ? 'bg-slate-200/65 hover:bg-slate-200/85 text-slate-900'
            : 'bg-[#272727] hover:bg-[#303030] text-zinc-100'
        }`}
        title="Bấm vào đây để mở rộng / thu gọn thông tin chi tiết video"
      >
        {/* Top metadata line inside description box */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold mb-2">
          <span>Ngày phát hành: {formatVietnameseDate(video.event_date)}</span>
          {video.tags?.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="text-rose-500 hover:underline cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Content text */}
        <div
          className={`text-xs sm:text-sm leading-relaxed space-y-1 transition-all ${
            !isExpanded && shouldTruncate
              ? 'max-h-16 overflow-hidden'
              : 'max-h-none'
          }`}
        >
          {descriptionLines.map((line, idx) =>
            renderDescriptionLine(line, idx)
          )}
        </div>

        {/* LỚP PHỦ MỜ KHI CHƯA MỞ RỘNG (Click vào bất kỳ đâu trên card là mở) */}
        {!isExpanded && shouldTruncate && (
          <div
            className={`absolute inset-x-0 bottom-0 h-14 rounded-b-xl flex items-end justify-center pb-2 pointer-events-none transition-colors ${
              isLight
                ? 'bg-gradient-to-t from-slate-200 via-slate-200/90 to-transparent'
                : 'bg-gradient-to-t from-[#272727] via-[#272727]/90 to-transparent'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
              <span>Chạm để xem toàn bộ thông tin</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </div>
          </div>
        )}

        {/* Khi đã mở rộng: Hiển thị nút Thu gọn */}
        {isExpanded && shouldTruncate && (
          <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-rose-500">
            <span className="opacity-75 font-normal text-zinc-400">
              Đang xem toàn bộ chi tiết & mốc thời gian
            </span>
            <span className="flex items-center gap-1 hover:underline">
              <span>Ẩn bớt</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
