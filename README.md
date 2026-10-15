# Film Streaming — Private VoD Platform

> **Nền tảng phát Video VoD nội bộ & Rạp chiếu phim trực tuyến chất lượng cao**  
> Kiến trúc kết hợp: **Vercel** (Frontend SPA CDN) + **Supabase** (PostgreSQL BaaS & RLS) + **Oracle Cloud** (Nginx MP4 Streaming VPS).  
> Giao diện chuẩn phong cách YouTube hiện đại, không quảng cáo, tối ưu chi phí vận hành với gói Always Free.

---

## 1. Tổng quan Kiến trúc Hệ thống (System Architecture)

Dự án được thiết kế chuyên biệt để phục vụ nhu cầu lưu trữ và trình chiếu các bộ phim, video sự kiện, teambuilding, workshop và tư liệu nội bộ với chất lượng cao nhất, trải nghiệm tua nhanh không độ trễ (**Zero-Lag Scrubbing**) và bảo mật riêng tư (**Anti-SEO**).

### 🌟 Mô hình 3 Trụ cột (Trio Architecture):

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        NGƯỜI DÙNG / TRÌNH DUYỆT                        │
 └──────────────┬──────────────────────────┬──────────────────────────────┘
                │                          │
        1. Tải Web App & UI        3. Direct MP4 Streaming
            (HTML / JS / CSS)           (HTTP 206 Partial Content)
                │                          │
                ▼                          ▼
     ┌──────────────────────┐   ┌────────────────────────────────┐
     │        VERCEL        │   │       ORACLE CLOUD (OCI)       │
     │  Frontend Hosting    │   │      Media Streaming VPS       │
     │  - React 19 + Vite 8 │   │  - Nginx ngx_http_mp4_module   │
     │  - Tailwind CSS v4   │   │  - Range 206 Seeking tức thì   │
     │  - vercel.json SPA   │   │  - Hỗ trợ PUT upload trực tiếp │
     │  - Anti-SEO Headers  │   │  - Phụ đề .vtt/.srt & Ảnh bìa  │
     │  - Global Edge CDN   │   │  - Chứng chỉ SSL Let's Encrypt │
     └──────────┬───────────┘   └────────────────────────────────┘
                │
        2. Query / Sync Data
          (REST / Realtime)
                │
                ▼
     ┌────────────────────────────────────┐
     │              SUPABASE              │
     │        Database (PostgreSQL)       │
     │  - Bảng public.videos (Soft Delete)│
     │  - Bảng public.topics (Taxonomy)   │
     │  - Bảng public.favorites           │
     │  - Bảng public.watch_history       │
     │  - Row Level Security (RLS)        │
     │  - GIN Index tags & B-Tree Indexes │
     └────────────────────────────────────┘
