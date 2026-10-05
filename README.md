# PartyStream — Private VoD Platform

> **Nền tảng phát Video nội bộ & Lưu trữ Sự kiện Doanh nghiệp**  
> Kiến trúc kết hợp: **Vercel** (Frontend SPA CDN) + **Supabase** (Database PostgreSQL BaaS) + **Oracle Cloud** (Nginx Media Streaming VPS).

---

## 1. Tổng quan Kiến trúc Hệ thống (System Architecture)

PartyStream được thiết kế chuyên biệt để phục vụ nhu cầu lưu trữ và phát video sự kiện công ty (Gala Dinner, Teambuilding, Hội thao, Karaoke, Acoustic Live, Hội thảo nội bộ) với tốc độ cao, giao diện chuẩn phong cách YouTube hiện đại và **hoàn toàn tối ưu chi phí vận hành**.

### 🌟 Mô hình 3 Trụ cột (Trio Architecture):

```text
 ┌──────────────────────────────────────────────────────────────┐
 │                     NGƯỜI DÙNG / TRÌNH DUYỆT                 │
 └──────────────┬───────────────────────────────┬───────────────┘
                │                               │
        1. Tải Web App & UI             3. Direct MP4 Streaming
         (HTML / JS / CSS)                (Range Requests 206)
                │                               │
                ▼                               ▼
     ┌──────────────────────┐        ┌──────────────────────┐
     │        VERCEL        │        │  ORACLE CLOUD (OCI)  │
     │  Frontend Hosting    │        │  Media VPS (Compute) │
     │  - React 19 + Vite   │        │  - Nginx MP4 Module  │
     │  - Tailwind CSS v4   │        │  - Range 206 Seeking │
     │  - vercel.json SPA   │        │  - CORS & SSL Cert   │
     │  - Global Edge CDN   │        │  - Subtitle .srt/.vtt│
     └──────────┬───────────┘        └──────────────────────┘
                │
        2. Query Metadata
         (REST / Realtime)
                │
                ▼
     ┌──────────────────────┐
     │       SUPABASE       │
     │  Database (Postgres) │
     │  - Bảng public.videos│
     │  - RLS Security      │
     │  - GIN Index tags    │
     └──────────────────────┘
```

| Thành phần | Công nghệ / Nền tảng | Vai trò & Trách nhiệm trong hệ thống |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** + React 19 (Vite) | Phục vụ mã nguồn giao diện người dùng, routing SPA, cache tài nguyên tĩnh trên mạng lưới Global CDN, áp dụng tiêu chuẩn Anti-SEO. |
| **Database** | **Supabase** (PostgreSQL) | Lưu trữ thông tin metadata của video (tiêu đề, mô tả, ngày sự kiện, thời lượng, tags, link streaming OCI, link phụ đề). |
| **Media Server** | **Oracle Cloud Infrastructure (OCI)** | Máy chủ VPS Linux chạy Nginx tối ưu cho video streaming, xử lý HTTP Range Requests (206 Partial Content) để tua video tức thì mà không nghẽn băng thông. |

---

## 2. Cấu trúc Thư mục Dự án (Project Structure)

