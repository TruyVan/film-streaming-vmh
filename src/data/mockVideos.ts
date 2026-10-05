import { Video } from '../types/video';
import thumbGalaDinner from '../assets/images/thumb_gala_dinner_1790788483705.jpg';
import thumbBeachTeambuilding from '../assets/images/thumb_beach_teambuilding_1790788495687.jpg';
import thumbKaraokeNight from '../assets/images/thumb_karaoke_night_1790788507974.jpg';
import thumbHackathonDemo from '../assets/images/thumb_hackathon_demo_1790788520753.jpg';
import thumbCampingRetreat from '../assets/images/thumb_camping_retreat_1790788532752.jpg';

const sampleSrtGala =
  'data:text/plain;charset=utf-8,' +
  encodeURIComponent(`1
00:00:01,000 --> 00:00:04,500
[Ban tổ chức]: Chào mừng các thành viên đến với đêm Gala Dinner 2026!

2
00:00:05,000 --> 00:00:09,000
[MC]: Mở màn là ban nhạc nội bộ The Late Deployers với bản mashup Acoustic

3
00:00:09,500 --> 00:00:15,000
[Audience]: Vỗ tay nồng nhiệt và cùng hòa nhịp nào toàn thể anh em!

4
00:00:16,000 --> 00:00:22,000
[PartyStream]: Nền tảng chia sẻ và lưu trữ video sự kiện nội bộ chuẩn HD`);

const sampleSrtTeambuilding =
  'data:text/plain;charset=utf-8,' +
  encodeURIComponent(`1
00:00:01,000 --> 00:00:05,000
[Trọng tài]: Chuẩn bị xuất phát chặng đua bãi biển Bãi Sao Phú Quốc!

2
00:00:05,500 --> 00:00:09,000
[Đội Đỏ]: Cố lên anh em, bứt phá giành giải nhất BBQ nào!

3
00:00:10,000 --> 00:00:16,000
[Đội Xanh]: Đại chiến kéo co và vượt chướng ngại vật trên cát`);

export const mockVideos: Video[] = [
  {
    id: 'vid-gala-2026-yearend',
    title: 'Year-End Gala Dinner 2026: Đêm Nhạc Rock & Acoustic Bùng Nổ',
    description:
      'Bản thu Full HD (60fps) toàn bộ chương trình Gala Dinner tổng kết năm tại Grand Ballroom. Bao gồm phần mở màn của ban nhạc nội bộ The Late Deployers, tiết mục mashup Karaoke liên phòng ban Engineering vs Product, lễ vinh danh cá nhân xuất sắc và phần bốc thăm trúng thưởng cuối chương trình.\n\nMốc thời gian nổi bật:\n00:00 - Intro & Khai mạc Gala\n02:15 - Band Acoustic mở màn\n05:40 - Chung kết King of Karaoke nội bộ\n08:20 - Vinh danh Top Contributors & Khui sâm panh',
    event_date: '2026-09-18',
    duration: '00:09:56',
    video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail_url: thumbGalaDinner,
    subtitle_url: sampleSrtGala,
    tags: ['Gala Dinner', 'Karaoke', 'Live Band', 'Sự kiện'],
    created_at: '2026-09-19T08:30:00Z',
  },
  {
    id: 'vid-phuquoc-teambuilding-2026',
    title:
      'Summer Teambuilding Phú Quốc: Đại Chiến Bãi Sao & Chặng Đua Tiếp Sức',
    description:
      'Video recap kết hợp bản quay gốc không cắt từ flycam và camera hành trình tại Bãi Sao, Phú Quốc. 4 đội chơi (Đỏ, Xanh, Vàng, Tím) vượt qua 5 trạm thử thách liên hoàn trên biển trước khi bước vào tiệc BBQ hải sản lúc hoàng hôn.\n\nNguồn phát: Nginx Streaming Node (HTTP 206 Range Requests enabled). Bạn có thể tua nhanh bất kỳ đoạn nào hoặc chụp ảnh màn hình (Screenshot) khoảnh khắc đáng nhớ của đồng đội.',
    event_date: '2026-08-14',
    duration: '00:10:53',
    video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail_url: thumbBeachTeambuilding,
    subtitle_url: sampleSrtTeambuilding,
    tags: ['Teambuilding', 'Phú Quốc', 'Outdoor', 'Flycam'],
    created_at: '2026-08-16T10:15:00Z',
  },
  {
    id: 'vid-karaoke-friday-vol12',
    title: 'Friday Acoustic & Karaoke Night Vol.12: Tuyệt Đỉnh Song Ca',
    description:
      'Đêm giao lưu âm nhạc định kỳ tối thứ Sáu tại khu vực Lounge tầng 18. Tập hợp những màn song ca đầy cảm xúc, các bản ballad bất hủ thập niên 2000 và phần giao lưu guitar mộc không kịch bản.\n\nGợi ý: Nếu khung hình quay trong phòng tối hơi thiếu sáng, bạn có thể mở biểu tượng Bánh răng (Cài đặt) trên trình phát ArtPlayer và kéo thanh trượt Độ sáng (Brightness) lên 130% - 150% để nhìn rõ chi tiết hơn.',
    event_date: '2026-07-24',
    duration: '00:12:14',
    video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail_url: thumbKaraokeNight,
    subtitle_url: null,
    tags: ['Karaoke', 'Acoustic', 'Friday Night', 'Âm nhạc'],
    created_at: '2026-07-25T04:20:00Z',
  },
  {
    id: 'vid-hackathon-demoday-q3',
    title:
      'Internal AI & Media Hackathon 2026: 36 Giờ Sáng Tạo & Pitching Chung Kết',
    description:
      'Toàn cảnh 36 giờ thức trắng của 12 đội thi tại trụ sở chính và phần thuyết trình Demo trực tiếp trên sân khấu Auditorium. Bao gồm các màn hỏi đáp gay cấn từ ban giám khảo và khoảnh khắc trao giải Nhất.',
    event_date: '2026-06-12',
    duration: '00:09:54',
    video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail_url: thumbHackathonDemo,
    subtitle_url: null,
    tags: ['Tech & Sự kiện', 'Hackathon', 'Demo Day', 'Sự kiện'],
    created_at: '2026-06-13T14:00:00Z',
  },
  {
    id: 'vid-dalat-glamping-retreat',
    title: 'Đà Lạt Pine Forest Retreat: Đêm Lửa Trại & Radio Tâm Sự Nội Bộ',
    description:
      'Hành trình cắm trại 2 ngày 1 đêm giữa rừng thông Đà Lạt. Video ghi lại hoạt động dựng lều buổi chiều, nướng BBQ giữa tiết trời 15 độ C và đêm nhạc lửa trại kết hợp chuyên mục Radio đọc thư ẩn danh của các thành viên trong công ty.',
    event_date: '2026-05-09',
    duration: '00:00:47',
    video_url:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnail_url: thumbCampingRetreat,
    subtitle_url: null,
    tags: ['Teambuilding', 'Đà Lạt', 'Camping', 'Karaoke'],
    created_at: '2026-05-11T09:00:00Z',
  },
];