```

### 📊 Bảng phân tích chi tiết các thành phần:

| Thành phần | Công nghệ / Nền tảng | Trách nhiệm và Cơ chế hoạt động |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** + React 19 + Vite 8 + Tailwind CSS v4 | Phục vụ mã nguồn giao diện SPA, xử lý routing động theo URL Slug (`/?v=...`, `/tags/:slug`, `/favorites`, `/history`, `/admin`), áp dụng các tiêu đề bảo mật Anti-SEO (`noindex, nofollow`). |
| **Database** | **Supabase** (PostgreSQL 15+) | Lưu trữ metadata video, danh mục chủ đề phân loại, danh sách video yêu thích và lịch sử xem từng phiên. Hỗ trợ cơ chế xóa tạm (Soft Delete 30 ngày) và đa phụ đề JSONB. |
| **Media Server** | **Oracle Cloud Infrastructure (OCI)** | Máy chủ VPS Compute (Ubuntu/Oracle Linux) chạy Nginx được biên dịch kèm module `ngx_http_mp4_module`, hỗ trợ HTTP Range Requests (mã phản hồi 206) giúp tua phim đến bất kỳ giây nào mà không cần tải toàn bộ file. |

---

## 2. Cấu trúc Thư mục Dự án (Project Directory Structure)

```text
film-streaming-vmh/
├── .env.example                     # Mẫu khai báo các biến môi trường cho Local và Vercel
├── .gitignore                       # Cấu hình bỏ qua file rác, build artifacts và file nhạy cảm
├── bun.lock                         # Lockfile Bun (dành cho môi trường dùng Bun)
├── index.html                       # Khung HTML gốc với thẻ meta Anti-SEO và liên kết Google Fonts
├── metadata.json                    # Metadata ứng dụng (tên, mô tả, quyền hạn)
├── next.config.mjs                  # Cấu hình tương thích Next.js App Router & Anti-SEO headers
├── package.json                     # Quản lý dependencies (React 19, ArtPlayer, Tailwind v4, Supabase)
├── package-lock.json                # Lockfile NPM chuẩn hoá phiên bản các gói cài đặt
├── tsconfig.json                    # Cấu hình trình biên dịch TypeScript
├── vercel.json                      # Cấu hình rewrite SPA và tiêu đề HTTP bảo mật trên Vercel
├── vite.config.ts                   # Cấu hình Vite 8, Tailwind v4, đường dẫn alias và Anti-SEO headers
│
├── app/                             # Tương thích Next.js App Router (Dual-mode)
│   ├── layout.tsx                   # Root layout định nghĩa phông nền, metadata và ngôn ngữ tiếng Việt
│   └── page.tsx                     # Route chính chuyển hướng hiển thị App component
│
├── nginx/
│   └── oracle-cloud-vod.conf        # File cấu hình Nginx chuẩn chạy trên Oracle Cloud VPS
│
├── public/
│   └── robots.txt                   # Chặn toàn bộ web crawler và robot tìm kiếm (Disallow: /)
│
├── supabase/
│   └── schema.sql                   # Toàn bộ script SQL: Khởi tạo bảng, RLS, Indexes và Seed data
│
└── src/
    ├── main.tsx                     # Điểm khởi chạy React 19 root
    ├── App.tsx                      # Điều phối state toàn cục, routing URL Slug và đồng bộ Supabase
    ├── index.css                    # Toàn bộ styles Tailwind v4, bảng màu Pastel, hiệu ứng ArtPlayer
    │
    ├── assets/
    │   └── images/                  # Ảnh bìa thumbnail mặc định dự phòng chất lượng cao
    │
    ├── components/
    │   ├── player/
    │   │   └── CustomArtPlayer.tsx  # Trình phát ArtPlayer 5.4.0: Khóa màn hình, cử chỉ vuốt, Zero-lag
    │   │
    │   └── ui/
    │       ├── AdminDevPortal.tsx   # Trang Quản trị Kỹ thuật (Dev Portal) toàn màn hình có mã PIN
    │       ├── Header.tsx           # Thanh điều hướng phía trên (Logo thương hiệu, Tìm kiếm mở rộng)
    │       ├── HomeBentoGrid.tsx    # Lưới video Bento Grid, feed Yêu thích, Lịch sử xem dạng hàng
    │       ├── MobileBottomNav.tsx  # Thanh điều hướng đáy màn hình tối ưu cho Smartphone
    │       ├── PlaylistSidebar.tsx  # Danh sách phát video liên quan (Up-Next) chuẩn YouTube
    │       ├── ThemeSwitch.tsx      # Nút chuyển Sáng/Tối Mặt trăng / Mặt trời xoay 360 độ
    │       ├── TopicManagerModal.tsx# Modal thêm/xóa danh mục chủ đề không làm mất video
    │       ├── VideoDetails.tsx     # Chi tiết phim, mô tả thu phóng mượt, bookmark khoảnh khắc
    │       └── YouTubeSidebar.tsx   # Menu Sidebar dạng Drawer trượt và Sidebar thu gọn Desktop
    │
    ├── data/
    │   └── mockVideos.ts            # Dữ liệu video mẫu kèm phụ đề test khi chạy không cần Supabase
    │
    ├── lib/
    │   ├── progress.ts              # Quản lý tiến độ xem phim, lưu trữ LocalStorage, bookmark mốc giờ
    │   ├── supabase.ts              # Data Access Layer: CRUD Videos, Topics, Favorites, Watch History
    │   └── topics.ts                # Quản lý danh mục chủ đề dự phòng trên LocalStorage
    │
    └── types/
        ├── next-shim.d.ts           # Type shims hỗ trợ môi trường lai giữa Next.js và Vite
        └── video.ts                 # Khai báo TypeScript types: Video, SubtitleTrack, VideoProgress,...
