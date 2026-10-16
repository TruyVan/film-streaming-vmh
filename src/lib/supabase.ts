import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NewVideoInput, SubtitleTrack, UpdateVideoInput, Video, WatchHistoryItem } from '../types/video';

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
export const SUPABASE_SCHEMA_SQL = `-- Film Streaming PostgreSQL Production Schema
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

// Key lưu cache danh sách phim trên LocalStorage (Stale-While-Revalidate)
const VIDEOS_CACHE_KEY = 'film_videos_cache_v2';

export function getCachedVideos(): Video[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VIDEOS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Video[]) : [];
  } catch {
    return [];
  }
}

export function setCachedVideos(videos: Video[]): void {
  if (typeof window === 'undefined' || !Array.isArray(videos)) return;
  try {
    // Chỉ lưu các trường cần thiết vào cache để dung lượng LocalStorage siêu nhẹ
    const lightweight = videos.map((v) => ({
      id: v.id,
      title: v.title,
      event_date: v.event_date,
      duration: v.duration,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url,
      tags: v.tags,
      sort_order: v.sort_order,
      deleted_at: v.deleted_at,
      created_at: v.created_at,
      updated_at: v.updated_at,
      subtitle_url: v.subtitle_url,
    }));
    window.localStorage.setItem(VIDEOS_CACHE_KEY, JSON.stringify(lightweight));
  } catch (err) {
    console.warn('Không thể lưu cache video:', err);
  }
}

/**
 * Tải toàn bộ danh sách phim từ Supabase PostgreSQL.
 * TỐI ƯU HÓA TỐC ĐỘ: Chỉ truy vấn các cột cần thiết cho danh sách phim,
 * loại bỏ mảng JSONB phụ đề nặng hàng trăm KB để query trả về dưới 100ms!
 */
export async function fetchVideos(): Promise<{
  videos: Video[];
  source: 'supabase';
}> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, description, event_date, duration, video_url, thumbnail_url, tags, sort_order, deleted_at, created_at, updated_at, subtitle_url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi khi truy vấn videos từ Supabase:', error.message);
      return { videos: getCachedVideos(), source: 'supabase' };
    }

    const loadedVideos = (data as Video[]) || [];
    setCachedVideos(loadedVideos);

    return {
      videos: loadedVideos,
      source: 'supabase',
    };
  } catch (err: any) {
    console.error('Lỗi kết nối Supabase:', err.message);
    return { videos: getCachedVideos(), source: 'supabase' };
  }
}

/**
 * Tải danh sách đa phụ đề riêng biệt cho ĐÚNG 1 bộ phim đang xem.
 * Giúp trang chủ tải cực nhanh và chỉ load phụ đề khi bấm PLAY phim!
 */
export async function fetchVideoSubtitles(videoId: string): Promise<SubtitleTrack[]> {
  if (!videoId) return [];
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('subtitles, subtitle_url')
      .eq('id', videoId)
      .single();

    if (error || !data) return [];

    if (Array.isArray(data.subtitles) && data.subtitles.length > 0) {
      return data.subtitles as SubtitleTrack[];
    }
    if (data.subtitle_url) {
      return [{ name: 'Tiếng Việt', url: data.subtitle_url, default: true }];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Thêm một bộ phim mới vào Supabase
 */
export async function createVideoRecord(input: NewVideoInput): Promise<Video> {
  const insertPayload: any = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_date: input.event_date,
    duration: input.duration.trim() || '00:00:00',
    video_url: input.video_url.trim(),
    thumbnail_url: input.thumbnail_url?.trim() || null,
    subtitle_url: input.subtitle_url?.trim() || null,
    subtitles: (input as any).subtitles || [], // <-- LƯU ĐA PHỤ ĐỀ JSONB
    tags: input.tags,
  };

  if (typeof input.sort_order === 'number') {
    insertPayload.sort_order = input.sort_order;
  }

  const { data, error } = await supabase
    .from('videos')
    .insert([insertPayload])
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Lỗi lưu phim');
  return data as Video;
}

/**
 * Cập nhật thông tin bộ phim hiện có
 */
export async function updateVideoRecord(input: UpdateVideoInput): Promise<Video> {
  const updatePayload: any = {
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_date: input.event_date,
    duration: input.duration.trim() || '00:00:00',
    video_url: input.video_url.trim(),
    thumbnail_url: input.thumbnail_url?.trim() || null,
    subtitle_url: input.subtitle_url?.trim() || null,
    subtitles: (input as any).subtitles || [], // <-- CẬP NHẬT ĐA PHỤ ĐỀ
    tags: input.tags,
    updated_at: new Date().toISOString(),
  };

  if (typeof input.sort_order === 'number') {
    updatePayload.sort_order = input.sort_order;
  }

  const { data, error } = await supabase
    .from('videos')
    .update(updatePayload)
    .eq('id', input.id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Lỗi cập nhật');
  return data as Video;
}

/**
 * Cập nhật thứ tự sắp xếp cho danh sách phim (lưu trực tiếp lên Supabase)
 */
export async function updateVideoSortOrders(
  items: { id: string; sort_order: number }[]
): Promise<{ success: boolean; needsSqlMigration?: boolean; message?: string }> {
  let hasMissingColumnError = false;
  let lastErrorMessage = '';

  for (const item of items) {
    const { error } = await supabase
      .from('videos')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id);

    if (error) {
      console.error(`Lỗi Supabase khi cập nhật sort_order cho phim ${item.id}:`, error.message);
      lastErrorMessage = error.message;
      if (
        error.message.includes('sort_order') ||
        error.message.includes('does not exist') ||
        (error as any).code === '42703'
      ) {
        hasMissingColumnError = true;
      }
    }
  }

  if (hasMissingColumnError) {
    return {
      success: false,
      needsSqlMigration: true,
      message:
        'Bảng "videos" trên Supabase chưa có cột "sort_order". Bạn chỉ cần mở SQL Editor trên Supabase và chạy lệnh: ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0; CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON public.videos (sort_order ASC);',
    };
  }

  if (lastErrorMessage) {
    throw new Error(`Lỗi cập nhật thứ tự trên Supabase: ${lastErrorMessage}`);
  }

  return { success: true };
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

export async function renameTopicDb(oldName: string, newName: string): Promise<void> {
  const cleanOld = oldName.trim();
  const cleanNew = newName.trim();
  if (!cleanOld || !cleanNew || cleanOld.toLowerCase() === cleanNew.toLowerCase()) return;

  // 1. Cập nhật trong bảng topics
  const { error: topicError } = await supabase
    .from('topics')
    .update({ name: cleanNew })
    .eq('name', cleanOld);

  if (topicError) {
    try {
      await supabase.from('topics').insert([{ name: cleanNew }]);
      await supabase.from('topics').delete().eq('name', cleanOld);
    } catch {}
  }

  // 2. Cập nhật tất cả các video đang có tags chứa oldName
  try {
    const { data: matchedVideos } = await supabase
      .from('videos')
      .select('id, tags')
      .contains('tags', [cleanOld]);

    if (matchedVideos && matchedVideos.length > 0) {
      for (const v of matchedVideos) {
        const nextTags = (v.tags || []).map((t: string) =>
          t.toLowerCase() === cleanOld.toLowerCase() ? cleanNew : t
        );
        await supabase
          .from('videos')
          .update({ tags: nextTags })
          .eq('id', v.id);
      }
    }
  } catch (err: any) {
    console.warn('Lỗi cập nhật tags video khi đổi tên phân loại:', err?.message);
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
      lastPosition: h.watched_seconds ?? 0,
      duration: typeof h.duration === 'number' ? h.duration : 0,
      lastWatchedAt: new Date(h.watched_at).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function createWatchSessionDb(
  videoId: string,
  seconds = 0,
  duration = '00:00:00'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .insert([
        {
          video_id: videoId,
          watched_seconds: Math.floor(seconds),
          duration: duration || '00:00:00',
          watched_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (!error && data) return data.id;
  } catch (err: any) {
    console.error('Lỗi tạo phiên xem:', err.message);
  }
  return null;
}

// 2. Cập nhật số giây đã xem cho chính phiên đó (Không tạo thêm lượt mới)
export async function updateWatchSessionProgressDb(
  sessionId: string,
  seconds: number
): Promise<void> {
  try {
    await supabase
      .from('watch_history')
      .update({
        watched_seconds: Math.floor(seconds),
      })
      .eq('id', sessionId);
  } catch (err: any) {
    console.error('Lỗi cập nhật tiến độ xem:', err.message);
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
