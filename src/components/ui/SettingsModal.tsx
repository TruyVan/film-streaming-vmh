import React from 'react';
import {
  X,
  Settings,
  Monitor,
  Palette,
  Presentation,
  Sun,
  Moon,
  Key,
  Check,
  Sparkles,
} from 'lucide-react';
import { ThemeMode, UITheme } from '../../types/video';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: UITheme;
  onChangeTheme: (theme: UITheme) => void;
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
  onOpenAdmin: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onChangeTheme,
  themeMode,
  onToggleThemeMode,
  onOpenAdmin,
}) => {
  if (!isOpen) return null;

  const isLight = themeMode === 'light';

  const themes: {
    id: UITheme;
    name: string;
    badge: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    previewBg: string;
  }[] = [
    {
      id: 'default',
      name: 'Mặc định (YouTube Style)',
      badge: 'Chuẩn',
      description:
        'Lưới video Bento Grid trang chủ, danh sách phát Up-Next bên phải và trình phát video YouTube sắc nét.',
      icon: Monitor,
      accentColor: 'from-rose-500 to-red-600',
      previewBg: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    },
    {
      id: 'canva',
      name: 'Canva Design',
      badge: 'Mới',
      description:
        'Giao diện thiết kế Canva với dải màu gradient tím-xanh, khung player nằm gọn trong slide canvas và filmstrip các tập phim.',
      icon: Palette,
      accentColor: 'from-[#00c4cc] to-[#7d2ae8]',
      previewBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    {
      id: 'powerpoint',
      name: 'Microsoft PowerPoint',
      badge: 'Office 365',
      description:
        'Giao diện trình chiếu PowerPoint Web với thanh Ribbon, danh sách slide bên trái và chế độ trình chiếu slide show.',
      icon: Presentation,
      accentColor: 'from-[#D83B01] to-[#EA6100]',
      previewBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-150 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-[#18181c] border-white/10 text-zinc-100 shadow-black/80'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
            isLight
              ? 'border-slate-200 bg-slate-50/80'
              : 'border-white/[0.08] bg-[#141418]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <span>Cài Đặt Hệ Thống</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p
                className={`text-xs ${
                  isLight ? 'text-slate-500' : 'text-zinc-400'
                }`}
              >
                Tùy chỉnh giao diện hiển thị, chế độ màu và quản trị
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại cài đặt"
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. CHỌN GIAO DIỆN HIỂN THỊ (3 THEMES) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Giao diện hiển thị trang web:</span>
              </label>
              <span className="text-[11px] opacity-60">3 phong cách</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                const Icon = t.icon;

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onChangeTheme(t.id);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                      isSelected
                        ? isLight
                          ? 'border-rose-500 bg-rose-50/60 shadow-xs ring-2 ring-rose-400/40'
                          : 'border-rose-500 bg-rose-500/10 shadow-xs ring-2 ring-rose-500/40'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? `bg-gradient-to-br ${t.accentColor} text-white border-transparent shadow-sm`
                          : t.previewBg
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold">{t.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-rose-600 text-white'
                              : isLight
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isLight ? 'text-slate-600' : 'text-zinc-400'
                        }`}
                      >
                        {t.description}
                      </p>
                    </div>

                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : isLight
                            ? 'border-slate-300 bg-white'
                            : 'border-white/20 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CHẾ ĐỘ MÀU SÁNG / TỐI */}
          <div className="space-y-3 pt-3 border-t border-black/5 dark:border-white/5">
            <label className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              <span>Chế độ màu giao diện:</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isLight) onToggleThemeMode();
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold cursor-pointer transition-all ${
                  isLight
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                    : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.06]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Giao diện Sáng (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isLight) onToggleThemeMode();
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold cursor-pointer transition-all ${
                  !isLight
                    ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/40 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Giao diện Tối (Dark)</span>
              </button>
            </div>
          </div>

          {/* 3. KHU VỰC QUẢN TRỊ KỸ THUẬT (DEV PORTAL) */}
          <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
            <label className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Quản trị viên & Kỹ thuật:</span>
            </label>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer transition-all ${
                isLight
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border-amber-500/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                  <Key className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Quản Trị Rạp Phim (Dev Portal)</div>
                  <div className="text-[11px] font-normal opacity-75">
                    Tải phim lên VPS, sửa phân loại, sắp xếp tập và thùng rác
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                Mở portal →
              </span>
            </button>
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
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