```

---

## 3. Các Tính Năng Nổi Bật Đã Được Tinh Chỉnh

### 1. Trình phát Video Đẳng Cấp (ArtPlayer.js 5.4.0 Custom)
* **Tua nhanh đồng bộ tức thì (Zero-Lag Scrubbing):**
  * Nút tua lùi 10s / tua tới 10s và phím tắt (`←`, `→`, `J`, `L`) sử dụng cơ chế cộng dồn thời gian và cập nhật trực tiếp DOM của vạch đỏ (`.art-progress-played`), chấm tròn (`.art-progress-indicator`) và đồng hồ thời gian.
  * Tích hợp cơ chế **Debounce seek (150ms)** giúp người dùng kéo thanh tiến trình hoặc bấm liên tục mà không làm đơ giật luồng video.
* **Touch & Gesture Engine tối ưu cho Mobile:**
  * **Chạm 1 lần vào video:** Hiện/ẩn thanh điều khiển và bộ nút trung tâm trong đúng 2.2 giây rồi tự động mờ đi.
  * **Chạm đúp (Double-tap) thông minh:**
    * Chạm đúp bên trái màn hình: Tua lùi 10 giây kèm hiệu ứng sóng nước (Ripple) và nhãn `-10s`.
    * Chạm đúp bên phải màn hình: Tua tới 10 giây kèm hiệu ứng sóng nước và nhãn `+10s`.
    * Chạm đúp ở giữa màn hình: Bật / Thoát toàn màn hình.
  * **Cử chỉ vuốt dọc (Vertical Swipe Gesture):**
    * Vuốt nửa bên trái: Tăng / giảm **Độ sáng** (50% - 200%) với bảng thông số HUD hiển thị ở tâm màn hình.
    * Vuốt nửa bên phải: Tăng / giảm **Âm lượng** (0% - 100%) kèm biểu tượng HUD động.
    * *Đặc biệt:* Chỉ kích hoạt thao tác vuốt khi thanh điều khiển đang ẩn, loại bỏ hoàn toàn tình trạng vô tình chạm nhầm nút bấm.
* **Cơ chế Khóa Màn Hình (Screen Lock Action):**
  * Nút ổ khóa nổi ở góc trên bên phải. Khi bật khóa (`art-is-locked`), toàn bộ thanh điều khiển, nút bấm và thao tác chạm sẽ bị chặn hoàn toàn nhưng **video vẫn tiếp tục phát mượt mà**. Chạm vào màn hình sẽ làm nhấp nháy nút mở khóa để báo hiệu.
* **Bộ nút điều khiển trung tâm (YouTube Center Controls):**
  * Gồm 3 nút nổi bật: **Tập trước đó (Prev)**, **Phát/Tạm dừng to tròn (Play/Pause)** và **Tập kế tiếp (Next)**. Tự động mờ đi sau 2 giây khi phim đang chiếu.
* **Quản lý Đa Phụ Đề (Multi-Track Subtitles):**
  * Hỗ trợ đồng thời cả file `.vtt`, `.srt` và chuỗi mã hóa `data:text/...;charset=utf-8,...`.
  * Hỗ trợ đầy đủ các thẻ định dạng văn bản trong phụ đề: `<i>in nghiêng</i>`, `<b>in đậm</b>`, `<u>gạch chân</u>`.
  * Nút phụ đề 1-click ở thanh điều khiển dưới để bật/tắt nhanh; menu Cài đặt cho phép chuyển đổi ngôn ngữ phụ đề linh hoạt.
* **Bộ điều khiển toàn diện:**
  * **Độ sáng (Brightness):** Tùy chỉnh từ 50% đến 200% ngay trong menu Cài đặt (rất hữu ích với các cảnh quay ban đêm).
  * **Tốc độ phát (Playback Rate):** Hỗ trợ đầy đủ từ 0.5x, 0.75x, 1x, 1.25x, 1.5x đến 2x.
  * **Toàn màn hình kép (Dual Fullscreen):** Tự động phát hiện và chuyển đổi linh hoạt giữa Native Fullscreen và Web Fullscreen (`100vw x 100vh`) giúp khắc phục triệt để hạn chế khi nhúng trong iframe.
  * **Hình trong nền (Picture-in-Picture):** Tách video ra góc màn hình để vừa xem vừa làm việc khác.
  * **Khôi phục phiên xem:** Tự động lưu tiến độ vào database / LocalStorage; hiển thị banner nổi *"Tiếp tục xem từ mm:ss"* khi quay lại.

---

### 2. Trải nghiệm YouTube-Style & Phát Phim Liền Mạch
* **Danh sách phát theo Phân Loại độc quyền (Seamless Series Playlist):**
  * Khi bấm xem một bộ phim, cột Danh sách phát bên phải sẽ **tự động tải toàn bộ các tập phim thuộc cùng Phân Loại** với phim đó (Ví dụ: xem *Harry Potter 1* thì danh sách bên phải tự gom đủ trọn bộ *Harry Potter 1, 2, 3... 8* theo đúng thứ tự).
  * Bộ nút điều khiển trung tâm và phím tắt của player cho phép chuyển tập trước / tập kế tiếp mượt mà; khi kết thúc một tập phim, hệ thống sẽ **tự động chuyển sang tập tiếp theo**.
  * Tích hợp nút rõ ràng *"← Về trang chủ"* để người xem thuận tiện quay lại trang chủ chọn bộ phim khác.
* **Hệ thống Routing chuẩn mực:**
  * Đồng bộ URL mượt mà bằng History API: `/?v=[video_id]` (xem video), `/tags/[slug]` (lọc theo danh mục), `/favorites` (danh sách yêu thích), `/history` (lịch sử xem), `/admin` (quản trị kỹ thuật).
* **Bento Grid & Skeleton Loading:**
  * Trang chủ hiển thị dạng lưới Bento Grid hiện đại; tích hợp khung xương tải trang (Skeleton) khi đang kết nối API Supabase.
* **Lịch sử xem chi tiết (Detailed Watch History):**
  * Mỗi lần xem lại video được lưu thành một bản ghi độc lập kèm mốc thời gian chi tiết (không bị ghi đè, gộp phiên). Cho phép xóa từng mục hoặc xóa toàn bộ lịch sử.
* **Hộp thông tin mô tả thu phóng mượt mà (Expandable Description):**
  * Tích hợp lớp phủ mờ gradient nhẹ nhàng (`from-transparent to-surface`). Bấm vào bất kỳ đâu trên hộp để mở rộng hoặc thu gọn.
  * Tự động nhận diện các mốc thời gian trong mô tả (Ví dụ: `01:25 - Khởi động`) thành nút bấm chuyển nhanh đến đoạn video tương ứng.
* **Đánh dấu khoảnh khắc yêu thích (Timestamp Moment Bookmarks):**
  * Cho phép người xem lưu lại các khoảnh khắc đáng nhớ ngay tại giây đang phát kèm ghi chú cá nhân, hỗ trợ tua lại nhanh chỉ với 1 click.
* **Công tắc Theme Sáng / Tối độc quyền (ThemeSwitch):**
  * Biểu tượng Mặt trời (`Sun`) và Mặt trăng (`Moon`) với hiệu ứng xoay 360 độ và phóng to thu nhỏ mượt mà.
* **Điều hướng thông minh:**
  * Desktop: Sidebar thu gọn 72px hoặc mở rộng 256px với danh mục phân loại rõ ràng.
  * Mobile: Drawer trượt tràn viền và thanh điều hướng đáy màn hình (Mobile Bottom Nav).

---

### 3. Trang Quản trị Kỹ thuật (Admin Dev Portal)
* **Truy cập bảo mật bằng mã PIN:**
  * Bảo vệ kỹ thuật với mã PIN (`admin2026` hoặc biến môi trường `VITE_ADMIN_PASSCODE`), ẩn hoàn toàn placeholder mã PIN để đảm bảo tính riêng tư.
* **Tải phim trực tiếp lên Oracle Cloud VPS (Direct HTTP PUT):**
  * Hỗ trợ chọn video trực tiếp từ máy tính; trình duyệt sẽ gửi lệnh HTTP PUT thẳng lên máy chủ Nginx trên Oracle VPS.
  * Hiển thị thanh tiến trình phần trăm (%), tốc độ truyền tải thực tế (MB/s) và dung lượng đã gửi.
  * **Tự động quay về danh sách phim:** Sau khi upload hoàn tất và đăng phim thành công, hệ thống tự động làm sạch form và quay trở lại tab Danh Sách Phim.
* **Thuật toán trích xuất ảnh bìa thông minh (Chống màn hình đen):**
  * Thay vì lấy 1 giây đầu tiên (vốn hầu hết là màn hình đen mờ intro của phim), hệ thống tự động tìm kiếm và lấy mẫu độ sáng (Luma Brightness Sampling) ở các mốc thời gian từ 20s, 35s, 50s, 75s... để trích xuất khung hình sáng và sắc nét nhất.
  * Tích hợp nút `🔄 Đổi khung hình (+25s)` cho phép admin thử ngay một khoảnh khắc khác, cùng nút `🖼️ Tải ảnh từ máy` nếu muốn dùng ảnh bìa thiết kế riêng.
* **Cấu hình 1 Phân Loại duy nhất cho mỗi phim:**
  * Thay vì gắn nhiều tags rời rạc, mỗi bộ phim được chỉ định **chính xác 1 Phân Loại** (như *Harry Potter*, *Stranger Things Mùa 1*, *Chúa Tể Những Chiếc Nhẫn*...).
  * Cho phép chọn phân loại có sẵn hoặc gõ tạo nhanh phân loại mới ngay tại form thêm/sửa phim.
* **Quản lý Phân Loại & Sắp xếp thứ tự phim bằng Kéo Thả (Drag and Drop):**
  * Chuyển toàn bộ quyền cấu hình phân loại về tab quản trị chuyên dụng của Admin (không xuất hiện ở sidebar người dùng thông thường).
  * Cho phép chọn bất kỳ phân loại nào và **kéo thả trực tiếp (HTML5 Drag & Drop)** hoặc dùng nút mũi tên `↑` / `↓` để sắp xếp các tập phim từ trên xuống dưới (Tập 1 → Tập cuối).
  * Tích hợp nút *"Sắp xếp tự động: Cũ nhất → Mới nhất"* theo ngày phát hành.
  * Lưu thứ tự phim (`sort_order`) trực tiếp vào cơ sở dữ liệu Supabase.
* **Xóa vĩnh viễn (Hard Delete) đồng bộ VPS & Supabase:**
  * Cơ chế Hard Delete xóa sạch bản ghi trong database Supabase, đồng thời gửi lệnh HTTP `DELETE` qua WebDAV lên máy chủ Nginx Oracle VPS để giải phóng dung lượng đĩa cứng thực tế.
* **Thùng rác & Xóa tạm (Soft Delete 30 ngày):**
  * Video bị xóa tạm được lưu trong tab Thùng rác 30 ngày với đầy đủ nút Khôi phục (Restore).
* **Quản trị đa phụ đề (Subtitle Tracks Manager):**
  * Cho phép nạp nhiều phụ đề (Tiếng Việt, English,...), tự động đọc file `.srt`/`.vtt` từ máy tính thành Data URI an toàn.

---

### 4. Tiêu Chuẩn Bảo Mật & Anti-SEO Tuyệt Đối
Nền tảng được thiết lập chặn mọi công cụ thu thập dữ liệu (Google, Bing, Yandex, Baidu) ở tất cả các tầng:
1. **Tầng Mã nguồn HTML (`index.html`):** Khai báo `<meta name="robots" content="noindex, nofollow, nocache, noarchive, nosnippet" />`.
2. **Tầng File Crawl (`public/robots.txt`):** Thiết lập `User-agent: *` và `Disallow: /`.
3. **Tầng Edge Hosting (`vercel.json`):** Gắn HTTP Response Header `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` trên mọi route.
4. **Tầng Máy chủ Media (`nginx/oracle-cloud-vod.conf`):** Nginx trên Oracle VPS cũng trả về `X-Robots-Tag` chặn index toàn bộ file video, phụ đề và ảnh bìa.

---

## 4. Hướng dẫn Cài đặt & Triển khai Chi tiết

### Bước 1: Cấu hình Máy chủ Streaming trên Oracle Cloud (OCI VPS)

Oracle Cloud cung cấp gói **Always Free** cực kỳ hào phóng (Compute VM.Standard.A1.Flex với 4 OCPU, 24GB RAM hoặc AMD Micro) cùng **10TB băng thông truyền tải miễn phí mỗi tháng**. Đây là giải pháp hoàn hảo để làm máy chủ VOD.

#### 1.1. Mở cổng trên Oracle Cloud Dashboard (VCN Ingress Rules)
1. Truy cập **OCI Console** -> **Networking** -> **Virtual Cloud Networks**.
2. Chọn VCN của bạn -> **Security Lists** -> **Default Security List for...**.
3. Bấm **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80,443`

