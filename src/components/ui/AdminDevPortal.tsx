import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Check,
  Lock,
  KeyRound,
  Edit3,
  FileText,
  Upload,
  Trash2,
  Film,
  XCircle,
  RotateCcw,
  Image as ImageIcon,
  Calendar,
  CheckSquare,
  Square,
  AlertTriangle,
  Globe2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FolderTree,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { NewVideoInput, SubtitleTrack, ThemeMode, UpdateVideoInput, Video } from '../../types/video';
import {
  createVideoRecord,
  hardDeleteVideoRecord,
  restoreVideoRecord,
  softDeleteVideoRecord,
  updateVideoRecord,
  updateVideoSortOrders,
} from '../../lib/supabase';

interface AdminDevPortalProps {
  themeMode: ThemeMode;
  videos: Video[];
  customTopics: string[];
  onVideoAdded: (video: Video) => void;
  onVideoUpdated: (video: Video) => void;
  onAddTopic?: (topic: string) => Promise<void> | void;
  onRemoveTopic?: (topic: string) => Promise<void> | void;
  onVideosReordered?: (updatedVideos: Video[]) => void;
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
  onVideosReordered,
  onGoHome,
}) => {
  const isLight = themeMode === 'light';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit' | 'categories'>('list');
  const [listFilter, setListFilter] = useState<'active' | 'trash'>('active');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form ADD
  const [addTitle, setAddTitle] = useState('');
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addThumbnailUrl, setAddThumbnailUrl] = useState('');
  const [addEventDate, setAddEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [addDuration, setAddDuration] = useState('00:00:00');
  const [addCategory, setAddCategory] = useState<string>('');
  const [inlineNewCategory, setInlineNewCategory] = useState<string>('');
  const [addDescription, setAddDescription] = useState('');
  // DANH SÁCH ĐA PHỤ ĐỀ KHI THÊM
  const [addSubtitles, setAddSubtitles] = useState<SubtitleTrack[]>([]);

  // Upload States & Smart Thumbnail extraction
  const [activeVideoFile, setActiveVideoFile] = useState<File | null>(null);
  const [thumbnailSeekOffset, setThumbnailSeekOffset] = useState<number>(25);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<{
    name: string;
    sizeMB: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  // Form EDIT
  const [editingVideoId, setEditingVideoId] = useState<string>('');
  const [editTitle, setEditTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editDescription, setEditDescription] = useState('');
  // DANH SÁCH ĐA PHỤ ĐỀ KHI SỬA
  const [editSubtitles, setEditSubtitles] = useState<SubtitleTrack[]>([]);

  // Quản lý Phân Loại & Kéo Thả Thứ Tự Phim (Tab categories)
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [selectedCatForOrder, setSelectedCatForOrder] = useState<string>('');
  const [categoryVideosOrder, setCategoryVideosOrder] = useState<Video[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const activeVideos = videos.filter((v) => !v.deleted_at);
  const trashedVideos = videos.filter((v) => {
    if (!v.deleted_at) return false;
    const deletedTime = new Date(v.deleted_at).getTime();
    return now - deletedTime <= thirtyDaysMs;
  });

  const currentDisplayList = listFilter === 'active' ? activeVideos : trashedVideos;

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError('');
      toast.success('Mở khóa Quản trị viên thành công!');
    } else {
      setAuthError('Mã PIN không đúng. Vui lòng thử lại!');
      toast.error('Mã PIN không chính xác!');
    }
  };

  // ==============================================================
  // THUẬT TOÁN TRÍCH XUẤT ẢNH BÌA THÔNG MINH (CHỐNG MÀN HÌNH ĐEN)
  // ==============================================================
  const generateThumbnailFromVideo = (file: File, customSeekTime?: number) => {
    setActiveVideoFile(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const dur = video.duration || 60;
      let candidateTimes: number[] = [];

      if (typeof customSeekTime === 'number' && customSeekTime > 0) {
        candidateTimes = [Math.min(customSeekTime, Math.max(1, dur - 2))];
      } else {
        // Tự động tìm khung hình sáng, tuyệt đối không lấy 0s-1s (gần như luôn là màn hình đen)
        if (dur > 300) {
          candidateTimes = [35, 75, 120, 180, Math.floor(dur * 0.15), 20];
        } else if (dur > 60) {
          candidateTimes = [15, 30, 45, Math.floor(dur * 0.2), 10];
        } else {
          candidateTimes = [
            Math.max(2, Math.floor(dur * 0.2)),
            Math.max(3, Math.floor(dur * 0.4)),
            Math.max(4, Math.floor(dur * 0.6)),
          ];
        }
      }

      let currentProbeIdx = 0;
      let bestDataUrl = '';
      let highestBrightness = -1;

      const attemptSeek = (timeSec: number) => {
        video.currentTime = Math.max(0.5, Math.min(timeSec, dur - 0.5));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Đo độ sáng trung bình (tránh màn hình đen)
            let totalLuma = 0;
            const step = Math.max(1, Math.floor(data.length / 400)) * 4; // Lấy mẫu ~400 điểm ảnh
            let sampleCount = 0;
            for (let i = 0; i < data.length; i += step) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
              sampleCount++;
            }
            const avgBrightness = sampleCount > 0 ? totalLuma / sampleCount : 0;
            const currentDataUrl = canvas.toDataURL('image/jpeg', 0.88);

            if (avgBrightness > highestBrightness) {
              highestBrightness = avgBrightness;
              bestDataUrl = currentDataUrl;
            }

            // Nếu độ sáng > 25 (khung hình rõ nét, không đen) hoặc đã thử hết các mốc
            if (avgBrightness > 25 || currentProbeIdx >= candidateTimes.length - 1) {
              const finalUrl = avgBrightness > 20 ? currentDataUrl : bestDataUrl;
              setAddThumbnailUrl(finalUrl);
              setThumbnailSeekOffset(candidateTimes[currentProbeIdx]);
              toast.info(`Đã trích xuất ảnh bìa sắc nét từ giây ${candidateTimes[currentProbeIdx]}s!`);
              URL.revokeObjectURL(video.src);
            } else {
              // Khung hình quá tối (màn hình đen mở đầu), thử mốc kế tiếp
              currentProbeIdx++;
              attemptSeek(candidateTimes[currentProbeIdx]);
            }
          }
        } catch (err) {
          console.warn('Lỗi trích xuất thumbnail:', err);
          URL.revokeObjectURL(video.src);
        }
      };

      attemptSeek(candidateTimes[0]);
    };
  };

  const handleCycleThumbnail = () => {
    if (!activeVideoFile) {
      toast.warning('Chưa có file video để trích xuất lại ảnh bìa.');
      return;
    }
    const nextOffset = thumbnailSeekOffset + 25;
    setThumbnailSeekOffset(nextOffset);
    generateThumbnailFromVideo(activeVideoFile, nextOffset);
  };

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

  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveVideoFile(file);

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
        setAddVideoUrl(targetUrl);
        setUploadProgress(100);
        setUploadStatusText('Upload thành công 100%!');
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

  // ==========================================
  // QUẢN LÝ ĐA PHỤ ĐỀ (SUBTITLE TRACKS MANAGER)
  // ==========================================
  const handleAddSubtitleTrack = (mode: 'add' | 'edit') => {
    const isFirst = mode === 'add' ? addSubtitles.length === 0 : editSubtitles.length === 0;
    const newTrack: SubtitleTrack = {
      name: isFirst ? 'Tiếng Việt' : 'English',
      url: '',
      default: isFirst,
    };
    if (mode === 'add') {
      setAddSubtitles([...addSubtitles, newTrack]);
    } else {
      setEditSubtitles([...editSubtitles, newTrack]);
    }
  };

  const handleRemoveSubtitleTrack = (index: number, mode: 'add' | 'edit') => {
    if (mode === 'add') {
      const next = addSubtitles.filter((_, i) => i !== index);
      if (addSubtitles[index]?.default && next.length > 0) next[0].default = true;
      setAddSubtitles(next);
    } else {
      const next = editSubtitles.filter((_, i) => i !== index);
      if (editSubtitles[index]?.default && next.length > 0) next[0].default = true;
      setEditSubtitles(next);
    }
  };

  const handleUpdateTrackField = (
    index: number,
    field: keyof SubtitleTrack,
    val: any,
    mode: 'add' | 'edit'
  ) => {
    const list = mode === 'add' ? [...addSubtitles] : [...editSubtitles];
    if (field === 'default') {
      list.forEach((track, i) => {
        track.default = i === index;
      });
    } else {
      (list[index] as any)[field] = val;
    }

    if (mode === 'add') setAddSubtitles(list);
    else setEditSubtitles(list);
  };

  const handleSubtitleFileSelectedForTrack = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    mode: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isSrtOrVtt = fileName.endsWith('.srt') || fileName.endsWith('.vtt') || fileName.endsWith('.txt');
    if (!isSrtOrVtt) {
      toast.error('Chỉ hỗ trợ file phụ đề định dạng .srt hoặc .vtt');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const mime = fileName.endsWith('.vtt') ? 'text/vtt' : 'text/plain';
        const dataUri = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
        handleUpdateTrackField(index, 'url', dataUri, mode);
        toast.success(`Đã nạp file "${fileName}" cho phụ đề!`);
      }
    };
    reader.readAsText(file);
  };

  const handleCustomThumbnailUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: 'add' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imgUrl = event.target.result as string;
        if (mode === 'add') setAddThumbnailUrl(imgUrl);
        else setEditThumbnailUrl(imgUrl);
        toast.success('Đã tải ảnh bìa tùy chỉnh!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCancelUpload = () => {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    setUploadProgress(null);
    setUploadedVideoFile(null);
    setAddVideoUrl('');
    setAddThumbnailUrl('');
    setActiveVideoFile(null);
    toast.info('Đã xóa file vừa nạp.');
  };

  // Mở Form SỬA PHIM: Tự động chuyển đổi phụ đề đơn cũ sang mảng đa phụ đề
  const handleStartEdit = (video: Video) => {
    setEditingVideoId(video.id);
    setEditTitle(video.title);
    setEditVideoUrl(video.video_url);
    setEditThumbnailUrl(video.thumbnail_url || '');
    setEditEventDate(video.event_date);
    setEditDuration(video.duration || '00:00:00');

    // Chuyển đổi phụ đề sang mảng đa phụ đề chuẩn
    if (video.subtitles && video.subtitles.length > 0) {
      setEditSubtitles(video.subtitles);
    } else if (video.subtitle_url) {
      setEditSubtitles([{ name: 'Tiếng Việt', url: video.subtitle_url, default: true }]);
    } else {
      setEditSubtitles([]);
    }

    const currentCat = (video.tags && video.tags.length > 0) ? video.tags[0] : '';
    setEditCategory(currentCat);

    setEditDescription(video.description || '');
    setActiveTab('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === currentDisplayList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentDisplayList.map((v) => v.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSoftDelete = async (targets: string[]) => {
    if (window.confirm(`Chuyển ${targets.length} phim vào thùng rác? (Tự động xóa hẳn sau 30 ngày)`)) {
      for (const id of targets) {
        await softDeleteVideoRecord(id);
        const v = videos.find((item) => item.id === id);
        if (v) onVideoUpdated({ ...v, deleted_at: new Date().toISOString() });
      }
      setSelectedIds([]);
      toast.success(`Đã chuyển ${targets.length} phim vào thùng rác.`);
    }
  };

  const handleRestore = async (targets: string[]) => {
    for (const id of targets) {
      await restoreVideoRecord(id);
      const v = videos.find((item) => item.id === id);
      if (v) onVideoUpdated({ ...v, deleted_at: null });
    }
    setSelectedIds([]);
    toast.success(`Đã khôi phục ${targets.length} phim về rạp!`);
  };

  // Xóa vĩnh viễn: Xóa cả trên Supabase LẪN trên ổ cứng VPS Oracle!
  const handleHardDelete = async (targets: string[]) => {
    if (
      window.confirm(
        `CẢNH BÁO: Xóa vĩnh viễn ${targets.length} phim khỏi cơ sở dữ liệu VÀ giải phóng dung lượng ổ cứng VPS? Hành động này không thể hoàn tác!`
      )
    ) {
      for (const id of targets) {
        const v = videos.find((item) => item.id === id);

        // 1. GỬI LỆNH XÓA FILE VẬT LÝ TRÊN Ổ CỨNG VPS ORACLE QUA WEBDAV
        if (v && v.video_url && (v.video_url.includes('sslip.io') || v.video_url.includes(VOD_BASE_URL))) {
          try {
            await fetch(v.video_url, { method: 'DELETE' });
            console.log(`Đã xóa sạch file trên ổ cứng VPS: ${v.video_url}`);
          } catch (err) {
            console.warn('Không thể xóa file vật lý trên VPS (có thể file không tồn tại):', err);
          }
        }

        // 2. Xóa bản ghi trong database Supabase
        await hardDeleteVideoRecord(id);
        if (v) onVideoUpdated({ ...v, deleted_at: 'permanently_deleted' });
      }

      setSelectedIds([]);
      toast.success(`Đã xóa vĩnh viễn ${targets.length} phim và giải phóng ổ cứng VPS!`);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addVideoUrl.trim()) {
      toast.error('Vui lòng đợi upload phim hoàn tất hoặc dán link phát (.mp4)!');
      return;
    }

    const finalCategory = addCategory.trim() || inlineNewCategory.trim();
    if (!finalCategory) {
      toast.error('Vui lòng chọn hoặc nhập 1 Phân Loại duy nhất cho bộ phim!');
      return;
    }

    if (inlineNewCategory.trim() && onAddTopic) {
      await onAddTopic(inlineNewCategory.trim());
    }

    const validSubs = addSubtitles.filter((s) => s.name.trim() && s.url.trim());
    const defaultSub = validSubs.find((s) => s.default) || validSubs[0];

    setIsSubmitting(true);
    const payload: NewVideoInput = {
      title: addTitle.trim(),
      description: addDescription.trim() || '',
      event_date: addEventDate,
      duration: addDuration.trim() || '00:00:00',
      video_url: addVideoUrl.trim(),
      thumbnail_url: addThumbnailUrl.trim() || undefined,
      tags: [finalCategory],
      subtitle_url: defaultSub?.url || undefined,
      subtitles: validSubs,
    };

    try {
      const created = await createVideoRecord(payload);
      onVideoAdded(created);
      toast.success(`Đã đăng bộ phim "${created.title}" thuộc phân loại "${finalCategory}"!`);

      setAddTitle('');
      setAddVideoUrl('');
      setAddThumbnailUrl('');
      setAddSubtitles([]);
      setUploadedVideoFile(null);
      setUploadProgress(null);
      setAddDescription('');
      setAddCategory('');
      setInlineNewCategory('');
      setActiveVideoFile(null);
      // Sau khi upload/thêm phim thành công: Quay trở lại danh sách phim
      setActiveTab('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideoId) return;

    const finalCategory = editCategory.trim();
    if (!finalCategory) {
      toast.error('Vui lòng chọn 1 Phân Loại duy nhất cho bộ phim!');
      return;
    }

    const validSubs = editSubtitles.filter((s) => s.name.trim() && s.url.trim());
    const defaultSub = validSubs.find((s) => s.default) || validSubs[0];

    setIsSubmitting(true);
    const payload: UpdateVideoInput = {
      id: editingVideoId,
      title: editTitle.trim(),
      description: editDescription.trim() || '',
      event_date: editEventDate,
      duration: editDuration.trim() || '00:00:00',
      video_url: editVideoUrl.trim(),
      thumbnail_url: editThumbnailUrl.trim() || undefined,
      tags: [finalCategory],
      subtitle_url: defaultSub?.url || undefined,
      subtitles: validSubs,
    };

    try {
      const updated = await updateVideoRecord(payload);
      onVideoUpdated(updated);
      toast.success(`Đã cập nhật phim "${updated.title}" với phân loại "${finalCategory}"!`);
      setActiveTab('list');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật phim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // QUẢN LÝ PHÂN LOẠI & THỨ TỰ PHIM (KÉO THẢ)
  // ==============================================================
  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;
    if (customTopics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      toast.warning(`Phân loại "${clean}" đã tồn tại.`);
      return;
    }
    if (onAddTopic) {
      await onAddTopic(clean);
      setNewCategoryName('');
      toast.success(`Đã thêm phân loại "${clean}" thành công!`);
      if (!selectedCatForOrder) {
        setSelectedCatForOrder(clean);
      }
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa phân loại "${cat}"? (Các video thuộc phân loại này vẫn được giữ nguyên đầy đủ)`)) {
      if (onRemoveTopic) {
        await onRemoveTopic(cat);
        toast.success(`Đã xóa phân loại "${cat}".`);
        if (selectedCatForOrder.toLowerCase() === cat.toLowerCase()) {
          setSelectedCatForOrder('');
        }
      }
    }
  };

  // Đồng bộ danh sách phim của phân loại đang được chọn để sắp xếp
  useEffect(() => {
    if (!selectedCatForOrder) {
      if (customTopics.length > 0) {
        setSelectedCatForOrder(customTopics[0]);
      } else {
        setCategoryVideosOrder([]);
        return;
      }
    }

    const targetCat = selectedCatForOrder || customTopics[0];
    const matched = videos
      .filter((v) => !v.deleted_at && (v.tags || []).some((t) => t.toLowerCase() === targetCat.toLowerCase()))
      .sort((a, b) => {
        if (typeof a.sort_order === 'number' && typeof b.sort_order === 'number' && a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;
        const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createA - createB;
      });

    setCategoryVideosOrder(matched);
  }, [selectedCatForOrder, customTopics, videos]);

  const handleAutoSortOldestFirst = () => {
    const sorted = [...categoryVideosOrder].sort((a, b) => {
      const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
      const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createA - createB;
    });
    setCategoryVideosOrder(sorted);
    toast.info('Đã xếp danh sách theo ngày phát hành: Cũ nhất ở trên cùng → Mới nhất ở dưới.');
  };

  const handleMoveMovie = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= categoryVideosOrder.length) return;
    const updated = [...categoryVideosOrder];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setCategoryVideosOrder(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...categoryVideosOrder];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setCategoryVideosOrder(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const handleSaveCategoryOrder = async () => {
    if (categoryVideosOrder.length === 0) return;
    setIsSavingOrder(true);
    try {
      const itemsToUpdate = categoryVideosOrder.map((v, idx) => ({
        id: v.id,
        sort_order: idx + 1,
      }));

      await updateVideoSortOrders(itemsToUpdate);

      // Cập nhật lại state videos trên client
      const updatedAll = videos.map((v) => {
        const found = itemsToUpdate.find((item) => item.id === v.id);
        if (found) return { ...v, sort_order: found.sort_order };
        return v;
      });

      if (onVideosReordered) {
        onVideosReordered(updatedAll);
      }

      toast.success(
        `Đã lưu thứ tự ${categoryVideosOrder.length} tập phim của "${selectedCatForOrder}" thành công!`
      );
    } catch (err: any) {
      toast.error('Lỗi khi lưu thứ tự phim: ' + err.message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // RENDER KHUNG ĐA PHỤ ĐỀ (DÙNG CHUNG CHO CẢ THÊM VÀ SỬA)
  const renderSubtitleManager = (mode: 'add' | 'edit') => {
    const list = mode === 'add' ? addSubtitles : editSubtitles;

    return (
      <div
        className={`p-4 rounded-xl border space-y-3 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-rose-500" />
            <span>Danh Sách Phụ Đề Đa Ngôn Ngữ (.SRT / .VTT)</span>
          </label>

          <button
            type="button"
            onClick={() => handleAddSubtitleTrack(mode)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 text-rose-500 text-xs font-bold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ngôn ngữ</span>
          </button>
        </div>

        {list.length === 0 ? (
          <p className={`text-xs italic py-2 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
            Chưa có phụ đề nào. Bấm "+ Thêm ngôn ngữ" để nạp phụ đề Tiếng Việt, English...
          </p>
        ) : (
          <div className="space-y-2.5">
            {list.map((track, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
                  track.default
                    ? isLight
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-rose-500/40 bg-rose-500/5'
                    : isLight
                    ? 'border-slate-200 bg-white'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {/* Tên ngôn ngữ */}
                <div className="w-full sm:w-36 shrink-0">
                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => handleUpdateTrackField(idx, 'name', e.target.value, mode)}
                    placeholder="VD: Tiếng Việt"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                        : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                    }`}
                  />
                </div>

                {/* Chọn file từ máy */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs font-semibold cursor-pointer shrink-0 hover:bg-rose-500/15">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp file</span>
                  <input
                    type="file"
                    accept=".srt,.vtt,.txt"
                    onChange={(e) => handleSubtitleFileSelectedForTrack(e, idx, mode)}
                    className="hidden"
                  />
                </label>

                {/* Đường link / Data URI */}
                <input
                  type="text"
                  value={track.url}
                  onChange={(e) => handleUpdateTrackField(idx, 'url', e.target.value, mode)}
                  placeholder="Link phụ đề hoặc tự nạp từ file..."
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono truncate focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                  }`}
                />

                {/* Nút đặt làm mặc định */}
                <button
                  type="button"
                  onClick={() => handleUpdateTrackField(idx, 'default', true, mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors ${
                    track.default
                      ? 'bg-rose-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                  }`}
                >
                  {track.default ? '★ Mặc định' : 'Đặt mặc định'}
                </button>

                {/* Nút xóa track */}
                <button
                  type="button"
                  onClick={() => handleRemoveSubtitleTrack(idx, mode)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`w-full min-h-[calc(100vh-3.5rem)] flex flex-col transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* Top Header */}
      <div
        className={`w-full px-4 sm:px-8 py-4 border-b flex items-center justify-between transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
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
                Tải phim, cấu hình đa phụ đề Tiếng Việt / Tiếng Anh, ảnh bìa & thùng rác
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full flex-1 px-4 sm:px-8 py-6">
        {!isAuthenticated ? (
          /* MÀN HÌNH KHÓA PIN */
          <div
            className={`max-w-md mx-auto my-12 p-6 sm:p-8 rounded-2xl border shadow-xl transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                : 'bg-[#141418] border-white/10 text-white shadow-black/40'
            }`}
          >
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">Bảo Mật Quyền Quản Trị</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
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
                  placeholder="Nhập mã PIN..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                      : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                  }`}
                  autoFocus
                />
                {authError && <p className="text-xs text-rose-500 pt-1">{authError}</p>}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onGoHome}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
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
          <div className="w-full space-y-6">
            {/* Tab điều hướng */}
            <div
              className={`p-1.5 rounded-2xl border flex items-center gap-1.5 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                onClick={() => setActiveTab('categories')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>Phân Loại & Thứ Tự Phim</span>
              </button>

              {activeTab === 'edit' && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Đang Chỉnh Sửa Phim</span>
                </button>
              )}
            </div>

            {/* TAB 1: DANH SÁCH PHIM */}
            {activeTab === 'list' && (
              <div
                className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                  isLight ? 'border-slate-200' : 'border-white/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setListFilter('active');
                        setSelectedIds([]);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        listFilter === 'active'
                          ? 'bg-rose-600 text-white'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      Đang hiển thị ({activeVideos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setListFilter('trash');
                        setSelectedIds([]);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        listFilter === 'trash'
                          ? 'bg-amber-600 text-white'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      Thùng rác ({trashedVideos.length})
                    </button>
                  </div>

                  {selectedIds.length > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                      isLight ? 'bg-rose-50 border border-rose-200' : 'bg-white/10'
                    }`}>
                      <span className="text-xs font-bold text-rose-500">
                        Đã chọn {selectedIds.length} phim:
                      </span>
                      {listFilter === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleSoftDelete(selectedIds)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold cursor-pointer"
                        >
                          Xóa tạm đã chọn
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestore(selectedIds)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-semibold cursor-pointer"
                          >
                            Khôi phục đã chọn
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHardDelete(selectedIds)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                          >
                            Xóa hẳn đã chọn
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {currentDisplayList.length > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-1 text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className={`flex items-center gap-1.5 cursor-pointer ${isLight ? 'hover:text-slate-900' : 'hover:text-white'}`}
                    >
                      {selectedIds.length === currentDisplayList.length ? (
                        <CheckSquare className="w-4 h-4 text-rose-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Chọn tất cả ({currentDisplayList.length})</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {currentDisplayList.length === 0 ? (
                    <div className={`text-center py-12 text-xs ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                      Không có bộ phim nào trong danh sách này.
                    </div>
                  ) : (
                    currentDisplayList.map((video) => {
                      const isSelected = selectedIds.includes(video.id);
                      const subCount = video.subtitles?.length || (video.subtitle_url ? 1 : 0);

                      return (
                        <div
                          key={video.id}
                          className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isSelected
                              ? isLight
                                ? 'border-rose-300 bg-rose-50/50'
                                : 'border-rose-500/50 bg-rose-500/5'
                              : isLight
                              ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectItem(video.id)}
                              className={`cursor-pointer shrink-0 ${isLight ? 'text-slate-400 hover:text-slate-900' : 'text-zinc-400 hover:text-white'}`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-500" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="w-32 h-18 rounded-lg overflow-hidden bg-black/40 shrink-0 relative border border-slate-200 dark:border-white/10">
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

                            <div className="min-w-0 space-y-1">
                              <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {video.title}
                              </h3>
                              <div className={`flex flex-wrap items-center gap-3 text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {video.event_date}
                                </span>
                                {subCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                                    <Globe2 className="w-3 h-3" />
                                    <span>{subCount} phụ đề</span>
                                  </span>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {(video.tags || []).map((t) => (
                                    <span
                                      key={t}
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        isLight ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-zinc-300'
                                      }`}
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {listFilter === 'active' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(video)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
                                  }`}
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSoftDelete([video.id])}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa tạm</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestore([video.id])}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-xs font-semibold cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Khôi phục</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleHardDelete([video.id])}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 text-xs font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa hẳn</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: THÊM PHIM MỚI */}
            {activeTab === 'add' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border space-y-6 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className={`pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <h2 className="text-base sm:text-lg font-bold">Tải Lên Phim Mới</h2>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Tải video, chụp ảnh bìa tự động và thiết lập phụ đề đa ngôn ngữ.
                  </p>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-6">
                  {/* Upload video container */}
                  <div
                    className={`p-5 rounded-2xl border-2 border-dashed transition-all ${
                      isLight
                        ? 'border-rose-300 bg-rose-50/40 hover:border-rose-400'
                        : 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60'
                    }`}
                  >
                    {uploadProgress === null && !uploadedVideoFile ? (
                      <div className="text-center py-4">
                        <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold mb-1">Kéo thả hoặc Chọn file Phim (.mp4)</h3>
                        <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          Tự động tải lên VPS, đo thời lượng và chụp ảnh bìa từ video.
                        </p>
                        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md">
                          <Film className="w-4 h-4" />
                          <span>Chọn file video</span>
                          <input type="file" accept="video/mp4" onChange={handleVideoFileSelected} className="hidden" />
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>Đã nạp file: {uploadedVideoFile?.name} ({uploadedVideoFile?.sizeMB} MB)</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-500 dark:text-zinc-400">{uploadSpeed}</span>
                            <span className="text-rose-500 font-mono text-sm">{uploadProgress}%</span>
                            <button
                              type="button"
                              onClick={handleCancelUpload}
                              className="text-zinc-400 hover:text-rose-500 p-0.5 cursor-pointer transition-colors"
                              title="Xóa file vừa nạp để chọn file khác"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-200"
                            style={{ width: `${uploadProgress || 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Tiêu đề Phim *</label>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="Tiêu đề phim..."
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold flex items-center justify-between">
                        <span>Link phát Video (.mp4) *</span>
                        <span className={`text-[10px] font-mono ${addVideoUrl ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {addVideoUrl ? '✓ Link đã sẵn sàng' : 'Đang chờ upload...'}
                        </span>
                      </label>
                      <input
                        type="url"
                        value={addVideoUrl}
                        onChange={(e) => setAddVideoUrl(e.target.value)}
                        placeholder={`${VOD_BASE_URL}/videos/phim.mp4`}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    {/* Vùng Ảnh bìa thông minh */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Ảnh Bìa (Thumbnail)</label>
                        <div className="flex items-center gap-2">
                          {activeVideoFile && (
                            <button
                              type="button"
                              onClick={handleCycleThumbnail}
                              className="text-xs text-rose-500 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                              title="Trích xuất khung hình ở giây khác nếu ảnh hiện tại chưa ưng ý"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Đổi khung hình (+25s)</span>
                            </button>
                          )}
                          <label className="text-xs text-rose-500 hover:underline cursor-pointer flex items-center gap-1 font-medium">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Tải ảnh từ máy</span>
                            <input type="file" accept="image/*" onChange={(e) => handleCustomThumbnailUpload(e, 'add')} className="hidden" />
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {addThumbnailUrl ? (
                          <div className="w-28 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-white/20 shrink-0 relative group">
                            <img src={addThumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-28 h-16 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
                            isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-black/40 border-white/10 text-zinc-500'
                          }`}>
                            Chưa có
                          </div>
                        )}
                        <input
                          type="text"
                          value={addThumbnailUrl}
                          onChange={(e) => setAddThumbnailUrl(e.target.value)}
                          placeholder="Link ảnh bìa hoặc tự động trích xuất từ video..."
                          className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
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
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Thời lượng (Tự đo)</label>
                        <input
                          type="text"
                          value={addDuration}
                          onChange={(e) => setAddDuration(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* KHUNG ĐA PHỤ ĐỀ (MULTI-SUBTITLES) */}
                  {renderSubtitleManager('add')}

                  {/* VÙNG PHÂN LOẠI (CHỌN DUY NHẤT 1 PHÂN LOẠI) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-rose-500">
                          Phân Loại Phim (Mỗi bộ phim chỉ thuộc 1 phân loại duy nhất) *
                        </label>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                          Gom các tập phim vào cùng một chuỗi để phát liền mạch (VD: Harry Potter, Stranger Things Mùa 1...)
                        </p>
                      </div>
                      <span className={`text-[11px] font-semibold ${addCategory ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {addCategory ? `✓ Đang chọn: ${addCategory}` : 'Chưa chọn phân loại'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {customTopics.map((topic) => {
                        const isSelected = addCategory.toLowerCase() === topic.toLowerCase();
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => {
                              setAddCategory(topic);
                              setInlineNewCategory('');
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {topic}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tạo nhanh phân loại mới nếu chưa có */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={inlineNewCategory}
                        onChange={(e) => setInlineNewCategory(e.target.value)}
                        placeholder="+ Hoặc nhập phân loại mới (VD: Stranger Things Mùa 1)..."
                        className={`flex-1 max-w-md px-3.5 py-2 rounded-xl border text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                      />
                      {inlineNewCategory.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            const clean = inlineNewCategory.trim();
                            if (clean) {
                              setAddCategory(clean);
                              toast.info(`Đã chọn phân loại mới: "${clean}"`);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-500"
                        >
                          Chọn phân loại này
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">Mô tả bộ phim</label>
                    <textarea
                      rows={3}
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder="Mô tả nội dung phim, các mốc thời gian nổi bật (VD: 01:25 - Mở đầu)..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                          : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                      }`}
                    />
                  </div>

                  {/* Nút Submit */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !addVideoUrl.trim() || (uploadProgress !== null && uploadProgress < 100)}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? 'Đang lưu vào Supabase...'
                        : !addVideoUrl.trim()
                        ? 'Chờ tải phim xong...'
                        : 'Lưu & Đăng Lên Rạp Phim'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: CHỈNH SỬA PHIM HIỆN CÓ (EDIT FORM) */}
            {activeTab === 'edit' && (
              <div
                className={`p-6 sm:p-8 rounded-2xl border space-y-6 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
                }`}
              >
                <div className={`flex items-center justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">Cập Nhật Thông Tin Phim</h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Chỉnh sửa tiêu đề, phân loại, nạp thêm phụ đề đa ngôn ngữ hoặc thay đổi ảnh bìa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Hủy bỏ
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Tiêu đề Phim *</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold">Link phát Video (.mp4) *</label>
                      <input
                        type="url"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                            : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                        }`}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Ảnh Bìa (Thumbnail)</label>
                        <label className="text-xs text-rose-500 hover:underline cursor-pointer flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Tải ảnh từ máy</span>
                          <input type="file" accept="image/*" onChange={(e) => handleCustomThumbnailUpload(e, 'edit')} className="hidden" />
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        {editThumbnailUrl ? (
                          <div className="w-24 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-white/20 shrink-0">
                            <img src={editThumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-24 h-14 rounded-lg flex items-center justify-center text-xs shrink-0 border ${
                            isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-black/40 border-white/10 text-zinc-500'
                          }`}>
                            Chưa có
                          </div>
                        )}
                        <input
                          type="text"
                          value={editThumbnailUrl}
                          onChange={(e) => setEditThumbnailUrl(e.target.value)}
                          className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold">Ngày phát hành</label>
                        <input
                          type="date"
                          value={editEventDate}
                          onChange={(e) => setEditEventDate(e.target.value)}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
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
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                              : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* KHUNG ĐA PHỤ ĐỀ TRONG FORM SỬA */}
                  {renderSubtitleManager('edit')}

                  {/* PHÂN LOẠI DUY NHẤT TRONG FORM SỬA */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-rose-500">
                        Phân Loại Của Phim (Chọn 1 phân loại duy nhất) *
                      </label>
                      <span className={`text-[11px] font-semibold ${editCategory ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {editCategory ? `✓ Đang chọn: ${editCategory}` : 'Chưa chọn phân loại'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {customTopics.map((topic) => {
                        const isSelected = editCategory.toLowerCase() === topic.toLowerCase();
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setEditCategory(topic)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                              isSelected
                                ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/50'
                                : isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                : 'bg-white/10 hover:bg-white/15 text-zinc-300'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}
                            {topic}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold">Mô tả phim</label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                          : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? 'Đang lưu thay đổi...' : 'Lưu Thay Đổi Phim'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: QUẢN LÝ PHÂN LOẠI & THỨ TỰ PHIM (KÉO THẢ) */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                {/* 1. QUẢN LÝ DANH MỤC PHÂN LOẠI */}
                <div
                  className={`p-6 sm:p-8 rounded-2xl border space-y-5 transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
                  }`}
                >
                  <div>
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <FolderPlus className="w-5 h-5 text-rose-500" />
                      <span>Danh Mục Phân Loại Hệ Thống</span>
                    </h2>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                      Mỗi phân loại đại diện cho một bộ phim/series hoàn chỉnh (VD: Harry Potter, Stranger Things Mùa 1, Gala Dinner...).
                    </p>
                  </div>

                  {/* Form thêm phân loại mới */}
                  <form onSubmit={handleAddNewCategory} className="flex items-center gap-2 max-w-xl">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nhập tên phân loại mới (VD: Stranger Things Mùa 1)..."
                      className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none transition-colors ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                          : 'bg-[#1a1a20] border-white/15 text-white focus:border-rose-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!newCategoryName.trim()}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Phân Loại</span>
                    </button>
                  </form>

                  {/* Danh sách phân loại hiện tại */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400">
                      Danh sách phân loại ({customTopics.length}):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {customTopics.map((cat) => {
                        const count = videos.filter(
                          (v) => !v.deleted_at && (v.tags || []).some((t) => t.toLowerCase() === cat.toLowerCase())
                        ).length;
                        const isSelectedForOrder = selectedCatForOrder.toLowerCase() === cat.toLowerCase();

                        return (
                          <div
                            key={cat}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              isSelectedForOrder
                                ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-500/10'
                                : isLight
                                ? 'border-slate-200 bg-slate-50'
                                : 'border-white/10 bg-white/[0.02]'
                            }`}
                          >
                            <div
                              onClick={() => setSelectedCatForOrder(cat)}
                              className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                              title="Bấm để chọn sắp xếp thứ tự phim cho phân loại này"
                            >
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                              <span className="text-xs font-bold truncate">{cat}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-mono font-semibold shrink-0">
                                {count} phim
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-zinc-400 hover:text-rose-500 p-1 rounded-md cursor-pointer shrink-0 transition-colors"
                              title={`Xóa phân loại "${cat}" (Phim vẫn được giữ nguyên)`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. SẮP XẾP THỨ TỰ PHIM TRONG PHÂN LOẠI (KÉO THẢ TỪ TRÊN XUỐNG DƯỚI) */}
                <div
                  className={`p-6 sm:p-8 rounded-2xl border space-y-5 transition-colors ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-rose-500" />
                        <span>Sắp Xếp Thứ Tự Phim (Từ Cũ Nhất Đến Mới Nhất)</span>
                      </h2>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                        Kéo thả trực tiếp hoặc dùng nút mũi tên để xếp phim từ Tập 1 (trên cùng) xuống Tập cuối (dưới cùng).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleAutoSortOldestFirst}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                        }`}
                        title="Tự động xếp theo ngày phát hành từ cũ nhất ở trên xuống mới nhất ở dưới"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                        <span>Xếp Tự Động: Cũ → Mới</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveCategoryOrder}
                        disabled={isSavingOrder || categoryVideosOrder.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-40"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingOrder ? 'Đang lưu...' : 'Lưu Thứ Tự Phim'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Chọn phân loại để sắp xếp */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold shrink-0">Chọn Phân Loại:</span>
                    <div className="flex flex-wrap gap-2">
                      {customTopics.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCatForOrder(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedCatForOrder.toLowerCase() === cat.toLowerCase()
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-white/5 hover:bg-white/10 text-zinc-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Danh sách phim kéo thả */}
                  {categoryVideosOrder.length === 0 ? (
                    <div className={`text-center py-12 rounded-xl border border-dashed text-xs ${
                      isLight ? 'border-slate-300 text-slate-400' : 'border-white/10 text-zinc-500'
                    }`}>
                      Chưa có bộ phim nào thuộc phân loại &quot;{selectedCatForOrder || 'này'}&quot;.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryVideosOrder.map((film, index) => (
                        <div
                          key={film.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={handleDrop}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${
                            draggedIndex === index
                              ? 'opacity-40 border-rose-500'
                              : isLight
                              ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                              : 'bg-[#18181c] hover:bg-white/[0.05] border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Grip drag handle icon */}
                            <GripVertical className="w-4 h-4 text-zinc-400 shrink-0 cursor-grab" />

                            {/* Badge thứ tự Tập */}
                            <span className="w-14 h-7 rounded-md bg-rose-600/15 text-rose-500 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                              Tập {index + 1}
                            </span>

                            {/* Thumbnail */}
                            <div className="w-20 h-12 rounded-md overflow-hidden bg-black/40 shrink-0 border border-slate-200 dark:border-white/10">
                              {film.thumbnail_url ? (
                                <img src={film.thumbnail_url} alt={film.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                  <Film className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            {/* Title & Metadata */}
                            <div className="min-w-0">
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {film.title}
                              </h4>
                              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                                Ngày: {film.event_date} {film.duration && `• Thời lượng: ${film.duration}`}
                              </p>
                            </div>
                          </div>

                          {/* Quick Up/Down buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveMovie(index, index - 1)}
                              disabled={index === 0}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                isLight
                                  ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                                  : 'border-white/15 hover:bg-white/10 text-white'
                              }`}
                              title="Di chuyển lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMovie(index, index + 1)}
                              disabled={index === categoryVideosOrder.length - 1}
                              className={`p-1.5 rounded-lg border text-xs cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                isLight
                                  ? 'border-slate-300 hover:bg-slate-200 text-slate-700'
                                  : 'border-white/15 hover:bg-white/10 text-white'
                              }`}
                              title="Di chuyển xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SQL instruction tip */}
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                  }`}>
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <span>💡 Lệnh SQL trên Supabase (nếu bảng videos chưa có cột sort_order):</span>
                    </div>
                    <code className="block p-2 rounded bg-black/10 dark:bg-black/40 font-mono text-[11px] select-all">
                      ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
                    </code>
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