```text
├── vercel.json                      # Cấu hình Vercel: SPA rewrites và HTTP Anti-SEO headers
├── .env.example                     # Mẫu khai báo biến môi trường cho Vercel và Local
├── package.json                     # Danh sách dependencies & script (dev, build, lint)
├── tsconfig.json                    # Cấu hình trình biên dịch TypeScript
├── vite.config.ts                   # Cấu hình Vite & Tailwind CSS v4 plugin
├── index.html                       # Khung HTML gốc: Font Roboto & thẻ meta noindex
│
├── supabase/
│   └── schema.sql                   # Mã SQL hoàn chỉnh: Tạo bảng, index, RLS & seed data
│
├── nginx/
│   └── oracle-cloud-vod.conf        # File cấu hình Nginx chuẩn chạy trên Oracle Cloud VPS
│
└── src/
    ├── main.tsx                     # Điểm khởi chạy React root
    ├── App.tsx                      # Điều phối state toàn cục, routing trang chủ/xem video/dev
    ├── index.css                    # Toàn bộ CSS Tailwind v4, biến màu Pastel, style player
    │
    ├── types/
    │   └── video.ts                 # Type definitions: Video, VideoProgress, WatchHistoryItem,...
    │
    ├── lib/
    │   ├── supabase.ts              # Client kết nối Supabase, CRUD video, fallback LocalStorage
    │   ├── progress.ts              # Quản lý tiến độ xem (currentTime, volume, lịch sử không gộp)
    │   └── topics.ts                # Quản lý danh mục chủ đề (tự do thêm/xóa mà không mất video)
    │
    ├── data/
    │   └── mockVideos.ts            # Dữ liệu video mẫu sẵn có kèm phụ đề test
    │
    └── components/
        ├── player/
        │   └── CustomArtPlayer.tsx  # Trình phát video ArtPlayer: Hotkeys, PiP, Subtitle, tua đồng bộ
        │
        └── ui/
            ├── Header.tsx           # Thanh điều hướng trên cùng (Logo, Search box mở rộng)
            ├── HomeBentoGrid.tsx    # Lưới video trang chủ, feed Yêu thích, Lịch sử dạng hàng ngang
            ├── PlaylistSidebar.tsx  # Cột danh sách phát video liên quan bên phải trang xem video
            ├── YouTubeSidebar.tsx   # Menu Sidebar trượt mượt mà (Drawer), Switch Theme & nút Dev
            ├── VideoDetails.tsx     # Chi tiết video, đánh dấu khoảnh khắc timestamp, mô tả
            ├── ThemeSwitch.tsx      # Nút chuyển Sáng/Tối Mặt trăng/Mặt trời xoay 360 độ
            ├── MobileBottomNav.tsx  # Thanh điều hướng đáy màn hình cho điện thoại
            ├── AdminDevPortal.tsx   # Trang Quản trị Kỹ thuật (Dev Portal) toàn màn hình có mã PIN
            └── TopicManagerModal.tsx# Modal cấu hình danh mục chủ đề
```

---

## 3. Hướng dẫn Cấu hình & Triển khai Chi tiết

### Bước 1: Cấu hình Máy chủ Streaming trên Oracle Cloud (OCI VPS)

Oracle Cloud cung cấp gói **Always Free** cực kỳ hào phóng (Compute VM.Standard.A1.Flex với 4 OCPU, 24GB RAM hoặc AMD Micro) cùng 10TB băng thông truyền tải ra ngoài miễn phí mỗi tháng. Đây là nơi lý tưởng để làm máy chủ VOD.

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

#### 1.3. Cài đặt Nginx & cấu hình thư mục lưu trữ video
```bash
# Cài đặt Nginx và Certbot Let's Encrypt
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Tạo cấu trúc thư mục chứa video
sudo mkdir -p /var/www/partystream/{videos,subtitles,thumbnails}
sudo chown -R www-data:www-data /var/www/partystream
sudo chmod -R 755 /var/www/partystream
```

#### 1.4. Áp dụng cấu hình Nginx từ dự án
1. Sao chép nội dung file `nginx/oracle-cloud-vod.conf` vào `/etc/nginx/sites-available/partystream-vod.conf`.
2. Thay thế `vod.yourcompany.vn` bằng tên miền (hoặc IP) của bạn.
3. Kích hoạt site và xin chứng chỉ SSL:
```bash
sudo ln -s /etc/nginx/sites-available/partystream-vod.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Xin chứng chỉ SSL miễn phí tự động gia hạn
sudo certbot --nginx -d vod.yourcompany.vn
```

#### 1.5. Cách tải video lên VPS Oracle Cloud
Bạn có thể dùng lệnh `scp` hoặc phần mềm WinSCP/FileZilla:
```bash
# Tải video từ máy cá nhân lên VPS:
scp gala_dinner_2026.mp4 ubuntu@<IP_VPS>:/var/www/partystream/videos/
```
Sau khi tải lên, video của bạn sẽ có link phát trực tiếp dạng:  
`https://vod.yourcompany.vn/videos/gala_dinner_2026.mp4`

---

### Bước 2: Cấu hình Cơ sở dữ liệu trên Supabase

