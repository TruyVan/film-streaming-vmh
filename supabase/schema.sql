-- ==============================================================================
-- PARTYSTREAM — SUPABASE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- Kiến trúc: Supabase Database (PostgreSQL) + Row Level Security (RLS)
-- Sử dụng: Mở Supabase Dashboard -> SQL Editor -> Dán toàn bộ nội dung này và bấm RUN
-- ==============================================================================

-- 1. Bật extension tạo UUID ngẫu nhiên
create extension if not exists "pgcrypto";

-- 2. Tạo bảng lưu trữ danh sách video nội bộ
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null default current_date,
  duration text default '00:15:00',
  video_url text not null,       -- Direct HTTPS link streaming từ Oracle Cloud Nginx VPS (.mp4)
  thumbnail_url text,           -- Link ảnh bìa preview video
  subtitle_url text,            -- Link hoặc Data URI file phụ đề .srt / .vtt
  tags text[] not null default '{"Sự kiện"}',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 3. Tạo Trigger tự động cập nhật updated_at khi sửa bản ghi
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_videos_updated_at on public.videos;
create trigger set_videos_updated_at
  before update on public.videos
  for each row
  execute function public.handle_updated_at();

-- 4. Đánh chỉ mục (Indexes) để tối ưu tốc độ tìm kiếm và lọc danh mục
create index if not exists idx_videos_event_date on public.videos (event_date desc);
create index if not exists idx_videos_created_at on public.videos (created_at desc);
create index if not exists idx_videos_tags on public.videos using gin (tags);

-- 5. Cấu hình bảo mật Row Level Security (RLS)
alter table public.videos enable row level security;

-- Cho phép tất cả người dùng (Anonymous & Authenticated) đọc danh sách video
drop policy if exists "Cho phep doc video cong khai" on public.videos;
create policy "Cho phep doc video cong khai"
  on public.videos
  for select
  using (true);

-- Cho phép thêm mới video (được bảo vệ bằng mã PIN tại giao diện Dev Portal)
drop policy if exists "Cho phep dev them video moi" on public.videos;
create policy "Cho phep dev them video moi"
  on public.videos
  for insert
  with check (true);

-- Cho phép cập nhật video
drop policy if exists "Cho phep dev cap nhat video" on public.videos;
create policy "Cho phep dev cap nhat video"
  on public.videos
  for update
  using (true);

-- Cho phép xóa video
drop policy if exists "Cho phep dev xoa video" on public.videos;
create policy "Cho phep dev xoa video"
  on public.videos
  for delete
  using (true);

-- ==============================================================================
-- 6. DỮ LIỆU MẪU BAN ĐẦU (SEED DATA TƯƠNG THÍCH MOCK VIDEOS)
-- ==============================================================================
insert into public.videos (id, title, description, event_date, duration, video_url, thumbnail_url, subtitle_url, tags)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Gala Dinner 2026: Đêm Hội Tỏa Sáng — Kỷ Niệm 10 Năm Thành Lập',
    'Chương trình Dạ tiệc kỷ niệm 10 năm thành lập công ty diễn ra tại Trung tâm Hội nghị Quốc tế. Toàn bộ hình ảnh vinh danh cán bộ nhân viên xuất sắc, ca nhạc bùng nổ cùng ban nhạc khách mời đặc biệt.

00:03 - Khởi động chương trình
00:15 - Chiếu video hành trình 10 năm phát triển
00:30 - Ban Giám đốc phát biểu & Khai tiệc
00:45 - Vinh danh cá nhân & tập thể xuất sắc
01:00 - Tiết mục văn nghệ công đoàn & Nhảy hiện đại
01:20 - Bốc thăm trúng thưởng giải đặc biệt',
    '2026-01-15',
    '01:34:20',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1280&q=80',
    'data:text/vtt;charset=utf-8,WEBVTT%0A%0A00:00:01.000%20--%3E%2000:00:05.000%0A%5BCh%C3%A0o%20m%E1%BB%ABng%20%C4%91%E1%BA%BFn%20v%E1%BB%9Bi%20Gala%20Dinner%202026%5D%0A%0A00:00:06.000%20--%3E%2000:00:12.000%0A%C4%90%C3%AAm%20h%E1%BB%99i%20k%E1%BB%B7%20ni%E1%BB%87m%2010%20n%C4%83m%20th%C3%A0nh%20l%E1%BA%ADp%20v%C3%A0%20ph%C3%A1t%20tri%E1%BB%83n%0A%0A00:00:13.000%20--%3E%2000:00:20.000%0AC%C3%B9ng%20nh%C3%ACn%20l%E1%BA%A1i%20nh%E1%BB%AFng%20kho%E1%BA%A3nh%20kh%E1%BA%AFc%20tuy%E1%BB%87t%20v%E1%BB%9Di%20nh%E1%BA%A5t!',
    array['Sự kiện', 'Gala Dinner', 'Vinh danh']
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Teambuilding Vũng Tàu 2025: Bứt Phá Giới Hạn — Vượt Sóng Ra Khơi',
    'Toàn cảnh hoạt động dã ngoại teambuilding 3 ngày 2 đêm tại bãi biển Vũng Tàu. Các trò chơi liên hoàn trên cát, thử thách chèo thuyền kayak và đêm gala lửa trại ấm cúng.

00:05 - Tập trung xuất phát & Khởi động tại bãi biển
00:25 - Trò chơi liên hoàn vượt chướng ngại vật
00:50 - Thử thách chèo SUP đồng đội
01:10 - Đêm lửa trại giao lưu văn nghệ',
    '2025-11-20',
    '00:45:15',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1280&q=80',
    null,
    array['Teambuilding', 'Sự kiện']
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Party Karaoke Night: Giọng Hát Vàng DTT — Bùng Nổ Đam Mê',
    'Buổi liên hoan âm nhạc nội bộ sau giờ làm việc. Tuyển tập các giọng ca vàng của các phòng ban với những bản mashup bolero, pop-ballad và rock kinh điển.',
    '2025-10-05',
    '00:32:40',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1280&q=80',
    null,
    array['Karaoke', 'Giao lưu']
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Acoustic Live Band: Chiều Hoàng Hôn — Góc Chill Ban Công Công Ty',
    'Set nhạc acoustic mộc mạc do ban nhạc nội bộ thực hiện trong một buổi chiều hoàng hôn thứ Sáu đầy thư giãn.',
    '2025-09-12',
    '00:28:10',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1280&q=80',
    null,
    array['Acoustic', 'Giao lưu']
  )
on conflict (id) do nothing;
