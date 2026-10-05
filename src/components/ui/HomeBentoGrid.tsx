import React, { useState, useRef, useEffect } from 'react';
import {
  Bookmark,
  History,
  Film,
  Trash2,
  SlidersHorizontal,
  MoreVertical,
  Share2,
  Check,
} from 'lucide-react';
import {
  PlaylistTab,
  ThemeMode,
  Video,
  VideoProgress,
  WatchHistoryItem,
} from '../../types/video';
import {
  formatRelativeTimeVi,
  formatSeconds,
  formatVietnameseDate,
} from '../../lib/progress';

interface HomeBentoGridProps {
  videos: Video[];
  allVideos: Video[];
  themeMode: ThemeMode;
  progressMap: Record<string, VideoProgress>;
  favoriteIds: string[];
  watchHistory: WatchHistoryItem[];
  playlistTab: PlaylistTab;
  activeCategory: string;
  searchQuery: string;
  customTopics: string[];
  isLoading?: boolean;
  onOpenTopicManager: () => void;
  onSelectVideo: (video: Video) => void;
  onToggleFavorite: (videoId: string) => void;
  onPlaylistTabChange: (tab: PlaylistTab) => void;
  onCategoryChange: (cat: string) => void;
  onRemoveHistoryItem: (historyId: string) => void;
  onClearAllHistory: () => void;
  onClearFilters: () => void;
}

const VideoThumbnail: React.FC<{
  src: string | null;
  alt: string;
}> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#F2BBC9] via-[#C9CFF2] to-[#A0DBF2] flex flex-col items-center justify-center p-3 text-center">
        <Film className="w-8 h-8 text-slate-800/70 mb-1" />
        <span className="text-xs font-medium text-slate-800 line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
    />
  );
};

/*
 * Skeleton Loaders khi đang chờ API trả dữ liệu
 */
const VideoCardSkeleton: React.FC<{ isLight: boolean }> = ({ isLight }) => (
  <div className="flex flex-col select-none">
    <div
      className={`aspect-video w-full rounded-xl sm:rounded-2xl animate-pulse ${
        isLight ? 'bg-slate-200/80' : 'bg-[#222228]'
      }`}
    />
    <div className="mt-3 space-y-2">
      <div
        className={`h-4 rounded-md w-4/5 animate-pulse ${
          isLight ? 'bg-slate-200' : 'bg-[#272730]'
        }`}
      />
      <div
        className={`h-3 rounded-md w-1/2 animate-pulse ${
          isLight ? 'bg-slate-200/70' : 'bg-[#202026]'
        }`}
      />
    </div>
  </div>
);

const HistoryRowSkeleton: React.FC<{ isLight: boolean }> = ({ isLight }) => (
  <div className="flex items-center gap-3 sm:gap-4 py-2 select-none">
    <div
      className={`w-32 sm:w-40 md:w-44 aspect-video rounded-lg sm:rounded-xl shrink-0 animate-pulse ${
        isLight ? 'bg-slate-200/80' : 'bg-[#222228]'
      }`}
    />
    <div className="flex-1 min-w-0 space-y-2">
      <div
        className={`h-4 rounded-md w-3/4 animate-pulse ${
          isLight ? 'bg-slate-200' : 'bg-[#272730]'
        }`}
      />
      <div
        className={`h-3 rounded-md w-1/3 animate-pulse ${
          isLight ? 'bg-slate-200/70' : 'bg-[#202026]'
        }`}
      />
      <div
        className={`h-2.5 rounded-md w-1/4 animate-pulse ${
          isLight ? 'bg-slate-200/50' : 'bg-[#1c1c22]'
        }`}
      />
    </div>
  </div>
);

