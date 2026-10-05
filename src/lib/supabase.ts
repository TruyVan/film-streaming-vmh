import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NewVideoInput, UpdateVideoInput, Video, WatchHistoryItem } from '../types/video';

// 1. KHỞI TẠO CLIENT KẾT NỐI SUPABASE
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CẢNH BÁO BẢO MẬT: Chưa cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env!'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConnected: boolean = Boolean(supabaseUrl && supabaseAnonKey);

// 2. MÃ SQL SCHEMA TOÀN DIỆN CHO TOÀN BỘ RẠP PHIM
export const SUPABASE_SCHEMA_SQL = `-- PartyStream PostgreSQL Production Schema
create extension if not exists "pgcrypto";

-- Bảng 1: Danh sách Phim & Video (Hỗ trợ Soft Delete 30 ngày)
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null default current_date,
  duration text default '00:15:00',
  video_url text not null,
  thumbnail_url text,
  subtitle_url text,
  tags text[] default '{}',
  deleted_at timestamp with time zone default null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Bảng 2: Chủ đề / Thể loại phim (Strict Taxonomy)
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamp with time zone default now()
);

-- Bảng 3: Danh sách Phim Yêu Thích
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  video_id text unique not null,
  created_at timestamp with time zone default now()
);

-- Bảng 4: Lịch sử xem phim chi tiết (Không gộp phiên)
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  watched_seconds integer default 0,
  duration text default '00:00:00',
  watched_at timestamp with time zone default now()
);

-- Indexes tối ưu hiệu năng truy vấn
create index if not exists idx_videos_created on public.videos (created_at desc);
create index if not exists idx_videos_deleted on public.videos (deleted_at);
create index if not exists idx_videos_tags on public.videos using gin (tags);
create index if not exists idx_history_watched on public.watch_history (watched_at desc);

-- Thiết lập Row Level Security (RLS) mở quyền cho rạp phim cá nhân
alter table public.videos enable row level security;
alter table public.topics enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;

create policy "Allow all videos" on public.videos for all using (true) with check (true);
create policy "Allow all topics" on public.topics for all using (true) with check (true);
create policy "Allow all favorites" on public.favorites for all using (true) with check (true);
create policy "Allow all history" on public.watch_history for all using (true) with check (true);
`;

// =========================================================================
// 3. DATA ACCESS LAYER: VIDEOS (QUẢN LÝ PHIM TRỰC TIẾP TRÊN DATABASE)
// =========================================================================

/**
 * Tải toàn bộ danh sách phim từ Supabase PostgreSQL.
 * Trả về định dạng tương thích tuyệt đối với App.tsx.
 */
export async function fetchVideos(): Promise<{
  videos: Video[];
  source: 'supabase';
}> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi khi truy vấn videos từ Supabase:', error.message);
      return { videos: [], source: 'supabase' };
    }

    return {
      videos: (data as Video[]) || [],
      source: 'supabase',
    };
  } catch (err: any) {
    console.error('Lỗi kết nối Supabase:', err.message);
    return { videos: [], source: 'supabase' };
  }
}

/**
 * Thêm một bộ phim mới vào Supabase
 */
export async function createVideoRecord(input: NewVideoInput): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert([
      {
        title: input.title.trim(),
        description: input.description.trim() || null,
        event_date: input.event_date,
        duration: input.duration.trim() || '00:00:00',
        video_url: input.video_url.trim(),
        thumbnail_url: input.thumbnail_url?.trim() || null,
        subtitle_url: input.subtitle_url?.trim() || null,
        tags: input.tags,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Không thể lưu phim vào Supabase.');
  }

  return data as Video;
}

/**
 * Cập nhật thông tin bộ phim hiện có
 */
export async function updateVideoRecord(input: UpdateVideoInput): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      event_date: input.event_date,
      duration: input.duration.trim() || '00:00:00',
      video_url: input.video_url.trim(),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      subtitle_url: input.subtitle_url?.trim() || null,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Không thể cập nhật phim trên Supabase.');
  }

  return data as Video;
}

/**
 * Xóa tạm một bộ phim (Soft Delete - lưu timestamp deleted_at)
 */
export async function softDeleteVideoRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Lỗi xóa tạm video: ${error.message}`);
  }
}

/**
 * Khôi phục bộ phim đã xóa tạm (Đặt deleted_at về null)
 */
export async function restoreVideoRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) {
    throw new Error(`Lỗi khôi phục video: ${error.message}`);
  }
}

/**
 * Xóa vĩnh viễn một bộ phim khỏi database (Hard Delete)
 */
export async function hardDeleteVideoRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Lỗi xóa vĩnh viễn video: ${error.message}`);
  }
}

// =========================================================================
// 4. DATA ACCESS LAYER: TOPICS / CHỦ ĐỀ
// =========================================================================

export async function fetchTopicsDb(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('name')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map((t) => t.name);
  } catch {
    return [];
  }
}

export async function addTopicDb(name: string): Promise<void> {
  const clean = name.trim();
  if (!clean) return;

  const { error } = await supabase
    .from('topics')
    .insert([{ name: clean }]);

  if (error && !error.message.includes('duplicate')) {
    throw new Error(`Không thể thêm chủ đề: ${error.message}`);
  }
}

export async function removeTopicDb(name: string): Promise<void> {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('name', name.trim());

  if (error) {
    throw new Error(`Không thể xóa chủ đề: ${error.message}`);
  }
}

// =========================================================================
// 5. DATA ACCESS LAYER: FAVORITES / YÊU THÍCH
// =========================================================================

export async function fetchFavoritesDb(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('video_id');

    if (error || !data) return [];
    return data.map((f) => f.video_id);
  } catch {
    return [];
  }
}

export async function toggleFavoriteDb(videoId: string, isFav: boolean): Promise<void> {
  if (isFav) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('video_id', videoId);
    if (error) console.error('Lỗi gỡ yêu thích:', error.message);
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert([{ video_id: videoId }]);
    if (error && !error.message.includes('duplicate')) {
      console.error('Lỗi thêm yêu thích:', error.message);
    }
  }
}

// =========================================================================
// 6. DATA ACCESS LAYER: WATCH HISTORY / LỊCH SỬ XEM
// =========================================================================

export async function fetchWatchHistoryDb(): Promise<WatchHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .order('watched_at', { ascending: false });

    if (error || !data) return [];

    return data.map((h) => ({
      id: h.id,
      videoId: h.video_id,
      watchedSeconds: h.watched_seconds,
      duration: h.duration,
      lastWatchedAt: new Date(h.watched_at).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function recordWatchHistoryDb(
  videoId: string,
  seconds = 0,
  duration = '00:00:00'
): Promise<void> {
  try {
    await supabase.from('watch_history').insert([
      {
        video_id: videoId,
        watched_seconds: Math.floor(seconds),
        duration: duration || '00:00:00',
        watched_at: new Date().toISOString(),
      },
    ]);
  } catch (err: any) {
    console.error('Lỗi ghi nhận lịch sử xem:', err.message);
  }
}

export async function removeWatchHistoryItemDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Lỗi xóa mục lịch sử:', error.message);
  }
}

export async function clearAllWatchHistoryDb(): Promise<void> {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .neq('video_id', '___empty___');

  if (error) {
    console.error('Lỗi làm sạch lịch sử:', error.message);
  }
}
