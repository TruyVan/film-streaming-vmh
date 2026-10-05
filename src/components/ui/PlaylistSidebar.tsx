import React, { useState } from 'react';
import {
  Film,
  X,
  Bookmark,
  History,
  Trash2,
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

interface PlaylistSidebarProps {
  videos: Video[];
  allVideosCount: number;
  currentVideoId: string;
  themeMode: ThemeMode;
  progressMap: Record<string, VideoProgress>;
  favoriteIds: string[];
  watchHistory: WatchHistoryItem[];
  playlistTab: PlaylistTab;
  searchQuery: string;
  activeCategory: string;
  isLoading?: boolean;
  onPlaylistTabChange: (tab: PlaylistTab) => void;
  onSelectVideo: (video: Video) => void;
  onToggleFavorite: (videoId: string) => void;
  onRemoveHistoryItem: (historyId: string) => void;
  onClearAllHistory: () => void;
  onClearFilters: () => void;
}

const ThumbnailWithFallback: React.FC<{
  src: string | null;
  alt: string;
}> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#F2BBC9] via-[#C9CFF2] to-[#A0DBF2] flex flex-col items-center justify-center p-2 text-center">
        <Film className="w-5 h-5 text-slate-800/80 mb-1" />
        <span className="text-[10px] text-slate-800 line-clamp-1 px-1">
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
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
    />
  );
};

export const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  videos,
  allVideosCount,
  currentVideoId,
  themeMode,
  progressMap,
  favoriteIds,
  watchHistory,
  playlistTab,
  searchQuery,
  activeCategory,
  isLoading = false,
  onPlaylistTabChange,
  onSelectVideo,
  onToggleFavorite,
  onRemoveHistoryItem,
  onClearAllHistory,
  onClearFilters,
}) => {
  const isLight = themeMode === 'light';
  const hasActiveFilter = Boolean(
    searchQuery.trim() || activeCategory !== 'ALL'
  );

  return (
    <aside className="w-full flex flex-col">
      {/* Header Danh sách phát / Video liên quan */}
      <div className="flex items-center justify-between pb-3 px-0.5">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-rose-500" />
          <h2 className="font-display text-sm font-bold tracking-tight">
            Danh sách phát ({videos.length})
          </h2>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClearFilters}
            className={`h-7 px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Bỏ lọc</span>
          </button>
        )}
      </div>

      {/* SKELETON LOADING (Chờ API) */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-1.5">
              <div
                className={`w-36 sm:w-40 aspect-video rounded-lg shrink-0 animate-pulse ${
                  isLight ? 'bg-slate-200' : 'bg-[#222228]'
                }`}
              />
              <div className="flex-1 space-y-2 pt-1">
                <div
                  className={`h-3.5 rounded w-4/5 animate-pulse ${
                    isLight ? 'bg-slate-200' : 'bg-[#272730]'
                  }`}
                />
                <div
                  className={`h-3 rounded w-1/2 animate-pulse ${
                    isLight ? 'bg-slate-200/70' : 'bg-[#202026]'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div
          className={`mt-2 p-6 rounded-xl border text-center space-y-2.5 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700'
              : 'bg-[#181818] border-white/10 text-zinc-300'
          }`}
        >
          <p className="text-xs font-semibold">
            Không tìm thấy video phù hợp
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="px-3.5 py-1.5 rounded-full bg-[#ff0033] text-white text-xs font-semibold cursor-pointer"
          >
            Hiển thị tất cả
          </button>
        </div>
      ) : (
        /* YouTube Compact Horizontal Up-Next Cards */
        <div className="space-y-2">
          {videos.map((item) => {
            const isPlaying = item.id === currentVideoId;
            const isFav = favoriteIds.includes(item.id);
            const prog = progressMap[item.id];
            const progressPercent =
              prog && prog.duration > 0
                ? Math.min(
                    100,
                    Math.round((prog.currentTime / prog.duration) * 100)
                  )
                : 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectVideo(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectVideo(item);
                  }
                }}
                className={`group relative w-full text-left flex items-start gap-2.5 p-1.5 rounded-xl transition-colors cursor-pointer select-none ${
                  isPlaying
                    ? isLight
                      ? 'bg-[#F2BBC9]/35'
                      : 'bg-white/[0.08]'
                    : isLight
                    ? 'hover:bg-slate-200/60'
                    : 'hover:bg-white/[0.05]'
                }`}
              >
                {/* Left 168px x 94px YouTube Compact Thumbnail */}
                <div className="relative w-36 sm:w-40 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                  <ThumbnailWithFallback
                    src={item.thumbnail_url}
                    alt={item.title}
                  />

                  {isPlaying && (
                    <div className="absolute top-1 left-1 bg-[#ff0033] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Đang phát
                    </div>
                  )}

                  {item.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[10px] font-medium px-1 py-0.5 rounded">
                      {item.duration}
                    </span>
                  )}

                  {progressPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                      <div
                        className="h-full bg-[#ff0033]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Right Video Title & Channel Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <h3
                    className={`text-xs font-semibold leading-snug line-clamp-2 ${
                      isPlaying
                        ? 'text-[#ff0033]'
                        : isLight
                        ? 'text-slate-900'
                        : 'text-zinc-100'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <div
                    className={`mt-1 text-[11px] leading-tight truncate ${
                      isLight ? 'text-slate-600' : 'text-zinc-400'
                    }`}
                  >
                    <div className="truncate">PartyStream Nội Bộ</div>
                    <div className="font-mono mt-0.5">
                      {formatVietnameseDate(item.event_date)}
                    </div>
                  </div>

                  {prog && prog.currentTime > 3 && (
                    <p className="mt-0.5 text-[10px] font-mono text-rose-500">
                      Đang xem {formatSeconds(prog.currentTime)}
                    </p>
                  )}
                </div>

                {/* Quick Favorite Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  aria-label="Lưu yêu thích"
                  className={`absolute top-1.5 right-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                    isFav
                      ? 'text-[#F2A7CA] opacity-100'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
