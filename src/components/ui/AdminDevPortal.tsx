import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Database,
  ShieldAlert,
  Server,
  Lock,
  KeyRound,
  AlertTriangle,
  Edit3,
  FileText,
  Upload,
  Tag,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { NewVideoInput, ThemeMode, UpdateVideoInput, Video } from '../../types/video';
import {
  createVideoRecord,
  isSupabaseConnected,
  SUPABASE_SCHEMA_SQL,
  updateVideoRecord,
} from '../../lib/supabase';

interface AdminDevPortalProps {
  themeMode: ThemeMode;
  videos: Video[];
  customTopics: string[];
  onVideoAdded: (video: Video) => void;
  onVideoUpdated: (video: Video) => void;
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
  onResetTopics: () => void;
  onGoHome: () => void;
}

const ADMIN_PASSCODE = 'admin2026';

const NGINX_CONFIG_SNIPPET = `# Cấu hình Nginx VPS phục vụ MP4 & Phụ đề SRT/VTT Streaming
server {
    listen 443 ssl http2;
    server_name vod-internal.yourcompany.vn;

    # Chặn Google Bot trực tiếp từ tầng Nginx
    add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;

    location /videos/ {
        alias /var/www/internal_videos/;
        mp4;
        mp4_buffer_size       1m;
        mp4_max_buffer_size   5m;

        # Hỗ trợ HTTP Range Requests (206 Partial Content) để tua mượt
        add_header Accept-Ranges bytes always;

        # Cho phép ArtPlayer chụp Screenshot & tải phụ đề SRT (CORS)
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Origin, Content-Type" always;
        expires 30d;
    }

    location /subtitles/ {
        alias /var/www/internal_subtitles/;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Content-Type "text/plain; charset=utf-8";
        expires 7d;
    }
}`;

const NEXT_ANTI_SEO_SNIPPET = `// 1. app/layout.tsx (Next.js App Router Metadata API)
export const metadata: Metadata = {
  title: 'PartyStream — Private VoD Platform',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

// 2. next.config.mjs (HTTP Response Header)
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex, nofollow, noarchive, nosnippet',
        },
      ],
    },
  ];
}`;

