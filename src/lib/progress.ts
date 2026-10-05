import {
  TimestampBookmark,
  VideoProgress,
  WatchHistoryItem,
} from '../types/video';

const PROGRESS_KEY_PREFIX = 'partystream_progress_';
const FAVORITES_STORAGE_KEY = 'partystream_favorites_v1';
const HISTORY_STORAGE_KEY = 'partystream_watch_history_v1';
const TIMESTAMP_BOOKMARKS_KEY = 'partystream_moment_bookmarks_v1';

export function getVideoProgress(videoId: string): VideoProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PROGRESS_KEY_PREFIX}${videoId}`);
    if (!raw) return null;
    return JSON.parse(raw) as VideoProgress;
  } catch {
    return null;
  }
}

export function saveVideoProgress(
  videoId: string,
  partial: Partial<Omit<VideoProgress, 'videoId' | 'updatedAt'>>
): VideoProgress {
  const existing = getVideoProgress(videoId);
  const next: VideoProgress = {
    videoId,
    currentTime: partial.currentTime ?? existing?.currentTime ?? 0,
    duration: partial.duration ?? existing?.duration ?? 0,
    playbackRate: partial.playbackRate ?? existing?.playbackRate ?? 1,
    volume: partial.volume ?? existing?.volume ?? 0.85,
    brightness: partial.brightness ?? existing?.brightness ?? 100,
    updatedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        `${PROGRESS_KEY_PREFIX}${videoId}`,
        JSON.stringify(next)
      );
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}

export function clearVideoProgress(videoId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${videoId}`);
  } catch {
    // Ignore errors
  }
}

export function getAllVideoProgressMap(
  videoIds: string[]
): Record<string, VideoProgress> {
  const map: Record<string, VideoProgress> = {};
  if (typeof window === 'undefined') return map;
  for (const id of videoIds) {
    const item = getVideoProgress(id);
    if (item) {
      map[id] = item;
    }
  }
  return map;
}

// ============================================================================
// BOOKMARK VIDEO YÊU THÍCH (FAVORITE VIDEOS)
// ============================================================================

export function getFavoriteVideoIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteVideoId(videoId: string): {
  favorites: string[];
  isFavorite: boolean;
} {
  const current = getFavoriteVideoIds();
  const exists = current.includes(videoId);
  const next = exists
    ? current.filter((id) => id !== videoId)
    : [videoId, ...current];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    favorites: next,
    isFavorite: !exists,
  };
}

// ============================================================================
// LỊCH SỬ XEM VIDEO (WATCH HISTORY)
// ============================================================================

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as WatchHistoryItem[])
      .map((item, index) => ({
        ...item,
        id: item.id || `wh-${item.videoId}-${item.lastWatchedAt || index}`,
      }))
      .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  } catch {
    return [];
  }
}

/**
 * Ghi lại lịch sử xem.
 * ĐẶC BIỆT: 1 video xem lại nhiều lần thì tính nhiều lần (không gộp lại rồi chỉ ghi lần xem mới nhất).
 * Khi người dùng mở xem video mới hoặc xem lại sau 2 phút, một bản ghi lịch sử mới sẽ được tạo riêng biệt.
 */
export function recordWatchHistory(
  videoId: string,
  lastPosition?: number,
  duration?: number,
  forceNewSession: boolean = false
): WatchHistoryItem[] {
  const current = getWatchHistory();
  const topItem = current[0];
  const progress = getVideoProgress(videoId);

  const pos =
    lastPosition !== undefined
      ? lastPosition
      : topItem?.videoId === videoId
      ? topItem.lastPosition
      : progress?.currentTime ?? 0;

  const dur =
    duration !== undefined && duration > 0
      ? duration
      : topItem?.videoId === videoId
      ? topItem.duration
      : progress?.duration ?? 0;

  const now = Date.now();
  // Nếu cùng là video ở đầu danh sách và xem liên tục trong vòng 2 phút, chỉ cập nhật tiến độ cho lần xem này
  const isSameOngoingSession =
    !forceNewSession &&
    topItem &&
    topItem.videoId === videoId &&
    now - topItem.lastWatchedAt < 120000;

  let next: WatchHistoryItem[];

  if (isSameOngoingSession) {
    const updatedTop: WatchHistoryItem = {
      ...topItem,
      lastWatchedAt: now,
      lastPosition: pos,
      duration: dur,
    };
    next = [updatedTop, ...current.slice(1)];
  } else {
    // Tạo MỚI một lượt xem riêng biệt (không xóa các lượt xem cũ của video này)
    const newEntry: WatchHistoryItem = {
      id: `wh-${now}-${Math.random().toString(36).slice(2, 7)}`,
      videoId,
      lastWatchedAt: now,
      lastPosition: pos,
      duration: dur,
    };
    next = [newEntry, ...current].slice(0, 100); // Giữ tới 100 lần xem gần nhất
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }

  return next;
}

export function removeWatchHistoryItem(targetId: string): WatchHistoryItem[] {
  const current = getWatchHistory();
  // Xóa theo ID lượt xem cụ thể (hoặc fallback videoId nếu bản ghi cũ)
  const next = current.filter(
    (item) => item.id !== targetId && item.videoId !== targetId
  );
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore errors
    }
  }
  return next;
}

export function clearAllWatchHistory(): WatchHistoryItem[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }
  return [];
}

// ============================================================================
// BOOKMARK MỐC THỜI GIAN TRONG VIDEO (TIMESTAMP BOOKMARKS)
// ============================================================================

function getAllTimestampBookmarks(): TimestampBookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TIMESTAMP_BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getVideoTimestampBookmarks(
  videoId: string
): TimestampBookmark[] {
  return getAllTimestampBookmarks()
    .filter((b) => b.videoId === videoId)
    .sort((a, b) => a.time - b.time);
}

export function addVideoTimestampBookmark(
  videoId: string,
  time: number,
  label: string
): TimestampBookmark[] {
  const all = getAllTimestampBookmarks();
  const cleanTime = Math.max(0, Math.floor(time));
  const newBookmark: TimestampBookmark = {
    id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    videoId,
    time: cleanTime,
    label: label.trim() || `Khoảnh khắc tại ${formatSeconds(cleanTime)}`,
    createdAt: Date.now(),
  };

  const nextAll = [...all, newBookmark];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        TIMESTAMP_BOOKMARKS_KEY,
        JSON.stringify(nextAll)
      );
    } catch {
      // Ignore quota errors
    }
  }

  return nextAll
    .filter((b) => b.videoId === videoId)
    .sort((a, b) => a.time - b.time);
}

export function removeVideoTimestampBookmark(
  videoId: string,
  bookmarkId: string
): TimestampBookmark[] {
  const all = getAllTimestampBookmarks();
  const nextAll = all.filter((b) => b.id !== bookmarkId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        TIMESTAMP_BOOKMARKS_KEY,
        JSON.stringify(nextAll)
      );
    } catch {
      // Ignore errors
    }
  }
  return nextAll
    .filter((b) => b.videoId === videoId)
    .sort((a, b) => a.time - b.time);
}

// ============================================================================
// FORMATTERS
// ============================================================================

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

export function formatRelativeTimeVi(epochMs: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - epochMs) / 1000));
  if (diffSec < 60) return 'Vừa xem xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} giờ trước`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Date(epochMs).toLocaleDateString('vi-VN');
}
