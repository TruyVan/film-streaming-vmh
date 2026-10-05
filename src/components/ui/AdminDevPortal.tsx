import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Check,
  Server,
  Lock,
  KeyRound,
  Edit3,
  FileText,
  Upload,
  Tag,
  Trash2,
  Film,
  XCircle,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { NewVideoInput, ThemeMode, UpdateVideoInput, Video } from '../../types/video';
import {
  createVideoRecord,
  hardDeleteVideoRecord,
  restoreVideoRecord,
  softDeleteVideoRecord,
  updateVideoRecord,
} from '../../lib/supabase';

interface AdminDevPortalProps {
  themeMode: ThemeMode;
  videos: Video[];
  customTopics: string[];
  onVideoAdded: (video: Video) => void;
  onVideoUpdated: (video: Video) => void;
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
  onGoHome,
}) => {
  const isLight = themeMode === 'light';

  // 1. Luôn bắt nhập mã PIN mỗi lần mở trang Admin (Không lưu Session)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [listFilter, setListFilter] = useState<'active' | 'trash'>('active');

  // Form ADD
  const [addTitle, setAddTitle] = useState('');
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addThumbnailUrl, setAddThumbnailUrl] = useState('');
  const [addSubtitleUrl, setAddSubtitleUrl] = useState('');
  const [addSubtitleFileName, setAddSubtitleFileName] = useState('');
  const [addEventDate, setAddEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [addDuration, setAddDuration] = useState('00:00:00');
  const [addSelectedTopics, setAddSelectedTopics] = useState<string[]>(['Harry Potter']);
  const [addDescription, setAddDescription] = useState('');

  // Upload States (Cố định, không bị mất)
  const [uploadedVideoFile, setUploadedVideoFile] = useState<{
    name: string;
    sizeMB: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  // Form EDIT
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh sách video Active và Trash (Lọc trong vòng 30 ngày)
  const now = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const activeVideos = videos.filter((v) => !v.deleted_at);
  const trashedVideos = videos.filter((v) => {
    if (!v.deleted_at) return false;
    const deletedTime = new Date(v.deleted_at).getTime();
    return now - deletedTime <= thirtyDaysMs; // Chỉ giữ video xóa tạm trong 30 ngày
  });

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError('');
      toast.success('Xác thực quyền Quản trị viên thành công!');
    } else {
      setAuthError('Mã PIN không đúng. Vui lòng thử lại!');
      toast.error('Mã PIN không chính xác!');
    }
  };

  // TỰ ĐỘNG CHỤP KHUNG HÌNH (THUMBNAIL) TỪ VIDEO BẰNG CANVAS
  const generateThumbnailFromVideo = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Seek đến giây thứ 1 (hoặc giữa video nếu ngắn)
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAddThumbnailUrl(thumbDataUrl);
        toast.info('Đã tự động trích xuất ảnh bìa từ video!');
      }
      URL.revokeObjectURL(video.src);
    };
  };

  // Tự động phân tích thời lượng video (HH:MM:SS)
  const autoDetectVideoDuration = (file: File) => {
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = URL.createObjectURL(file);
    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(tempVideo.src);
      const totalSec = Math.floor(tempVideo.duration);
      if (!isNaN(totalSec) && totalSec > 0) {
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        setAddDuration(`${h}:${m}:${s}`);
      }
    };
  };

  // UPLOAD TRỰC TIẾP LÊN VPS
  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanName = file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    if (!addTitle) {
      setAddTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
    }

    autoDetectVideoDuration(file);
    generateThumbnailFromVideo(file);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedVideoFile({ name: cleanName, sizeMB: sizeInMB });

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

        setUploadProgress(percent);
        setUploadSpeed(`${speedMB} MB/s (${(event.loaded / 1048576).toFixed(0)} / ${sizeInMB} MB)`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadProgress(100);
        setUploadStatusText('Upload thành công 100%!');
        setAddVideoUrl(targetUrl);
        toast.success(`Đã nạp phim "${cleanName}" lên VPS thành công!`);
      } else {
        toast.error(`Lỗi nạp file lên VPS (HTTP ${xhr.status})`);
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

  // Upload ảnh bìa từ máy tính
  const handleCustomThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAddThumbnailUrl(event.target.result as string);
        toast.success('Đã tải ảnh bìa tùy chỉnh từ máy tính!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCancelUpload = () => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
      setUploadProgress(null);
      setUploadedVideoFile(null);
      setAddVideoUrl('');
      toast.info('Đã hủy tải phim.');
    }
  };

  // Xử lý Xóa tạm (Soft Delete)
  const handleSoftDelete = async (video: Video) => {
    if (window.confirm(`Bạn có chắc muốn chuyển phim "${video.title}" vào thùng rác? (Tự động xóa vĩnh viễn sau 30 ngày)`)) {
      await softDeleteVideoRecord(video.id);
      onVideoUpdated({ ...video, deleted_at: new Date().toISOString() });
      toast.success(`Đã chuyển "${video.title}" vào thùng rác.`);
    }
  };

  // Xử lý Khôi phục (Restore)
  const handleRestore = async (video: Video) => {
    await restoreVideoRecord(video.id);
    onVideoUpdated({ ...video, deleted_at: null });
    toast.success(`Đã khôi phục phim "${video.title}" về rạp!`);
  };

  // Xử lý Xóa vĩnh viễn (Hard Delete)
  const handleHardDelete = async (video: Video) => {
    if (window.confirm(`HÀNH ĐỘNG NÀY KHÔNG THỂ KHÔI PHỤC! Bạn có chắc muốn xóa vĩnh viễn phim "${video.title}" khỏi cơ sở dữ liệu?`)) {
      await hardDeleteVideoRecord(video.id);
      onVideoUpdated({ ...video, deleted_at: 'permanently_deleted' });
      toast.success(`Đã xóa vĩnh viễn "${video.title}".`);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addVideoUrl.trim()) {
      toast.error('Vui lòng tải phim lên hoặc nhập link phát video (.mp4)');
      return;
    }

    setIsSubmitting(true);
    const payload: NewVideoInput = {
      title: addTitle.trim(),
      description: addDescription.trim() || '',
      event_date: addEventDate,
      duration: addDuration.trim() || '00:00:00',
      video_url: addVideoUrl.trim(),
      thumbnail_url: addThumbnailUrl.trim() || undefined,
      tags: addSelectedTopics.length > 0 ? addSelectedTopics : ['Harry Potter'],
      subtitle_url: addSubtitleUrl.trim() || undefined,
    };

    try {
      const created = await createVideoRecord(payload);
      onVideoAdded(created);
      toast.success(`Đã đăng bộ phim "${created.title}" lên rạp thành công!`);

      // Reset
      setAddTitle('');
      setAddVideoUrl('');
      setAddThumbnailUrl('');
      setUploadedVideoFile(null);
      setUploadProgress(null);
      setAddDescription('');
      setActiveTab('list');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu video mới.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-3.5rem)] flex flex-col transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* Top Header */}
      <div
        className={`w-full px-4 sm:px-8 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#141418] border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về rạp phim</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Quản Trị Rạp Phim (Dev Portal)</h1>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Tải phim, trích xuất ảnh bìa tự động, quản lý thùng rác & xóa tạm 30 ngày
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="w-full flex-1 px-4 sm:px-8 py-6">
        {!isAuthenticated ? (
          /* Màn hình khóa PIN bắt buộc mỗi lần truy cập */
          <div className="max-w-md mx-auto my-12 p-6 sm:p-8 rounded-2xl border shadow-xl bg-[#141418] border-white/10">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">Bảo Mật Quyền Quản Trị</h2>
              <p className="text-xs text-zinc-400">
                Nhập mã PIN kỹ thuật để truy cập trung tâm quản lý rạp phim.
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
                  placeholder="Nhập mã PIN (admin2026)"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-[#1a1a20] border-white/15 text-white focus:border-rose-500 focus:outline-none"
                  autoFocus
                />
                {authError && <p className="text-xs text-rose-500 pt-1">{authError}</p>}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-4 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Mở khóa
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Quản trị chính */
          <div className="w-full space-y-6">
            {/* Tab navigation */}
            <div className="p-1.5 rounded-2xl border flex items-center gap-1.5 bg-[#141418] border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Danh Sách Phim ({activeVideos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'add'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Phim Mới</span>
              </button>
            </div>

            {/* TAB 1: DANH SÁCH PHIM DẠNG ROW (HỖ TRỢ THÙNG RÁC & SOFT DELETE) */}
            {activeTab === 'list' && (
              <div className="p-6 rounded-2xl border bg-[#141418] border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setListFilter('active')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        listFilter === 'active'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      Đang hiển thị ({activeVideos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setListFilter('trash')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        listFilter === 'trash'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      Thùng rác ({trashedVideos.length})
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400">
                    {listFilter === 'trash' ? 'Video trong thùng rác sẽ tự hủy vĩnh viễn sau 30 ngày.' : 'Quản lý toàn bộ phim đã tải lên rạp.'}
                  </p>
                </div>

                {/* Danh sách row tương tự lịch sử xem */}
                <div className="space-y-3">
                  {(listFilter === 'active' ? activeVideos : trashedVideos).map((video) => (
                    <div
                      key={video.id}
                      className="p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-32 h-18 rounded-lg overflow-hidden bg-black/40 shrink-0 relative border border-white/10">
                          {video.thumbnail_url ? (
                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <Film className="w-6 h-6" />
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white">
                            {video.duration || '00:00:00'}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm font-bold truncate text-white">{video.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3.5 h-3.5" />
                              {video.event_date}
                            </span>
                            <div className="flex gap-1.5">
                              {(video.tags || []).map((t) => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-zinc-300">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {listFilter === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleSoftDelete(video)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa tạm</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(video)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Khôi phục</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHardDelete(video)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa hẳn</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: THÊM PHIM MỚI VỚI THUMBNAIL CANVAS & KHUNG PREVIEW BỀN VỮNG */}
            {activeTab === 'add' && (
              <div className="p-6 sm:p-8 rounded-2xl border bg-[#141418] border-white/10 space-y-6">
                <div className="pb-4 border-b border-white/10">
                  <h2 className="text-base sm:text-lg font-bold">Tải Lên Phim Mới</h2>
                  <p className="text-xs text-zinc-400">
                    File video sẽ tự động trích xuất ảnh bìa và thời lượng khi chọn file.
                  </p>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                  {/* Vùng tải phim cố định (Không bị biến mất) */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-rose-500/40 bg-rose-500/5">
                    {uploadProgress === null && !uploadedVideoFile ? (
                      <div className="text-center py-4">
                        <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold mb-1">Chọn file Phim (.mp4) từ máy tính</h3>
                        <p className="text-xs text-zinc-400 mb-4">
                          Tự động tải lên VPS, đo thời lượng và chụp ảnh bìa từ video.
                        </p>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md">
                          <Film className="w-4 h-4" />
                          <span>Chọn file video</span>
                          <input type="file" accept="video/mp4" onChange={handleVideoFileSelected} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      /* KHUNG HIỂN THỊ TRẠNG THÁI BỀN VỮNG (Không bao giờ bị bug biến mất) */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>Đã nạp file: {uploadedVideoFile?.name} ({uploadedVideoFile?.sizeMB} MB)</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-zinc-400">{uploadSpeed}</span>
                            <span className="text-rose-500 font-mono text-sm">{uploadProgress}%</span>
                            {uploadProgress !== 100 && (
                              <button type="button" onClick={handleCancelUpload} className="text-zinc-400 hover:text-rose-500">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-200"
                            style={{ width: `${uploadProgress || 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thông tin video & Ảnh bìa trích xuất */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Tiêu đề Phim *</label>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="Tiêu đề phim..."
                        className="w-full px-4 py-2.5 rounded-xl border text-xs bg-[#1a1a20] border-white/15 text-white focus:border-rose-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Link phát Video (.mp4)</label>
                      <input
                        type="url"
                        value={addVideoUrl}
                        onChange={(e) => setAddVideoUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-xs font-mono bg-[#1a1a20] border-white/15 text-white focus:outline-none"
                        required
                      />
                    </div>

                    {/* Vùng Ảnh bìa (Trích xuất từ video hoặc nạp từ máy) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Ảnh Bìa (Thumbnail)</label>
                        <label className="text-xs text-rose-400 hover:underline cursor-pointer flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Tải ảnh khác từ máy</span>
                          <input type="file" accept="image/*" onChange={handleCustomThumbnailUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        {addThumbnailUrl ? (
                          <div className="w-24 h-14 rounded-lg overflow-hidden border border-white/20 shrink-0">
                            <img src={addThumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-14 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-zinc-500 text-xs shrink-0">
                            Chưa có
                          </div>
                        )}
                        <input
                          type="text"
                          value={addThumbnailUrl}
                          onChange={(e) => setAddThumbnailUrl(e.target.value)}
                          placeholder="Dán link ảnh hoặc trích xuất tự động..."
                          className="flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono bg-[#1a1a20] border-white/15 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Ngày phát hành</label>
                        <input
                          type="date"
                          value={addEventDate}
                          onChange={(e) => setAddEventDate(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border text-xs bg-[#1a1a20] border-white/15 text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Thời lượng (Tự đo)</label>
                        <input
                          type="text"
                          value={addDuration}
                          onChange={(e) => setAddDuration(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono bg-[#1a1a20] border-white/15 text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || uploadProgress !== null && uploadProgress < 100}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu vào Supabase...' : 'Lưu & Đăng Lên Rạp Phim'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDevPortal;
