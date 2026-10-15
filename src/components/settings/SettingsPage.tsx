import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings,
  Palette,
  Key,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Presentation,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Trash2,
  HardDrive,
  Globe,
  Film,
} from 'lucide-react';
import { ThemeMode, UITheme, Video } from '../../types/video';
import { AdminDevPortal } from '../ui/AdminDevPortal';
import { toast } from 'react-toastify';

export type SettingsSubTab = 'general' | 'theme' | 'admin';

interface SettingsPageProps {
  initialSubTab?: SettingsSubTab;
  currentTheme: UITheme;
  onChangeTheme: (theme: UITheme) => void;
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
  videos: Video[];
  customTopics: string[];
  isLoading?: boolean;
  onVideoAdded: (video: Video) => void;
  onVideoUpdated: (video: Video) => void;
  onAddTopic?: (topic: string) => Promise<void> | void;
  onRemoveTopic?: (topic: string) => Promise<void> | void;
  onRenameTopic?: (oldName: string, newName: string) => Promise<void> | void;
  onVideosReordered?: (updatedVideos: Video[]) => void;
  onGoHome: () => void;
  onNavigateSubTab: (subTab: SettingsSubTab) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  initialSubTab = 'general',
  currentTheme,
  onChangeTheme,
  themeMode,
  onToggleThemeMode,
  videos,
  customTopics,
  isLoading = false,
  onVideoAdded,
  onVideoUpdated,
  onAddTopic,
  onRemoveTopic,
  onRenameTopic,
  onVideosReordered,
  onGoHome,
  onNavigateSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const isLight = themeMode === 'light';

  const handleTabClick = (tab: SettingsSubTab) => {
    setActiveSubTab(tab);
    onNavigateSubTab(tab);
  };

  const themes: {
    id: UITheme;
    name: string;
    badge: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    previewBg: string;
    features: string[];
  }[] = [
    {
      id: 'default',
      name: 'Mặc định (YouTube Style)',
      badge: 'Chuẩn YouTube',
      description:
        'Lưới video Bento Grid trang chủ, danh sách phát Up-Next bên phải và trình phát video YouTube sắc nét.',
      icon: Monitor,
      accentColor: 'from-rose-500 to-red-600',
      previewBg: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
      features: [
        'Lưới Bento Grid & Compact History Rows',
        'Cột Up-Next Danh sách phát bên phải',
        'Player YouTube với vạch đỏ Zero-Lag Scrubbing',
      ],
    },
    {
      id: 'canva',
      name: 'Canva Design & Education',
      badge: 'Canva Mockup',
      description:
        'Giao diện thiết kế Canva với dải màu gradient tím-xanh, đầy đủ thanh công cụ CanvaToolbar, CanvaSidebar, khung player nằm gọn trong slide canvas 16:9 và filmstrip các tập phim.',
      icon: Palette,
      accentColor: 'from-[#00c4cc] to-[#7d2ae8]',
      previewBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      features: [
        'Canva TopNav gradient tím-xanh & thanh công cụ CanvaToolbar',
        'Khung Player nằm vừa vặn bên trong Slide Canvas 16:9',
        'Filmstrip chân trang hiển thị chuỗi tập phim cùng phân loại',
      ],
    },
    {
      id: 'powerpoint',
      name: 'Microsoft PowerPoint Web',
      badge: 'Office 365',
      description:
        'Giao diện trình chiếu PowerPoint Web hoàn chỉnh với thanh tiêu đề đỏ/cam (#D83B01), dải lệnh Ribbon (Home, Insert, Slide Show...), danh sách slide thumbnails bên trái và khung slide player.',
      icon: Presentation,
      accentColor: 'from-[#D83B01] to-[#EA6100]',
      previewBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      features: [
        'Dải lệnh Ribbon Office 365 (Home, Insert, Slide Show...)',
        'Cột SlideThumbnails bên trái hiển thị danh sách tập phim',
        'Khung Player đặt vừa khít trong Slide Canvas và ngăn Notes bên dưới',
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* 1. TOP HEADER OF SETTINGS PAGE */}
      <header
        className={`sticky top-0 z-40 w-full h-14 px-4 sm:px-8 border-b flex items-center justify-between transition-colors backdrop-blur-md ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-xs'
            : 'bg-[#141418]/95 border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về rạp phim</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Cài Đặt Hệ Thống</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-500/15 text-rose-500 font-bold uppercase">
                  {activeSubTab === 'admin'
                    ? 'Admin Dev Portal'
                    : activeSubTab === 'theme'
                    ? 'Giao diện'
                    : 'Chung'}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Quick theme mode toggle on top */}
        <button
          type="button"
          onClick={onToggleThemeMode}
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border transition-colors cursor-pointer ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
              : 'bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10'
          }`}
          title={isLight ? 'Chuyển sang giao diện Tối' : 'Chuyển sang giao diện Sáng'}
        >
          {isLight ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Giao diện Sáng</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Giao diện Tối</span>
            </>
          )}
        </button>
      </header>

      {/* 2. SUB-NAVIGATION TABS (SLUG BAR: /settings/general, /settings/theme, /settings/admin) */}
      <div
        className={`w-full px-4 sm:px-8 border-b flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 transition-colors ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#18181c] border-white/[0.06]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleTabClick('general')}
          className={`h-11 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'general'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cài Đặt Chung (/settings/general)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('theme')}
          className={`h-11 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'theme'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Đổi Giao Diện (/settings/theme)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-500 font-mono">
            3 Theme
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('admin')}
          className={`h-11 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'admin'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          <span>Quản Trị Phim (/settings/admin)</span>
        </button>
      </div>

      {/* 3. CONTENT AREA ACCORDING TO ACTIVE SUB-TAB */}
      <div className="flex-1 w-full">
        {/* TAB 1: CÀI ĐẶT CHUNG (/settings/general) */}
        {activeSubTab === 'general' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-in fade-in duration-150">
            {/* Chế độ màu Sáng / Tối */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Chế Độ Màu Giao Diện (Theme Mode)</span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Lựa chọn tông màu hiển thị phù hợp với môi trường ánh sáng của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLight) onToggleThemeMode();
                  }}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isLight
                      ? 'border-amber-500 bg-amber-500/10 text-amber-900 ring-2 ring-amber-400/40 shadow-xs'
                      : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Giao diện Sáng (Light)</div>
                      <div className="text-[11px] opacity-75">Tông màu dịu mắt ban ngày</div>
                    </div>
                  </div>
                  {isLight && <Check className="w-5 h-5 text-amber-600 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isLight) onToggleThemeMode();
                  }}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    !isLight
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">Giao diện Tối (Dark)</div>
                      <div className="text-[11px] opacity-75">Độ tương phản cao cho ban đêm</div>
                    </div>
                  </div>
                  {!isLight && <Check className="w-5 h-5 text-purple-400 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* Dọn dẹp bộ nhớ đệm */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-rose-500" />
                  <span>Bộ Nhớ Đệm Trình Duyệt (LocalStorage)</span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Xóa lịch sử xem phim và tiến trình xem tạm thời trên trình duyệt này nếu cần giải phóng.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">
                  Dữ liệu phim chính thức trên Supabase sẽ không bị ảnh hưởng.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa sạch bộ nhớ tạm tiến trình xem phim trên máy này?')) {
                      try {
                        const toRemove: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const k = localStorage.key(i);
                          if (k && (k.startsWith('film_progress_') || k.startsWith('partystream_progress_'))) {
                            toRemove.push(k);
                          }
                        }
                        toRemove.forEach((k) => localStorage.removeItem(k));
                        toast.success('Đã xóa sạch bộ nhớ tạm tiến trình xem!');
                      } catch {}
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dọn dẹp tiến trình xem</span>
                </button>
              </div>
            </div>