#### 1.2. Mở tường lửa trên máy chủ VPS (Ubuntu / Oracle Linux)
Kết nối SSH vào VPS OCI và chạy các lệnh sau:
```bash
# Đối với Ubuntu:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Hoặc nếu dùng ufw:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

#### 1.3. Cài đặt Nginx & cấu hình thư mục lưu trữ media
```bash
# Cài đặt Nginx và Certbot Let's Encrypt
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Tạo cấu trúc thư mục chứa video, phụ đề và ảnh bìa
sudo mkdir -p /var/www/filmstreaming/{videos,subtitles,thumbnails}
sudo chown -R www-data:www-data /var/www/filmstreaming
sudo chmod -R 775 /var/www/filmstreaming
```

#### 1.4. Áp dụng cấu hình Nginx từ dự án
1. Sao chép nội dung file `nginx/oracle-cloud-vod.conf` vào `/etc/nginx/sites-available/film-vod.conf`.
2. Thay thế `vod.yourcompany.vn` bằng tên miền (hoặc IP / tên miền sslip.io) của bạn.
3. Kích hoạt site và xin chứng chỉ SSL:
```bash
sudo ln -s /etc/nginx/sites-available/film-vod.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Xin chứng chỉ SSL miễn phí tự động gia hạn (nếu đã trỏ tên miền)
sudo certbot --nginx -d vod.yourcompany.vn
```

#### 1.5. Cách tải video lên VPS Oracle Cloud
Bạn có thể tải trực tiếp qua giao diện **Admin Dev Portal** trên web, hoặc dùng `scp`/SFTP:
```bash
# Tải video từ máy cá nhân lên VPS qua SCP:
scp film_part1.mp4 ubuntu@<IP_VPS>:/var/www/filmstreaming/videos/
```
Sau khi tải lên, video có thể phát ngay lập tức qua URL dạng:  
`https://vod.yourcompany.vn/videos/film_part1.mp4`

