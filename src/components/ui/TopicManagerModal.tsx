import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ThemeMode, Video } from '../../types/video';

interface TopicManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: string[];
  allVideos: Video[];
  themeMode: ThemeMode;
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
  onResetTopics: () => void;
}

export const TopicManagerModal: React.FC<TopicManagerModalProps> = ({
  isOpen,
  onClose,
  topics,
  allVideos,
  themeMode,
  onAddTopic,
  onRemoveTopic,
  onResetTopics,
}) => {
  const [newTopicName, setNewTopicName] = useState('');

  if (!isOpen) return null;

  const isLight = themeMode === 'light';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTopicName.trim();
    if (!clean) return;

    if (topics.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Chủ đề "${clean}" đã tồn tại.`);
      return;
    }

    onAddTopic(clean);
    setNewTopicName('');
    toast.success(`Đã thêm chủ đề "${clean}" thành công.`);
  };

  const handleRemove = (topic: string) => {
    onRemoveTopic(topic);
    toast.success(`Đã xóa chủ đề "${topic}". Các video vẫn được giữ nguyên.`);
  };

  const handleReset = () => {
    onResetTopics();
    toast.success('Đã khôi phục danh mục chủ đề về mặc định.');
  };

  // Count videos per topic
  const getVideoCountForTopic = (topic: string) => {
    return allVideos.filter((v) =>
      v.tags?.some((t) => t.toLowerCase() === topic.toLowerCase())
    ).length;
  };

  return (
    <div className="fixed inset-0 z-[45000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#18181c] border-white/10 text-zinc-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isLight
              ? 'border-slate-200 bg-slate-50/80'
              : 'border-white/[0.08] bg-[#141418]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold">
                Cấu hình phân loại chủ đề
              </h2>
              <p
                className={`text-xs ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}
              >
                Quản lý các danh mục phân loại video sự kiện
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Reassurance Warning Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-amber-950/25 border-amber-500/30 text-amber-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">
                Quy tắc an toàn:
              </strong>
              <span>
                Xóa chủ đề <strong>sẽ không xóa bất kỳ video nào</strong>. Toàn
                bộ video vẫn được giữ nguyên đầy đủ trong hệ thống và bạn luôn có
                thể xem tại mục &quot;Tất cả&quot;.
              </span>
            </div>
          </div>

          {/* Add New Topic Form */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="block text-xs font-semibold">
              Thêm chủ đề phân loại mới:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => {
                  setNewTopicName(e.target.value);
                }}
                placeholder="VD: Hội thao, Sinh nhật công ty, Workshop..."
                className={`flex-1 h-10 px-3.5 rounded-xl text-sm transition-colors focus:outline-none ${
                  isLight
                    ? 'bg-slate-100 border border-slate-300 text-slate-900 focus:border-rose-500'
                    : 'bg-[#222228] border border-white/10 text-white placeholder:text-zinc-500 focus:border-rose-500'
                }`}
              />
              <button
                type="submit"
                disabled={!newTopicName.trim()}
                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm</span>
              </button>
            </div>
          </form>

          {/* Current Topics List */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Danh sách chủ đề hiện tại ({topics.length}):</span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-rose-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                title="Khôi phục danh mục chủ đề gốc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {topics.map((topic) => {
                const count = getVideoCountForTopic(topic);
                return (
                  <div
                    key={topic}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-200/90'
                        : 'bg-[#222228]/80 border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {topic}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                          isLight
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-white/10 text-zinc-300'
                        }`}
                      >
                        {count} video
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(topic)}
                      aria-label={`Xóa chủ đề ${topic}`}
                      title={`Xóa chủ đề "${topic}" (Không làm mất video)`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-end ${
            isLight
              ? 'border-slate-200 bg-slate-50/80'
              : 'border-white/[0.08] bg-[#141418]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-white text-slate-950 hover:bg-zinc-200'
            }`}
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
