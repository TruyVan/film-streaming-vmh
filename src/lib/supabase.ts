import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NewVideoInput, UpdateVideoInput, Video } from '../types/video';
import { mockVideos } from '../data/mockVideos';

const CUSTOM_VIDEOS_STORAGE_KEY = 'partystream_custom_videos_v1';

// Support both Vite env vars and Next.js env vars
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

const isValidSupabaseConfig = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConnected = isValidSupabaseConfig;

export const SUPABASE_SCHEMA_SQL = `-- Supabase PostgreSQL Schema cho Private VoD Platform
create extension if not exists "pgcrypto";

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null default current_date,
  duration text default '00:15:00',
  video_url text not null,       -- Direct HTTPS link từ Nginx VPS (mp4)
  thumbnail_url text,           -- Link ảnh bìa preview
  subtitle_url text,            -- File phụ đề .srt / .vtt (URL hoặc Data URI)
  tags text[] default '{"Sự kiện"}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index tối ưu tìm kiếm theo ngày sự kiện và tags
create index if not exists idx_videos_event_date on public.videos (event_date desc);
create index if not exists idx_videos_tags on public.videos using gin (tags);

-- Kích hoạt Row Level Security (RLS)
alter table public.videos enable row level security;

-- Cho phép đọc công khai danh sách video
create policy "Public Read Videos" on public.videos for select using (true);

-- Cho phép Dev Portal thêm/sửa/xóa video
create policy "Dev Insert Videos" on public.videos for insert with check (true);
create policy "Dev Update Videos" on public.videos for update using (true);
create policy "Dev Delete Videos" on public.videos for delete using (true);`;

export function getLocalCustomVideos(): Video[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_VIDEOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomVideo(input: NewVideoInput): Video {
  const newVideo: Video = {
    id: `vid-custom-${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_date: input.event_date,
    duration: input.duration.trim() || '00:00:00',
    video_url: input.video_url.trim(),
    thumbnail_url: input.thumbnail_url?.trim() || mockVideos[0].thumbnail_url,
    subtitle_url: input.subtitle_url?.trim() || null,
    tags: input.tags.length > 0 ? input.tags : ['Sự kiện'],
    created_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const existing = getLocalCustomVideos();
    window.localStorage.setItem(
      CUSTOM_VIDEOS_STORAGE_KEY,
      JSON.stringify([newVideo, ...existing])
    );
  }
  return newVideo;
}

export function updateLocalCustomVideo(input: UpdateVideoInput): Video {
  const existing = getLocalCustomVideos();
  const index = existing.findIndex((v) => v.id === input.id);
  const updated: Video = {
    id: input.id,
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_date: input.event_date,
    duration: input.duration.trim() || '00:00:00',
    video_url: input.video_url.trim(),
    thumbnail_url: input.thumbnail_url?.trim() || null,
    subtitle_url: input.subtitle_url?.trim() || null,
    tags: input.tags.length > 0 ? input.tags : ['Sự kiện'],
    created_at:
      index >= 0 ? existing[index].created_at : new Date().toISOString(),
  };

  if (index >= 0) {
    existing[index] = updated;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CUSTOM_VIDEOS_STORAGE_KEY,
        JSON.stringify(existing)
      );
    }
  } else {
    // If not found in local custom videos (e.g. was a mock video being edited), save it into local custom
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CUSTOM_VIDEOS_STORAGE_KEY,
        JSON.stringify([updated, ...existing])
      );
    }
  }
  return updated;
}

// Xóa tạm (Soft Delete)
export async function softDeleteVideoRecord(id: string): Promise<void> {
  if (supabase) {
    await supabase
      .from('videos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
  }
}

// Khôi phục video đã xóa tạm
export async function restoreVideoRecord(id: string): Promise<void> {
  if (supabase) {
    await supabase
      .from('videos')
      .update({ deleted_at: null })
      .eq('id', id);
  }
}

// Xóa vĩnh viễn (Hard Delete)
export async function hardDeleteVideoRecord(id: string): Promise<void> {
  if (supabase) {
    await supabase.from('videos').delete().eq('id', id);
  }
}

// Lấy danh sách Tags từ Supabase
export async function fetchTagsFromSupabase(): Promise<{ name: string; slug: string }[]> {
  if (supabase) {
    const { data } = await supabase.from('tags').select('name, slug').order('created_at', { ascending: true });
    if (data && data.length > 0) return data;
  }
  return [
    { name: 'Harry Potter', slug: 'harry-potter' },
    { name: 'Sự kiện', slug: 'su-kien' },
    { name: 'Trải nghiệm', slug: 'trai-nghiem' },
  ];
}

export function deleteLocalCustomVideo(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getLocalCustomVideos();
  const next = existing.filter((v) => v.id !== id);
  window.localStorage.setItem(CUSTOM_VIDEOS_STORAGE_KEY, JSON.stringify(next));
}

/**
 * Truy vấn danh sách video từ bảng `videos` trên Supabase.
 * Tự động fallback về `mockVideos.ts` khi chưa kết nối Supabase hoặc bảng trống.
 */
export async function fetchVideos(): Promise<{
  videos: Video[];
  source: 'supabase' | 'mock';
}> {
  const localCustom = getLocalCustomVideos();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('event_date', { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge local custom on top
        const dbVideos = data as Video[];
        const customIds = new Set(localCustom.map((v) => v.id));
        const merged = [...localCustom, ...dbVideos.filter((v) => !customIds.has(v.id))];
        return {
          videos: merged,
          source: 'supabase',
        };
      }
    } catch (err) {
      console.warn('Supabase query fallback to mockVideos:', err);
    }
  }

  // Combine local custom and mockVideos, replacing mockVideo if overridden by localCustom
  const customIds = new Set(localCustom.map((v) => v.id));
  const combined = [
    ...localCustom,
    ...mockVideos.filter((v) => !customIds.has(v.id)),
  ].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return {
    videos: combined,
    source: 'mock',
  };
}

export async function createVideoRecord(input: NewVideoInput): Promise<Video> {
  if (supabase) {
    try {
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

      if (!error && data) {
        return data as Video;
      }
    } catch (err) {
      console.warn('Supabase insert failed, falling back to local:', err);
    }
  }

  return saveLocalCustomVideo(input);
}

export async function updateVideoRecord(input: UpdateVideoInput): Promise<Video> {
  if (supabase) {
    try {
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
        })
        .eq('id', input.id)
        .select()
        .single();

      if (!error && data) {
        return data as Video;
      }
    } catch (err) {
      console.warn('Supabase update failed, updating local:', err);
    }
  }

  return updateLocalCustomVideo(input);
}