---

### Bước 2: Cấu hình Cơ sở dữ liệu trên Supabase

1. Đăng ký/Đăng nhập tài khoản tại [supabase.com](https://supabase.com) và bấm **New Project**.
2. Đặt tên dự án (ví dụ: `film-streaming-db`), chọn Database Password và chọn Region gần nhất (ví dụ: `Singapore - ap-southeast-1`).
3. Sau khi dự án khởi tạo xong:
   * Vào mục **SQL Editor** ở thanh menu bên trái.
   * Mở file `supabase/schema.sql` trong mã nguồn dự án này, copy toàn bộ nội dung và dán vào SQL Editor.
   * Bấm nút **RUN**.
4. Lấy thông tin kết nối API:
   * Vào **Project Settings** (biểu tượng bánh răng) -> **Data API**.
   * Sao chép 2 giá trị:
     * **Project URL** (ví dụ: `https://xyzcompany.supabase.co`)
     * **Project API Keys** -> `anon` / `public` (chuỗi token JWT)

---

### Bước 3: Triển khai Frontend lên Vercel

1. Đẩy mã nguồn dự án lên GitHub / GitLab của bạn.
2. Truy cập [vercel.com](https://vercel.com) và bấm **Add New...** -> **Project**.
3. Chọn kho lưu trữ mã nguồn của dự án. Vercel sẽ tự động phát hiện framework là **Vite**.
4. Mở rộng phần **Environment Variables** và cấu hình các biến:
   * `VITE_SUPABASE_URL`: Project URL lấy ở Bước 2.
   * `VITE_SUPABASE_ANON_KEY`: Khóa `anon` lấy ở Bước 2.
   * `VITE_ORACLE_VOD_BASE_URL`: (Tùy chọn) Domain OCI VPS của bạn (ví dụ: `https://vod.yourcompany.vn` hoặc `https://158.101.153.49.sslip.io`).
   * `VITE_ADMIN_PASSCODE`: (Tùy chọn) Đổi mã PIN quản trị viên (Mặc định: `admin2026`).
5. Bấm nút **Deploy**.
6. Dự án đã có sẵn file `vercel.json`, Vercel sẽ tự động:
   * Thiết lập SPA rewrites (`/(.*)` -> `/index.html`) để khi F5 tải lại trang không bị lỗi 404.
   * Thiết lập tiêu đề bảo mật Anti-SEO (`X-Robots-Tag: noindex, nofollow`).

---

## 5. Hướng dẫn Phát triển Local (Development Workflow)

### Yêu cầu môi trường:
* **Node.js:** Phiên bản 18.x, 20.x hoặc 24.x LTS.
* **NPM:** Phiên bản 9.x+ hoặc Bun.

```bash
# 1. Cài đặt các gói phụ thuộc (Khuyến nghị dùng --legacy-peer-deps để đồng bộ Vite 8 & Tailwind v4)
npm install --legacy-peer-deps

# 2. Khởi chạy máy chủ phát triển cục bộ (Mặc định cổng 3000)
npm run dev

# 3. Kiểm tra cú pháp và kiểu dữ liệu TypeScript
npm run lint

# 4. Biên dịch bản sản xuất hoàn chỉnh
npm run build

# 5. Chạy thử nghiệm bản build trước khi phát hành
npm run preview
```

---

## 6. Bảng Phím Tắt Điều Khiển Video (Keyboard Shortcuts)

| Phím tắt | Thao tác thực hiện |
| :---: | :--- |
| `Space` hoặc `K` | Phát / Tạm dừng video (Tự động xóa focus tránh kích hoạt nhầm nút khác) |
| `←` / `→` | Tua lùi / Tua tới 5 giây |
| `J` / `L` | Tua lùi / Tua tới 10 giây |
| `↑` / `↓` | Tăng / Giảm 5% âm lượng độc lập |
| `M` | Tắt / Bật tiếng (Mute / Unmute) |
| `F` | Bật / Thoát toàn màn hình (Hỗ trợ cả Native và Web Fullscreen) |
| `P` | Bật / Thoát chế độ Hình trong nền (Picture-in-Picture) |
| `C` | Bật / Tắt phụ đề (.srt / .vtt) |
| `Esc` | Thoát chế độ Toàn màn hình Web Fullscreen |

---

## 7. Bảng Biến Môi Trường (Environment Variables)

| Tên biến | Bắt buộc | Giá trị mẫu | Mô tả chức năng |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | Có | `https://xyz.supabase.co` | Endpoint kết nối REST API của dự án Supabase PostgreSQL. |
| `VITE_SUPABASE_ANON_KEY` | Có | `eyJhbGciOi...` | Khóa Public/Anon JWT dùng để truy vấn bảng dữ liệu có RLS. |
| `VITE_ORACLE_VOD_BASE_URL` | Không | `https://158.101.153.49.sslip.io` | Đường dẫn máy chủ Oracle VPS để upload và phát trực tiếp video. |
| `VITE_ADMIN_PASSCODE` | Không | `admin2026` | Mã PIN mở khóa giao diện Dev Portal (Mặc định: `admin2026`). |

---

## 8. Cơ chế Dự phòng Thông minh (Fallback & Offline Capability)

* **Khi chưa cấu hình Supabase:** Ứng dụng tự động kích hoạt chế độ Fallback, tải danh sách video mẫu từ `src/data/mockVideos.ts`. Toàn bộ dữ liệu xem phim, mốc bookmark và chủ đề sẽ được lưu tạm an toàn trong `localStorage` của trình duyệt, đảm bảo ứng dụng **không bao giờ bị màn hình trắng hay gián đoạn**.
* **Đồng bộ tự động:** Ngay khi các biến môi trường Supabase được bổ sung, ứng dụng sẽ chuyển đổi tức thì sang lưu trữ và đồng bộ hóa đám mây qua PostgreSQL.