1. Đăng ký/Đăng nhập tài khoản tại [supabase.com](https://supabase.com) và bấm **New Project**.
2. Đặt tên dự án (ví dụ: `partystream-db`), chọn Database Password và chọn Region gần nhất (ví dụ: `Singapore - ap-southeast-1`).
3. Sau khi dự án khởi tạo xong:
   * Vào mục **SQL Editor** ở thanh menu bên trái.
   * Mở file `supabase/schema.sql` trong mã nguồn dự án này, copy toàn bộ nội dung và dán vào SQL Editor.
   * Bấm nút **RUN**.
4. Lấy thông tin kết nối API:
   * Vào **Project Settings** (biểu tượng bánh răng) -> **API**.
   * Sao chép 2 giá trị:
     * **Project URL** (ví dụ: `https://xyzcompany.supabase.co`)
     * **Project API Keys** -> `anon` / `public` (chuỗi token JWT)

---

### Bước 3: Triển khai Frontend lên Vercel

1. Đẩy mã nguồn dự án lên GitHub / GitLab / Bitbucket của bạn.
2. Truy cập [vercel.com](https://vercel.com) và bấm **Add New...** -> **Project**.
3. Chọn kho lưu trữ mã nguồn của dự án. Vercel sẽ tự động phát hiện framework là **Vite**.
4. Mở rộng phần **Environment Variables** và nhập:
   * `VITE_SUPABASE_URL`: URL dự án Supabase lấy ở Bước 2.
   * `VITE_SUPABASE_ANON_KEY`: Khóa `anon` lấy ở Bước 2.
   * `VITE_ORACLE_VOD_BASE_URL`: (Tùy chọn) Domain OCI VPS của bạn (ví dụ: `https://vod.yourcompany.vn`).
   * `VITE_ADMIN_PASSCODE`: (Tùy chọn) Đổi mã PIN quản trị viên (Mặc định: `admin2026`).
5. Bấm nút **Deploy**.
6. Dự án đã có sẵn file `vercel.json`, Vercel sẽ tự động:
   * Thiết lập SPA rewrites (`/*` -> `/index.html`) để khi F5 tải lại trang không bị lỗi 404.
   * Thiết lập tiêu đề bảo mật Anti-SEO (`X-Robots-Tag: noindex, nofollow`).

---

## 4. Các Tính Năng Nổi Bật Đã Được Tinh Chỉnh

### 1. Trình phát Video Tùy biến Cao cấp (ArtPlayer.js)
* **Tua nhanh đồng bộ tức thì (Zero-Lag Scrubbing):**
  * Nút tua lùi 10s / tua tới 10s và phím tắt (←, →, J, L) sử dụng cơ chế cộng dồn thời gian và cập nhật trực tiếp DOM của chấm đỏ (`.art-progress-indicator`) và vạch tiến độ đỏ (`.art-progress-played`).
  * Người dùng bấm tua nhiều lần liên tiếp với tốc độ nhanh thì thanh tiến trình sẽ nhảy ngay lập tức mà không bị giật, lag hay trôi ngược.
* **Thời gian Video (Timestamp):**
  * Đặt tự nhiên ở thanh điều khiển dưới, ngay bên phải nút Volume (Loa), định dạng phông chữ đơn cách `00:03 / 15:00` sắc nét.
* **Bật/Tắt Phụ đề (.SRT / .VTT):**
  * Đã loại bỏ hoàn toàn tính năng chọn file rườm rà ở giao diện người xem. Người xem chỉ cần bấm 1 click vào nút Phụ đề ở thanh điều khiển dưới để bật/tắt phụ đề đã được Kỹ thuật viên cấu hình sẵn.
* **Nút Cài đặt (Độ sáng & Tốc độ phát):**
  * Nằm ở góc trên bên phải khung chiếu video. Khi bấm mở, menu hiển thị cố định góc trên bên phải, không bị nhảy sang mép trái hoặc khuất nội dung.
  * Tự động ẩn hoàn toàn bên dưới Header khi cuộn trang nhờ cơ chế `isolation` và phân tầng `z-index` hợp lý.
* **Bộ phím tắt điều khiển thuận tiện:**
  * `Space` hoặc `K`: Phát / Tạm dừng video (tự động xóa focus để không bị kích hoạt nhầm nút bấm vừa click).
  * `←` / `→`: Tua 5 giây.
  * `J` / `L`: Tua 10 giây.
  * `↑` / `↓`: Tăng / Giảm 5% âm lượng video độc lập.
  * `M`: Tắt / Bật tiếng.
  * `F`: Bật / Thoát toàn màn hình (Hỗ trợ Web Fullscreen phủ kín 100vw x 100vh).
  * `P`: Bật / Tắt hình trong nền (Picture-in-Picture).
  * `C`: Bật / Tắt phụ đề.

### 2. Quản trị Kỹ thuật & Dev Portal Toàn Màn Hình
* Truy cập an toàn qua nút **Kỹ thuật & Cấu hình (Dev)** ở thanh Sidebar bên trái với mã PIN bảo vệ (`admin2026`).
* Giao diện dạng trang chuyên dụng toàn màn hình (`Full-width`), tận dụng tối đa chiều rộng hiển thị, đồng bộ cả giao diện **Sáng (Light)** và **Tối (Dark)**.
* **Thêm / Cập nhật Video:**
  * Hỗ trợ dán link video MP4 trực tiếp từ Oracle Cloud VPS.
  * Hỗ trợ nạp file `.srt`/`.vtt` từ máy tính (tự động chuyển thành Data URI) hoặc dán đường dẫn phụ đề trên VPS.
  * Gắn nhãn các chủ đề phân loại.
* **Quản trị Chủ đề:** Thêm/xóa danh mục chủ đề nội bộ mà không làm mất video.
* **Supabase & Nginx Quick-Copy:** Tích hợp nút copy toàn bộ SQL và Nginx config với 1 click.

### 3. Trải nghiệm YouTube-like & Anti-SEO Tuyệt Đối
* **Giao diện chuẩn phong cách YouTube:**
  * Thanh lọc chủ đề (*Tất cả, Sự kiện, Teambuilding, Gala Dinner,*) chỉ xuất hiện ở Trang chủ Tất cả Video; tự động ẩn khi người dùng chuyển sang mục **Yêu thích** hoặc **Lịch sử**.
  * Lịch sử xem hiển thị dạng danh sách hàng ngang tinh gọn (Compact History Row).
  * Mỗi lần xem lại video được lưu thành một bản ghi riêng biệt kèm thời gian xem chi tiết (không bị gộp lại).
* **Công tắc Theme Sáng / Tối độc quyền:**
  * Component `ThemeSwitch` hiển thị biểu tượng Mặt trăng (`Moon`) và Mặt trời (`Sun`) với hiệu ứng xoay 360 độ và scale chuyển tiếp mượt mà.
  * Chỉ xuất hiện duy nhất ở thanh Menu Sidebar bên trái.
* **Bảo mật Anti-SEO:**
  * Toàn bộ thẻ meta `noindex, nofollow, noarchive, nosnippet` được khai báo trong `index.html`.
  * Header HTTP `X-Robots-Tag` được thiết lập đồng thời ở Vite Dev/Preview, `vercel.json` và máy chủ Nginx trên Oracle Cloud VPS.

---

## 5. Hướng dẫn Phát triển Local (Development Workflow)

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy máy chủ phát triển (Port 3000)
npm run dev

# 3. Kiểm tra cú pháp & kiểm lỗi TypeScript
npm run lint

# 4. Biên dịch thử nghiệm bản phát hành sản phẩm
npm run build

# 5. Xem trước bản build phát hành
npm run preview
```

---

## 6. Tổng kết Thông tin Cần Nhớ

* **Mã PIN Quản trị mặc định:** `admin2026` (Đổi tại `src/components/ui/AdminDevPortal.tsx` hoặc qua biến `VITE_ADMIN_PASSCODE`).
* **Cổng phát triển Local:** `http://localhost:3000`.
* **Cơ chế Fallback:** Nếu chưa điền biến Supabase, ứng dụng vẫn hoạt động 100% bình thường nhờ dữ liệu `mockVideos.ts` và cơ chế lưu trữ trình duyệt `localStorage`.