export const HomeBentoGrid: React.FC<HomeBentoGridProps> = ({
  videos,
  allVideos,
  themeMode,
  progressMap,
  favoriteIds,
  watchHistory,
  playlistTab,
  activeCategory,
  searchQuery,
  customTopics,
  isLoading = false,
  onOpenTopicManager,
  onSelectVideo,
  onToggleFavorite,
  onPlaylistTabChange,
  onCategoryChange,
  onRemoveHistoryItem,
  onClearAllHistory,
  onClearFilters,
}) => {
  const isLight = themeMode === 'light';

  // State for popover menu in History rows
  const [activeMenuHistoryId, setActiveMenuHistoryId] = useState<string | null>(
    null
  );
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuHistoryId(null);
      }
    };
    if (activeMenuHistoryId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuHistoryId]);

  /*
   * TÍNH LỊCH SỬ XEM:
   * 1 video xem lại nhiều lần thì tính nhiều lần (không gộp lại).
   * Lọc và map từng bản ghi watchHistory với thông tin Video tương ứng.
   */
  const filteredHistoryItems = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return watchHistory
      .map((hist) => {
        const video = allVideos.find((v) => v.id === hist.videoId);
        return { hist, video };
      })
      .filter((item): item is { hist: WatchHistoryItem; video: Video } => {
        if (!item.video) return false;
        if (!q) return true;
        const inTitle = item.video.title.toLowerCase().includes(q);
        const inTags = item.video.tags.some((t) =>
          t.toLowerCase().includes(q)
        );
        return inTitle || inTags;
      });
  }, [watchHistory, allVideos, searchQuery]);

  const handleCopyLink = async (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('v', videoId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopiedShareId(videoId);
      window.setTimeout(() => setCopiedShareId(null), 2000);
    } catch {
      setCopiedShareId(videoId);
      window.setTimeout(() => setCopiedShareId(null), 2000);
    }
  };

  return (
    <div className="flex-1 min-w-0 pb-20 md:pb-12">
      {/* YOUTUBE STICKY FILTER CHIPS BAR (Chỉ hiển thị ở Trang chủ Tất cả Video) */}
      {playlistTab === 'all' && (
        <div
          className={`sticky top-14 z-30 px-3 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto border-b transition-colors ${
            isLight
              ? 'bg-[#FAF7F9]/95 border-slate-200/80'
              : 'bg-[#0f0f0f]/95 border-white/[0.06]'
          } backdrop-blur-md`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Chip "Tất cả" */}
          <button
            type="button"
            onClick={() => {
              onPlaylistTabChange('all');
              onCategoryChange('ALL');
            }}
            className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === 'ALL'
                ? isLight
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-950'
                : isLight
                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                : 'bg-[#272727] hover:bg-[#3f3f3f] text-zinc-200'
            }`}
          >
            Tất cả
          </button>

          {/* Dynamic Topic Chips from User Configuration */}
          {customTopics.map((topic) => {
            const isSelected =
              activeCategory.toLowerCase() === topic.toLowerCase();
            return (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  onPlaylistTabChange('all');
                  onCategoryChange(topic);
                }}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? isLight
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-950'
                    : isLight
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                    : 'bg-[#272727] hover:bg-[#3f3f3f] text-zinc-200'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      )}

      {/* SECTION HEADER FOR FAVORITES & HISTORY */}
      {(playlistTab === 'favorites' || playlistTab === 'history') && (
        <div className="px-3 sm:px-6 pt-4 sm:pt-5 max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold">
              {playlistTab === 'favorites'
                ? 'Danh sách Video Yêu thích'
                : 'Lịch sử xem'}
            </h1>
            <p className="text-xs opacity-65 mt-0.5">
              {playlistTab === 'favorites'
                ? `${videos.length} video đã lưu`
                : `${filteredHistoryItems.length} lượt xem được ghi nhận`}
            </p>
          </div>

          {playlistTab === 'history' && watchHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearAllHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Xóa toàn bộ lịch sử xem"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ</span>
            </button>
          )}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-6">
        {/* 1. SKELETON LOADING (Chờ API trả dữ liệu thật) */}
        {isLoading ? (
          playlistTab === 'history' ? (
            <div className="max-w-3xl mx-auto space-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <HistoryRowSkeleton key={i} isLight={isLight} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 sm:gap-y-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={i} isLight={isLight} />
              ))}
            </div>
          )
        ) : playlistTab === 'history' ? (
          /*
           * 2. TINH GỌN LỊCH SỬ XEM (CHUẨN GIAO DIỆN YOUTUBE THEO SCREENSHOT):
           * - Cực kỳ tinh gọn: Thumbnail bên trái, Title + Channel + Thời gian xem bên phải
           * - Nút ⋮ (3 chấm) để thao tác xóa hoặc lưu
           * - 1 video xem lại nhiều lần thì xuất hiện nhiều lần riêng biệt
           */
          filteredHistoryItems.length === 0 ? (
            <div
              className={`max-w-md mx-auto my-8 sm:my-12 p-6 sm:p-8 rounded-2xl border text-center space-y-3 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#181818] border-white/10 text-zinc-200'
              }`}
            >
              <History className="w-8 h-8 mx-auto opacity-50 text-[#C9CFF2]" />
              <p className="text-base font-semibold">Nhật ký xem đang trống</p>
              <p className="text-xs opacity-65 leading-relaxed">
                Mỗi lần bạn mở xem một video, lượt xem sẽ được ghi nhận riêng
                biệt tại đây.
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff0033] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Về trang chủ tất cả video
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto divide-y divide-black/5 dark:divide-white/[0.04]">
              {filteredHistoryItems.map(({ hist, video }) => {
                const isFav = favoriteIds.includes(video.id);
                const itemDuration =
                  hist.duration > 0
                    ? hist.duration
                    : progressMap[video.id]?.duration || 0;
                const progressPercent =
                  itemDuration > 0 && hist.lastPosition > 0
                    ? Math.min(
                        100,
                        Math.round((hist.lastPosition / itemDuration) * 100)
                      )
                    : 0;
                const isMenuOpen = activeMenuHistoryId === hist.id;
                const primaryTag = video.tags?.[0] || 'Sự kiện';

                return (
                  <article
                    key={hist.id}
                    onClick={() => onSelectVideo(video)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVideo(video);
                      }
                    }}
                    className={`group relative flex items-start gap-3 sm:gap-4 py-2.5 sm:py-3 transition-colors cursor-pointer select-none rounded-xl px-1 sm:px-2 ${
                      isLight ? 'hover:bg-slate-100/70' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Left: Compact 16:9 Thumbnail (Chuẩn YouTube Mobile) */}
                    <div className="relative w-32 sm:w-40 md:w-44 shrink-0 aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-black shadow-xs">
                      <VideoThumbnail
                        src={video.thumbnail_url}
                        alt={video.title}
                      />

                      {/* Duration Badge */}
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[10px] sm:text-[11px] font-medium px-1 sm:px-1.5 py-0.5 rounded">
                          {video.duration}
                        </span>
                      )}

                      {/* Red Progress Bar at Bottom of Thumbnail */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                          <div
                            className="h-full bg-[#ff0033]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Ultra-compact Information (Title, Channel, Watched Time) */}
                    <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                      <h3
                        className={`text-xs sm:text-sm font-medium leading-snug line-clamp-2 transition-colors ${
                          isLight
                            ? 'text-slate-900 group-hover:text-rose-600'
                            : 'text-zinc-100 group-hover:text-rose-400'
                        }`}
                      >
                        {video.title}
                      </h3>

                      <div
                        className={`mt-1 text-[11px] sm:text-xs leading-relaxed truncate ${
                          isLight ? 'text-slate-600' : 'text-zinc-400'
                        }`}
                      >
                        PartyStream · {primaryTag}
                      </div>

                      <div
                        className={`mt-0.5 text-[11px] font-mono flex flex-wrap items-center gap-1.5 ${
                          isLight ? 'text-slate-500' : 'text-zinc-500'
                        }`}
                      >
                        <span>{formatRelativeTimeVi(hist.lastWatchedAt)}</span>
                        {hist.lastPosition > 3 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-rose-500 font-medium">
                              đang dừng ở {formatSeconds(hist.lastPosition)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Far Right: YouTube 3-dots Menu Button */}
                    <div
                      className="relative shrink-0 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuHistoryId(isMenuOpen ? null : hist.id);
                        }}
                        aria-label="Thao tác khác"
                        title="Thao tác"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isLight
                            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                            : 'text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* YouTube Context Menu Popover */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className={`absolute right-0 top-9 z-50 w-52 rounded-xl border shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'bg-[#222228] border-white/15 text-zinc-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveHistoryItem(hist.id);
                              setActiveMenuHistoryId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer text-left"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>Xóa khỏi nhật ký xem</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(video.id);
                              setActiveMenuHistoryId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                          >
                            <Bookmark
                              className={`w-4 h-4 shrink-0 ${
                                isFav ? 'fill-current text-[#F2A7CA]' : ''
                              }`}
                            />
                            <span>
                              {isFav ? 'Bỏ lưu yêu thích' : 'Lưu vào yêu thích'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              handleCopyLink(e, video.id);
                              setActiveMenuHistoryId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                          >
                            {copiedShareId === video.id ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>Đã sao chép link</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 shrink-0" />
                                <span>Chia sẻ liên kết</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          /*
           * 3. YOUTUBE HOME FEED & FAVORITES GRID
           */
          videos.length === 0 ? (
            <div
              className={`max-w-md mx-auto my-8 sm:my-12 p-6 sm:p-8 rounded-2xl border text-center space-y-3 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#181818] border-white/10 text-zinc-200'
              }`}
            >
              {playlistTab === 'favorites' ? (
                <Bookmark className="w-8 h-8 mx-auto opacity-50 text-[#F2A7CA]" />
              ) : (
                <Film className="w-8 h-8 mx-auto opacity-50" />
              )}
              <p className="text-base font-semibold">
                {playlistTab === 'favorites'
                  ? 'Chưa có video yêu thích nào'
                  : `Không tìm thấy kết quả cho "${searchQuery}"`}
              </p>
              <p className="text-xs opacity-65 leading-relaxed">
                {playlistTab === 'favorites'
                  ? 'Nhấn biểu tượng Lưu yêu thích trên video để thêm vào danh sách riêng.'
                  : 'Hãy thử chọn chủ đề khác hoặc xóa từ khóa tìm kiếm.'}
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff0033] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Về trang chủ tất cả video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 sm:gap-y-8">
              {videos.map((video) => {
                const isFav = favoriteIds.includes(video.id);
                const prog = progressMap[video.id];
                const progressPercent =
                  prog && prog.duration > 0
                    ? Math.min(
                        100,
                        Math.round((prog.currentTime / prog.duration) * 100)
                      )
                    : 0;
                const primaryTag = video.tags?.[0] || 'Sự kiện';

                return (
                  <article
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectVideo(video);
                      }
                    }}
                    className="group cursor-pointer flex flex-col select-none"
                  >
                    {/* 16:9 Thumbnail with Duration and Progress Bar */}
                    <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-2xs">
                      <VideoThumbnail
                        src={video.thumbnail_url}
                        alt={video.title}
                      />

                      {/* Bookmark Toggle Button */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(video.id);
                          }}
                          aria-label="Lưu yêu thích"
                          title={
                            isFav ? 'Bỏ khỏi Yêu thích' : 'Lưu vào Yêu thích'
                          }
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isFav
                              ? 'bg-[#F2A7CA] text-slate-950 opacity-100 shadow-xs'
                              : 'bg-black/60 text-white sm:opacity-0 group-hover:opacity-100 hover:bg-black/80'
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-slate-950' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Duration Badge */}
                      {video.duration && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white font-mono text-[11px] font-medium px-1.5 py-0.5 rounded">
                          {video.duration}
                        </span>
                      )}

                      {/* YouTube Watch Progress Bar */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                          <div
                            className="h-full bg-[#ff0033]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Metadata: Title + Tag + Date */}
                    <div className="mt-2.5 sm:mt-3 flex-1 min-w-0">
                      <h3
                        className={`text-sm font-semibold leading-snug line-clamp-2 transition-colors ${
                          isLight
                            ? 'text-slate-900 group-hover:text-rose-600'
                            : 'text-zinc-100 group-hover:text-rose-400'
                        }`}
                      >
                        {video.title}
                      </h3>

                      <div
                        className={`mt-1 text-xs leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-zinc-400'
                        }`}
                      >
                        <div className="truncate">
                          PartyStream · {primaryTag}
                        </div>
                        <div className="font-mono flex flex-wrap items-center gap-x-1.5">
                          <span>{formatVietnameseDate(video.event_date)}</span>
                          {prog && prog.currentTime > 3 ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-500 font-medium">
                                Đang xem {formatSeconds(prog.currentTime)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};