export const AdminDevPortal: React.FC<AdminDevPortalProps> = ({
  themeMode,
  videos,
  customTopics,
  onVideoAdded,
  onVideoUpdated,
  onAddTopic,
  onRemoveTopic,
  onResetTopics,
  onGoHome,
}) => {
  const isLight = themeMode === 'light';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('partystream_dev_auth') === 'true';
    }
    return false;
  });
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<
    'add' | 'update' | 'topics' | 'supabase' | 'antiseo'
  >('add');

  // Form state for ADD
  const [addTitle, setAddTitle] = useState('');
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addThumbnailUrl, setAddThumbnailUrl] = useState('');
  const [addSubtitleUrl, setAddSubtitleUrl] = useState('');
  const [addSubtitleFileName, setAddSubtitleFileName] = useState('');
  const [addEventDate, setAddEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [addDuration, setAddDuration] = useState('00:15:00');
  const [addSelectedTopics, setAddSelectedTopics] = useState<string[]>([
    'Sự kiện',
  ]);
  const [addCustomTagsText, setAddCustomTagsText] = useState('');
  const [addDescription, setAddDescription] = useState('');

  // Form state for UPDATE
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    videos[0]?.id || ''
  );
  const [editTitle, setEditTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editSubtitleUrl, setEditSubtitleUrl] = useState('');
  const [editSubtitleFileName, setEditSubtitleFileName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editSelectedTopics, setEditSelectedTopics] = useState<string[]>([]);
  const [editCustomTagsText, setEditCustomTagsText] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // New topic input in topics tab
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync update form when selected video changes
  useEffect(() => {
    const target = videos.find((v) => v.id === selectedVideoId) || videos[0];
    if (target) {
      setSelectedVideoId(target.id);
      setEditTitle(target.title);
      setEditVideoUrl(target.video_url);
      setEditThumbnailUrl(target.thumbnail_url || '');
      setEditSubtitleUrl(target.subtitle_url || '');
      setEditSubtitleFileName(
        target.subtitle_url ? 'Đã có file/link phụ đề' : ''
      );
      setEditEventDate(target.event_date);
      setEditDuration(target.duration || '00:00:00');
      setEditDescription(target.description || '');

      const matchedTopics = (target.tags || []).filter((t) =>
        customTopics.some((ct) => ct.toLowerCase() === t.toLowerCase())
      );
      const otherTags = (target.tags || []).filter(
        (t) => !customTopics.some((ct) => ct.toLowerCase() === t.toLowerCase())
      );

      setEditSelectedTopics(matchedTopics);
      setEditCustomTagsText(otherTags.join(', '));
    }
  }, [selectedVideoId, videos, customTopics]);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('partystream_dev_auth', 'true');
      }
      setAuthError('');
      toast.success('Xác thực quyền Quản trị viên thành công!');
    } else {
      setAuthError('Mã PIN không đúng. Vui lòng thử lại!');
      toast.error('Mã PIN không chính xác!');
    }
  };

  const handleSubtitleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isSrtOrVtt =
      fileName.endsWith('.srt') ||
      fileName.endsWith('.vtt') ||
      fileName.endsWith('.txt');

    if (!isSrtOrVtt) {
      toast.error('Chỉ hỗ trợ file phụ đề định dạng .srt hoặc .vtt');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const mime = fileName.endsWith('.vtt') ? 'text/vtt' : 'text/plain';
        const dataUri = `data:${mime};charset=utf-8,${encodeURIComponent(
          content
        )}`;
        if (mode === 'add') {
          setAddSubtitleUrl(dataUri);
          setAddSubtitleFileName(fileName);
        } else {
          setEditSubtitleUrl(dataUri);
          setEditSubtitleFileName(fileName);
        }
        toast.success(`Đã nạp file phụ đề "${fileName}" thành công!`);
      }
    };
    reader.onerror = () => {
      toast.error('Không thể đọc nội dung file phụ đề.');
    };
    reader.readAsText(file);
  };

  const toggleTopicSelection = (
    topic: string,
    mode: 'add' | 'edit'
  ) => {
    if (mode === 'add') {
      setAddSelectedTopics((prev) =>
        prev.includes(topic)
          ? prev.filter((t) => t !== topic)
          : [...prev, topic]
      );
    } else {
      setEditSelectedTopics((prev) =>
        prev.includes(topic)
          ? prev.filter((t) => t !== topic)
          : [...prev, topic]
      );
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addVideoUrl.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tiêu đề và Link phát video (.mp4)');
      return;
    }

    setIsSubmitting(true);
    const extraTags = addCustomTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const allTags = Array.from(
      new Set([...addSelectedTopics, ...extraTags])
    );

    const payload: NewVideoInput = {
      title: addTitle.trim(),
      description: addDescription.trim() || '',
      event_date: addEventDate,
      duration: addDuration.trim() || '00:15:00',
      video_url: addVideoUrl.trim(),
      thumbnail_url: addThumbnailUrl.trim() || undefined,
      tags: allTags,
      subtitle_url: addSubtitleUrl.trim() || undefined,
    };

    try {
      const created = await createVideoRecord(payload);
      onVideoAdded(created);
      toast.success(`Đã thêm video "${created.title}" thành công!`);

      // Reset form
      setAddTitle('');
      setAddVideoUrl('');
      setAddThumbnailUrl('');
      setAddSubtitleUrl('');
      setAddSubtitleFileName('');
      setAddDescription('');
      setAddCustomTagsText('');
      setAddSelectedTopics(['Sự kiện']);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thêm video mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId) return;

    if (!editTitle.trim() || !editVideoUrl.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tiêu đề và Link phát video (.mp4)');
      return;
    }

    setIsSubmitting(true);
    const extraTags = editCustomTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const allTags = Array.from(
      new Set([...editSelectedTopics, ...extraTags])
    );

    const payload: UpdateVideoInput = {
      id: selectedVideoId,
      title: editTitle.trim(),
      description: editDescription.trim() || '',
      event_date: editEventDate,
      duration: editDuration.trim() || '00:15:00',
      video_url: editVideoUrl.trim(),
      thumbnail_url: editThumbnailUrl.trim() || undefined,
      tags: allTags,
      subtitle_url: editSubtitleUrl.trim() || undefined,
    };

    try {
      const updated = await updateVideoRecord(payload);
      onVideoUpdated(updated);
      toast.success(`Đã cập nhật video "${updated.title}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTopicInput.trim();
    if (!clean) return;

    if (customTopics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      toast.info(`Chủ đề "${clean}" đã tồn tại.`);
      return;
    }

    onAddTopic(clean);
    setNewTopicInput('');
    toast.success(`Đã thêm chủ đề "${clean}" vào hệ thống.`);
  };

  const handleRemoveTopicConfirm = (topic: string) => {
    onRemoveTopic(topic);
    toast.success(`Đã xóa chủ đề "${topic}". Toàn bộ video vẫn được giữ nguyên.`);
  };

  const handleResetTopicsConfirm = () => {
    onResetTopics();
    toast.success('Đã khôi phục danh mục chủ đề về mặc định.');
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('Đã sao chép vào bộ nhớ tạm!');
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Không thể sao chép nội dung.');
    }
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-3.5rem)] flex flex-col transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* Top Header Navigation */}
      <div
        className={`w-full px-4 sm:px-8 py-4 border-b flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-xs'
            : 'bg-[#141418] border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Quay lại trang chủ"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trang chủ</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">
                Khu vực Kỹ thuật & Quản trị (Dev Portal)
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Thêm/Sửa video, cấu hình phụ đề .SRT, phân loại chủ đề & máy chủ Nginx
              </p>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 hidden sm:inline">
              Đã xác thực Dev
            </span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="w-full flex-1 px-4 sm:px-8 py-6">
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-2xl border shadow-xl transition-colors">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">Xác thực Quyền Quản trị viên</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Nhập mã PIN kỹ thuật để truy cập trang cấu hình và quản trị video.
              </p>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mã PIN:</span>
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Mã PIN mặc định: admin2026"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                  }`}
                  autoFocus
                />
                {authError && <p className="text-xs text-rose-500 pt-1">{authError}</p>}
                <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Mã mặc định nội bộ:{' '}
                  <code className="font-mono font-bold bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">
                    {ADMIN_PASSCODE}
                  </code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onGoHome}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    isLight ? 'bg-slate-200 hover:bg-slate-300' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Full Page Management Dashboard */
          <div className="w-full space-y-6">
            {/* Segmented Navigation Tab Bar */}
            <div
              className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto select-none ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'add'
                    ? isLight
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-pink-500/15 text-white border border-rose-500/50 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Video Mới</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('update')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'update'
                    ? isLight
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-pink-500/15 text-white border border-rose-500/50 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Cập nhật Video ({videos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('topics')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'topics'
                    ? isLight
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-pink-500/15 text-white border border-rose-500/50 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Phân loại Chủ đề ({customTopics.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'supabase'
                    ? isLight
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-pink-500/15 text-white border border-rose-500/50 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Supabase & Nginx VPS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('antiseo')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'antiseo'
                    ? isLight
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gradient-to-r from-rose-500/30 via-rose-500/20 to-pink-500/15 text-white border border-rose-500/50 shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Bảo mật Anti-SEO</span>
              </button>
            </div>

            {/* TAB 1: THÊM VIDEO MỚI */}
            {activeTab === 'add' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                  <h2 className="text-base sm:text-lg font-bold">Thêm Video Sự Kiện Mới</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Nhập link HTTPS direct streaming từ máy chủ VPS Linux (Nginx) và cấu hình phụ đề .SRT/.VTT.
                  </p>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Tiêu đề Video <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="Ví dụ: Gala Dinner 2026 - Đêm Hội Tỏa Sáng"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Link phát Video (.mp4) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={addVideoUrl}
                        onChange={(e) => setAddVideoUrl(e.target.value)}
                        placeholder="https://vps.yourcompany.vn/videos/gala_dinner_2026.mp4"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Link Ảnh Thumbnail (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={addThumbnailUrl}
                        onChange={(e) => setAddThumbnailUrl(e.target.value)}
                        placeholder="https://vps.yourcompany.vn/thumbs/gala.jpg"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Ngày sự kiện</label>
                        <input
                          type="date"
                          value={addEventDate}
                          onChange={(e) => setAddEventDate(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Thời lượng</label>
                        <input
                          type="text"
                          value={addDuration}
                          onChange={(e) => setAddDuration(e.target.value)}
                          placeholder="01:30:00"
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtitles Section */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span>Cấu hình Phụ đề Video (.SRT / .VTT do Kỹ thuật viên quản lý)</span>
                      </label>
                      {addSubtitleFileName && (
                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{addSubtitleFileName}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 opacity-80">
                          Cách 1: Nạp trực tiếp file .srt / .vtt từ máy
                        </label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Chọn file .srt hoặc .vtt</span>
                          <input
                            type="file"
                            accept=".srt,.vtt,.txt"
                            onChange={(e) => handleSubtitleFileUpload(e, 'add')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold mb-1 opacity-80">
                          Cách 2: Hoặc dán Link phụ đề trên Nginx VPS
                        </label>
                        <input
                          type="text"
                          value={addSubtitleUrl}
                          onChange={(e) => {
                            setAddSubtitleUrl(e.target.value);
                            setAddSubtitleFileName(e.target.value ? 'Link trực tiếp' : '');
                          }}
                          placeholder="https://vps.yourcompany.vn/subtitles/gala.vtt"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topics Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">Gắn nhãn phân loại chủ đề</label>
                    <div className="flex flex-wrap gap-2">
                      {customTopics.map((topic) => {
                        const isSelected = addSelectedTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopicSelection(topic, 'add')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : isLight
                                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                                : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">
                      Mô tả & Dấu mốc thời gian (Timestamp Chapters)
                    </label>
                    <textarea
                      rows={4}
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder={`Nhập mô tả video. Gõ mốc thời gian để tự động tạo bookmark, ví dụ:&#10;00:00 - Khởi động teambuilding&#10;05:30 - Trò chơi kéo co bãi biển&#10;12:45 - Trao giải thưởng`}
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-mono leading-relaxed focus:outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                          : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu video...' : 'Lưu & Đăng Video Mới'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: CẬP NHẬT VIDEO */}
            {activeTab === 'update' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Cập nhật & Chỉnh sửa Video</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Chọn video trong danh sách để cập nhật đường dẫn VPS, thay đổi phụ đề hoặc sửa mô tả.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold whitespace-nowrap">Chọn Video:</span>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => setSelectedVideoId(e.target.value)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none max-w-xs truncate ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-[#1a1a20] border-white/15 text-white'
                      }`}
                    >
                      {videos.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Tiêu đề Video <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Link phát Video (.mp4) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Link Ảnh Thumbnail</label>
                      <input
                        type="text"
                        value={editThumbnailUrl}
                        onChange={(e) => setEditThumbnailUrl(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Ngày sự kiện</label>
                        <input
                          type="date"
                          value={editEventDate}
                          onChange={(e) => setEditEventDate(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Thời lượng</label>
                        <input
                          type="text"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtitles Section */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500" />
                        <span>Cập nhật Phụ đề Video (.SRT / .VTT)</span>
                      </label>
                      {editSubtitleFileName && (
                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{editSubtitleFileName}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 opacity-80">
                          Nạp file mới từ máy tính
                        </label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Thay thế file .srt / .vtt</span>
                          <input
                            type="file"
                            accept=".srt,.vtt,.txt"
                            onChange={(e) => handleSubtitleFileUpload(e, 'edit')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold mb-1 opacity-80">
                          Hoặc cập nhật Link phụ đề VPS
                        </label>
                        <input
                          type="text"
                          value={editSubtitleUrl}
                          onChange={(e) => {
                            setEditSubtitleUrl(e.target.value);
                            setEditSubtitleFileName(e.target.value ? 'Link trực tiếp' : '');
                          }}
                          placeholder="https://vps.yourcompany.vn/subtitles/video.vtt"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topics Section */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">Chủ đề phân loại</label>
                    <div className="flex flex-wrap gap-2">
                      {customTopics.map((topic) => {
                        const isSelected = editSelectedTopics.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopicSelection(topic, 'edit')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-xs'
                                : isLight
                                ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800'
                                : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">Mô tả & Dấu mốc thời gian</label>
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border text-xs font-mono leading-relaxed focus:outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                          : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang cập nhật...' : 'Lưu Thay Đổi Video'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: PHÂN LOẠI CHỦ ĐỀ */}
            {activeTab === 'topics' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Cấu hình Danh mục Chủ đề</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Thêm/xóa các danh mục sự kiện. Xóa chủ đề không làm mất video trong hệ thống.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetTopicsConfirm}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white/10 hover:bg-white/15'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục mặc định</span>
                  </button>
                </div>

                {/* Add new topic */}
                <form onSubmit={handleAddNewTopic} className="flex gap-3 max-w-xl mb-6">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="Nhập tên chủ đề mới (ví dụ: Hội thao, Workshop, Kickoff...)"
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                        : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm chủ đề</span>
                  </button>
                </form>

                {/* List topics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {customTopics.map((topic) => {
                    const count = videos.filter((v) =>
                      v.tags?.some((t) => t.toLowerCase() === topic.toLowerCase())
                    ).length;

                    return (
                      <div
                        key={topic}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white/[0.04] border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="text-xs font-bold truncate">{topic}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                          }`}>
                            {count} video
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTopicConfirm(topic)}
                          aria-label={`Xóa chủ đề ${topic}`}
                          title="Xóa chủ đề (Không xóa video)"
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/15 cursor-pointer transition-colors`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SUPABASE & NGINX */}
            {activeTab === 'supabase' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border space-y-6 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="border-b border-black/5 dark:border-white/10 pb-4">
                  <h2 className="text-base sm:text-lg font-bold">Cấu hình Cơ sở dữ liệu & Nginx VPS</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Tài liệu và cấu hình chuẩn để triển khai ứng dụng trên hạ tầng máy chủ nội bộ.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span>Câu lệnh SQL khởi tạo bảng Supabase (PostgreSQL)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(SUPABASE_SCHEMA_SQL, 'sql')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        copiedKey === 'sql'
                          ? 'bg-emerald-500 text-white'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                      }`}
                    >
                      {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'sql' ? 'Đã sao chép' : 'Sao chép SQL'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#09090d] text-emerald-300 font-mono text-xs overflow-x-auto border border-white/10 max-h-60 leading-relaxed">
                    <code>{SUPABASE_SCHEMA_SQL}</code>
                  </pre>
                </div>

                <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-500" />
                      <span>Mẫu File Cấu hình Máy chủ Nginx VPS</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(NGINX_CONFIG_SNIPPET, 'nginx')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        copiedKey === 'nginx'
                          ? 'bg-emerald-500 text-white'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                      }`}
                    >
                      {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'nginx' ? 'Đã sao chép' : 'Sao chép Nginx'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#09090d] text-amber-200 font-mono text-xs overflow-x-auto border border-white/10 max-h-60 leading-relaxed">
                    <code>{NGINX_CONFIG_SNIPPET}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 5: ANTI-SEO */}
            {activeTab === 'antiseo' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border space-y-6 transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="border-b border-black/5 dark:border-white/10 pb-4">
                  <h2 className="text-base sm:text-lg font-bold">Bảo vệ Riêng tư & Chống Google Index (Anti-SEO)</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Đảm bảo các video nội bộ không bao giờ bị lộ ra ngoài máy chủ tìm kiếm công cộng.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>Thẻ Meta NoIndex</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Đã chèn <code>noindex, nofollow, noarchive, nosnippet</code> vào <code>index.html</code>.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>HTTP Header X-Robots-Tag</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Cấu hình tự động trả về <code>X-Robots-Tag</code> chặn triệt để crawler.
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>Xác thực Mã PIN</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                      Chặn người xem thông thường can thiệp vào các đường dẫn VPS hoặc cơ sở dữ liệu.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Mẫu cấu hình Anti-SEO cho Next.js</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(NEXT_ANTI_SEO_SNIPPET, 'antiseo')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        copiedKey === 'antiseo'
                          ? 'bg-emerald-500 text-white'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                      }`}
                    >
                      {copiedKey === 'antiseo' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Sao chép</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#09090d] text-rose-300 font-mono text-xs overflow-x-auto border border-white/10 max-h-52 leading-relaxed">
                    <code>{NEXT_ANTI_SEO_SNIPPET}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDevPortal;
