export interface SubtitleTrack {
  name: string;      // Tên hiển thị (Ví dụ: "Tiếng Việt", "English")
  url: string;       // Link file .vtt / .srt hoặc Data URI
  default?: boolean; // Phụ đề mặc định bật
}

// Bổ sung vào interface Video:
export interface Video {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  duration?: string;
  video_url: string;
  thumbnail_url?: string | null;
  subtitle_url?: string | null;
  subtitles?: SubtitleTrack[]; // <-- Danh sách đa phụ đề
  tags?: string[];
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export interface VideoProgress {
  videoId: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  brightness: number; // 50 to 200 (%)
  updatedAt: number;
}

export interface WatchHistoryItem {
  id: string; // Unique ID for each watch occurrence
  videoId: string;
  lastWatchedAt: number; // epoch ms
  lastPosition: number; // seconds
  duration: number; // seconds
}

export interface TimestampBookmark {
  id: string;
  videoId: string;
  time: number; // seconds
  label: string;
  createdAt: number;
}

export type PlaylistTab = 'all' | 'favorites' | 'history';

export type ViewMode = 'default' | 'cinema';

export type ThemeMode = 'light' | 'dark';

export interface NewVideoInput {
  title: string;
  description: string;
  event_date: string;
  duration: string;
  video_url: string;
  thumbnail_url?: string;
  subtitle_url?: string;
  tags: string[];
}

export interface UpdateVideoInput {
  id: string;
  title: string;
  description: string;
  event_date: string;
  duration: string;
  video_url: string;
  thumbnail_url?: string;
  subtitle_url?: string;
  tags: string[];
}
