import React, { useEffect, useRef, useState } from 'react';
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
  Edit3,
  FileText,
  Upload,
  Tag,
  Trash2,
  RotateCcw,
  Film,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { NewVideoInput, ThemeMode, UpdateVideoInput, Video } from '../../types/video';
import {
  createVideoRecord,
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

const VOD_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORACLE_VOD_BASE_URL) ||
  'https://158.101.153.49.sslip.io';

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
    'Harry Potter',
  ]);
  const [addCustomTagsText, setAddCustomTagsText] = useState('');
  const [addDescription, setAddDescription] = useState('');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

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

  // Topics
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Tự động phân tích thời lượng video (HH:MM:SS) từ file trên máy tính
  const autoDetectVideoDuration = (file: File, mode: 'add' | 'edit') => {
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      const totalSec = Math.floor(tempVideo.duration);
      if (!isNaN(totalSec) && totalSec > 0) {
        const h = Math.floor(totalSec / 3600)
          .toString()
          .padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60)
          .toString()
          .padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        const durationStr = `${h}:${m}:${s}`;
        if (mode === 'add') {
          setAddDuration(durationStr);
        } else {
          setEditDuration(durationStr);
        }
      }
    };
  };

  // UPLOAD TRỰC TIẾP FILE PHIM LÊN ORACLE CLOUD VPS (HTTP PUT)
  const handleVideoFileSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chuẩn hóa tên file: loại bỏ ký tự lạ và khoảng trắng
    const cleanName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    // Tự động điền tiêu đề nếu chưa có
    if (mode === 'add' && !addTitle) {
      setAddTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    // Tự động trích xuất thời lượng file
    autoDetectVideoDuration(file, mode);

    const targetUrl = `${VOD_BASE_URL}/videos/${cleanName}`;
    setUploadProgress(0);
    setUploadStatusText(`Đang tải lên: ${cleanName}...`);

    const xhr = new XMLHttpRequest();
    activeXhrRef.current = xhr;
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        const elapsedTime = (Date.now() - startTime) / 1000;
        const speedBytes = event.loaded / elapsedTime;
        const speedMB = (speedBytes / (1024 * 1024)).toFixed(1);

        const loadedMB = (event.loaded / (1024 * 1024)).toFixed(0);
        const totalMB = (event.total / (1024 * 1024)).toFixed(0);

        setUploadProgress(percent);
        setUploadSpeed(`${speedMB} MB/s (${loadedMB} MB / ${totalMB} MB)`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        setUploadStatusText('Upload thành công 100%!');
        if (mode === 'add') {
          setAddVideoUrl(targetUrl);
        } else {
          setEditVideoUrl(targetUrl);
        }
        toast.success(`Đã nạp phim "${cleanName}" lên VPS Oracle thành công!`);
        setTimeout(() => {
          setUploadProgress(null);
          setUploadSpeed('');
        }, 3000);
      } else {
        toast.error(`Lỗi khi nạp file lên VPS (Mã HTTP: ${xhr.status})`);
        setUploadProgress(null);
      }
      activeXhrRef.current = null;
    };

    xhr.onerror = () => {
      toast.error('Lỗi đường truyền mạng đến máy chủ Oracle.');
      setUploadProgress(null);
      activeXhrRef.current = null;
    };

    xhr.open('PUT', targetUrl, true);
    xhr.send(file);
  };

  const handleCancelUpload = () => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
      setUploadProgress(null);
      setUploadSpeed('');
      toast.info('Đã hủy tải phim lên VPS.');
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

  const toggleTopicSelection = (topic: string, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      setAddSelectedTopics((prev) =>
        prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
      );
    } else {
      setEditSelectedTopics((prev) =>
        prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
      );
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addVideoUrl.trim()) {
      toast.error('Vui lòng tải phim lên hoặc nhập link phát video (.mp4)');
      return;
    }

    setIsSubmitting(true);
    const extraTags = addCustomTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const allTags = Array.from(new Set([...addSelectedTopics, ...extraTags]));

    const payload: NewVideoInput = {
      title: addTitle.trim(),
      description: addDescription.trim() || '',
      event_date: addEventDate,
      duration: addDuration.trim() || '00:15:00',
      video_url: addVideoUrl.trim(),
      thumbnail_url: addThumbnailUrl.trim() || undefined,
      tags: allTags.length > 0 ? allTags : ['Harry Potter'],
      subtitle_url: addSubtitleUrl.trim() || undefined,
    };

    try {
      const created = await createVideoRecord(payload);
      onVideoAdded(created);
      toast.success(`Đã đăng bộ phim "${created.title}" lên rạp thành công!`);

      // Reset form
      setAddTitle('');
      setAddVideoUrl('');
      setAddThumbnailUrl('');
      setAddSubtitleUrl('');
      setAddSubtitleFileName('');
      setAddDescription('');
      setAddCustomTagsText('');
      setAddSelectedTopics(['Harry Potter']);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu video mới.');
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
    const allTags = Array.from(new Set([...editSelectedTopics, ...extraTags]));

    const payload: UpdateVideoInput = {
      id: selectedVideoId,
      title: editTitle.trim(),
      description: editDescription.trim() || '',
      event_date: editEventDate,
      duration: editDuration.trim() || '00:15:00',
      video_url: editVideoUrl.trim(),
      thumbnail_url: editThumbnailUrl.trim() || undefined,
      tags: allTags.length > 0 ? allTags : ['Harry Potter'],
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
            aria-label="Quay lại rạp phim"
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về rạp phim</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">
                Trung Tâm Quản Trị Rạp Phim (Dev Portal)
              </h1>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Tải phim trực tiếp lên Oracle Cloud VPS, chỉnh phụ đề & phân loại chủ đề
              </p>
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 hidden sm:inline">
              Đã kết nối Oracle & Supabase
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
                Nhập mã PIN kỹ thuật để truy cập trang tải phim và cấu hình.
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
                  Mã mặc định:{' '}
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
                <span>Thêm Phim Mới</span>
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
                <span>Cập nhật Phim ({videos.length})</span>
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
                <span>Chủ đề ({customTopics.length})</span>
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

            {/* TAB 1: THÊM PHIM MỚI */}
            {activeTab === 'add' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                  <h2 className="text-base sm:text-lg font-bold">Tải Lên Phim Mới</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Chọn file video MP4 từ máy tính để tải trực tiếp lên Oracle Cloud VPS, hoặc dán link phát sẵn có.
                  </p>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                  {/* KHU VỰC UPLOAD TRỰC TIẾP LÊN ORACLE VPS */}
                  <div
                    className={`p-5 rounded-2xl border-2 border-dashed transition-all ${
                      uploadProgress !== null
                        ? 'border-rose-500 bg-rose-500/5'
                        : isLight
                        ? 'border-slate-300 bg-slate-50 hover:border-rose-400'
                        : 'border-white/15 bg-white/[0.02] hover:border-rose-500/50'
                    }`}
                  >
                    {uploadProgress === null ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold mb-1">
                          Kéo thả hoặc Chọn file Video từ máy tính
                        </h3>
                        <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          Hỗ trợ file .mp4, .mkv, .webm dung lượng lên tới 10GB. Tự động tải thẳng sang Oracle VPS.
                        </p>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-md">
                          <Film className="w-4 h-4" />
                          <span>Chọn file Phim (.mp4)</span>
                          <input
                            type="file"
                            accept="video/mp4,video/x-matroska,video/webm"
                            onChange={(e) => handleVideoFileSelected(e, 'add')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      /* THANH TIẾN TRÌNH UPLOAD THỰC TẾ */
                      <div className="space-y-3 py-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-2 text-rose-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{uploadStatusText}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-zinc-400">{uploadSpeed}</span>
                            <span className="text-rose-500 font-mono text-sm">
                              {uploadProgress}%
                            </span>
                            <button
                              type="button"
                              onClick={handleCancelUpload}
                              title="Hủy tải lên"
                              className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Thanh Bar */}
                        <div className="w-full h-3 rounded-full bg-black/20 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-rose-400 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">
                        Tiêu đề Phim <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="Ví dụ: Harry Potter và Hòn Đá Phù Thủy"
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold flex items-center justify-between">
                        <span>Link phát Video (.mp4 trên VPS)</span>
                        <span className="text-[10px] text-emerald-500">
                          {addVideoUrl ? '✓ Đã sẵn sàng' : 'Tự điền sau khi tải'}
                        </span>
                      </label>
                      <input
                        type="url"
                        value={addVideoUrl}
                        onChange={(e) => setAddVideoUrl(e.target.value)}
                        placeholder={`${VOD_BASE_URL}/videos/phim.mp4`}
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
                        Link Ảnh Bìa Thumbnail (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={addThumbnailUrl}
                        onChange={(e) => setAddThumbnailUrl(e.target.value)}
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Ngày phát hành / xem</label>
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
                        <label className="block text-xs font-semibold flex items-center justify-between">
                          <span>Thời lượng</span>
                          <span className="text-[10px] text-zinc-400">Tự đo khi chọn file</span>
                        </label>
                        <input
                          type="text"
                          value={addDuration}
                          onChange={(e) => setAddDuration(e.target.value)}
                          placeholder="02:32:00"
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
                        <span>Phụ đề Phim (.SRT / .VTT)</span>
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
                          Nạp trực tiếp file .srt từ máy tính
                        </label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 text-xs font-semibold cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Chọn file phụ đề .srt</span>
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
                          Hoặc link phụ đề có sẵn
                        </label>
                        <input
                          type="text"
                          value={addSubtitleUrl}
                          onChange={(e) => {
                            setAddSubtitleUrl(e.target.value);
                            setAddSubtitleFileName(e.target.value ? 'Link trực tiếp' : '');
                          }}
                          placeholder={`${VOD_BASE_URL}/subtitles/phim.vtt`}
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
                    <label className="block text-xs font-semibold">Gắn thể loại / Chủ đề</label>
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
                      Mô tả bộ phim & Mốc thời gian đặc sắc
                    </label>
                    <textarea
                      rows={4}
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder={`Ví dụ: Tập 1 mở đầu hành trình của cậu bé phù thủy Harry Potter...&#10;00:15:00 - Nhận thư mời nhập học Hogwarts&#10;00:45:20 - Mua đũa phép tại Hẻm Xéo`}
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
                      disabled={isSubmitting || uploadProgress !== null}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu vào Supabase...' : 'Lưu & Đăng Lên Rạp Phim'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: CẬP NHẬT PHIM */}
            {activeTab === 'update' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Cập nhật & Chỉnh sửa Phim</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Chọn bộ phim trong danh sách để cập nhật đường dẫn, sửa tiêu đề hoặc thay thế phụ đề.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold whitespace-nowrap">Chọn Phim:</span>
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
                        Tiêu đề Phim <span className="text-rose-500">*</span>
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
                      <label className="block text-xs font-semibold">Link Ảnh Bìa</label>
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
                        <label className="block text-xs font-semibold">Ngày phát hành</label>
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
                          <span>Thay thế file .srt</span>
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
                    <label className="block text-xs font-semibold">Mô tả bộ phim</label>
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
                      {isSubmitting ? 'Đang cập nhật...' : 'Lưu Thay Đổi Phim'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: CHỦ ĐỀ */}
            {activeTab === 'topics' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className="mb-6 pb-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Quản Lý Thể Loại / Chủ Đề</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Thêm/xóa danh mục. Xóa chủ đề không làm mất phim đã lưu.
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

                <form onSubmit={handleAddNewTopic} className="flex gap-3 max-w-xl mb-6">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="Nhập thể loại mới (ví dụ: Phim Phép Thuật, Hành Động, Hoạt Hình...)"
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
                    <span>Thêm</span>
                  </button>
                </form>

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
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-white/10 text-zinc-300'
                            }`}
                          >
                            {count} phim
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTopicConfirm(topic)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/15 cursor-pointer transition-colors"
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
                  <h2 className="text-base sm:text-lg font-bold">Hạ Tầng Rạp Phim Đang Kết Nối</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Máy chủ Streaming: <code className="font-mono text-rose-500">{VOD_BASE_URL}</code>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span>SQL Schema Supabase</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(SUPABASE_SCHEMA_SQL, 'sql')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer bg-white/10 hover:bg-white/15"
                    >
                      {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#09090d] text-emerald-300 font-mono text-xs overflow-x-auto border border-white/10 max-h-60 leading-relaxed">
                    <code>{SUPABASE_SCHEMA_SQL}</code>
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
                  <h2 className="text-base sm:text-lg font-bold">Bảo Vệ Riêng Tư Tuyệt Đối</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Toàn bộ rạp phim được thiết lập noindex, chặn mọi công cụ tìm kiếm bên ngoài.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-white/10 space-y-2 bg-white/[0.04]">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>NoIndex Meta</span>
                    </div>
                    <p className="text-xs text-zinc-400">Đã kích hoạt trong index.html</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 space-y-2 bg-white/[0.04]">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>X-Robots-Tag</span>
                    </div>
                    <p className="text-xs text-zinc-400">Đã cấu hình trên Vercel & Nginx</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 space-y-2 bg-white/[0.04]">
                    <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                      <Check className="w-4 h-4" />
                      <span>Mã PIN Dev</span>
                    </div>
                    <p className="text-xs text-zinc-400">Khóa cổng tải phim an toàn</p>
                  </div>
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