            {/* Thông tin hệ thống */}
            <div
              className={`p-6 rounded-2xl border space-y-3 transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#141418] border-white/10 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Thông Tin Nền Tảng Film Streaming</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <div className="text-[11px] opacity-60">Phiên bản</div>
                  <div className="font-mono font-bold">v2.4.0 Multi-Theme</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-60">Động cơ Video</div>
                  <div className="font-mono font-bold">ArtPlayer 5.4.0</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-60">Cơ sở dữ liệu</div>
                  <div className="font-mono font-bold">Supabase PostgreSQL</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-60">Máy chủ VoD</div>
                  <div className="font-mono font-bold">Oracle Cloud VPS</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐỔI GIAO DIỆN HIỂN THỊ (/settings/theme) */}
        {activeSubTab === 'theme' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-500" />
                <span>Lựa Chọn Giao Diện Hiển Thị</span>
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Trải nghiệm 3 phong cách hiển thị độc quyền. Bấm vào bất kỳ giao diện nào để áp dụng tức thì.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {themes.map((t) => {
                const isSelected = currentTheme === t.id;
                const Icon = t.icon;

                return (
                  <div
                    key={t.id}
                    onClick={() => onChangeTheme(t.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? isLight
                          ? 'border-rose-500 bg-rose-50/60 shadow-md ring-2 ring-rose-400/50'
                          : 'border-rose-500 bg-rose-500/10 shadow-md ring-2 ring-rose-500/50'
                        : isLight
                        ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        : 'border-white/10 bg-[#141418] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? `bg-gradient-to-br ${t.accentColor} text-white border-transparent shadow-md`
                            : t.previewBg
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold">{t.name}</h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
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
                        <p className={`text-xs leading-relaxed max-w-xl ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                          {t.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {t.features.map((feat, fi) => (
                            <span
                              key={fi}
                              className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-zinc-400'
                              }`}
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Đang kích hoạt</span>
                          </>
                        ) : (
                          <span>Áp dụng</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN TRỊ DEV PORTAL (/settings/admin) */}
        {activeSubTab === 'admin' && (
          <div className="w-full">
            <AdminDevPortal
              themeMode={themeMode}
              videos={videos}
              customTopics={customTopics}
              isLoading={isLoading}
              onVideoAdded={onVideoAdded}
              onVideoUpdated={onVideoUpdated}
              onAddTopic={onAddTopic}
              onRemoveTopic={onRemoveTopic}
              onRenameTopic={onRenameTopic}
              onVideosReordered={onVideosReordered}
              onGoHome={onGoHome}
            />
          </div>
        )}
      </div>
    </div>
  );
};
export default SettingsPage;
