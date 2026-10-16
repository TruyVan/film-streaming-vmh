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
  Info,
  Trash2,
  HardDrive,
  Smartphone,
} from 'lucide-react';
import { ThemeMode, UITheme, Video } from '../../types/video';
import { AdminDevPortal } from '../ui/AdminDevPortal';
import { toast } from 'react-toastify';

export type SettingsSubTab = 'general' | 'admin';

interface SettingsPageProps {
  initialSubTab?: 'general' | 'theme' | 'admin';
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
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(
    initialSubTab === 'admin' ? 'admin' : 'general'
  );

  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setActiveSubTab(initialSubTab === 'admin' ? 'admin' : 'general');
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
      name: 'Canva Design & Education',
      badge: 'Canva Mockup',
      description:
        'Giao diện thiết kế Canva với dải màu gradient tím-xanh, đầy đủ thanh công cụ CanvaToolbar, CanvaSidebar, khung player nằm gọn trong slide canvas 16:9 và filmstrip các tập phim.',
      icon: Palette,
      accentColor: 'from-[#00c4cc] to-[#7d2ae8]',
      previewBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    {
      id: 'powerpoint',
      name: 'Microsoft PowerPoint Web',
      badge: 'Office 365',
      description:
        'Giao diện trình chiếu PowerPoint Web hoàn chỉnh với thanh tiêu đề đỏ/cam (#D83B01), dải lệnh Ribbon, danh sách slide thumbnails bên trái và khung slide player.',
      icon: Presentation,
      accentColor: 'from-[#D83B01] to-[#EA6100]',
      previewBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    },
  ];

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-150 ${
        isLight ? 'bg-[#FAF7F9] text-slate-900' : 'bg-[#0f0f0f] text-zinc-100'
      }`}
    >
      {/* 1. TOP HEADER: Tinh giản, chỉ icon quay về và tiêu đề Cài Đặt Hệ Thống */}
      <header
        className={`sticky top-0 z-40 w-full h-14 px-4 sm:px-8 border-b flex items-center justify-between transition-colors backdrop-blur-md ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-xs'
            : 'bg-[#141418]/95 border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Nút Về rạp phim: Chỉ hiển thị icon tròn gọn gàng */}
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Về rạp phim"
            title="Về rạp phim"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-white/10 hover:bg-white/15 text-zinc-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-bold">Cài Đặt Hệ Thống</h1>
          </div>
        </div>

        {/* Header phải để trống tối giản */}
        <div className="w-9" />
      </header>

      {/* 2. SUB-NAVIGATION TABS: Tinh gọn chỉ còn 2 tab, sửa lỗi hover biến mất chữ ở giao diện sáng */}
      <div
        className={`w-full px-4 sm:px-8 border-b flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181c] border-white/[0.06]'
        }`}
      >
        <button
          type="button"
          onClick={() => handleTabClick('general')}
          className={`h-11 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'general'
              ? isLight
                ? 'border-rose-600 text-rose-600'
                : 'border-rose-500 text-rose-400'
              : isLight
              ? 'border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
              : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cài Đặt Chung</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('admin')}
          className={`h-11 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'admin'
              ? isLight
                ? 'border-rose-600 text-rose-600'
                : 'border-rose-500 text-rose-400'
              : isLight
              ? 'border-transparent text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
              : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          <span>Quản Trị Phim</span>
        </button>
      </div>

      {/* 3. CONTENT AREA */}
      <div className="flex-1 w-full">
        {/* TAB 1: CÀI ĐẶT CHUNG (Bao gồm Đổi Theme, Sáng/Tối, Cache, Stats) */}
        {activeSubTab === 'general' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-in fade-in duration-150">
            {/* 1. Lựa chọn Giao Diện Hiển Thị */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  <span>Giao Diện Hiển Thị</span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Lựa chọn 1 trong 3 phong cách hiển thị độc quyền.
                </p>
              </div>

              {/* Thông báo khóa theme trên Mobile */}
              {isMobileDevice && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Giao diện Canva và PowerPoint được thiết kế chuyên biệt cho máy tính / màn hình lớn. Trên thiết bị di động, hệ thống tự động khóa ở giao diện Mặc định để bạn xem phim tốt nhất.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-1">
                {themes.map((t) => {
                  const isSelected = currentTheme === t.id;
                  const Icon = t.icon;
                  const isLockedOnMobile = isMobileDevice && t.id !== 'default';

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (isLockedOnMobile) {
                          toast.info('Giao diện này chỉ hỗ trợ trên máy tính/màn hình lớn.');
                          return;
                        }
                        onChangeTheme(t.id);
                      }}
                      className={`p-4 rounded-xl border transition-all select-none flex items-center justify-between gap-4 ${
                        isLockedOnMobile
                          ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-dashed'
                          : 'cursor-pointer'
                      } ${
                        isSelected
                          ? isLight
                            ? 'border-rose-500 bg-rose-50/60 shadow-xs ring-2 ring-rose-400/40'
                            : 'border-rose-500 bg-rose-500/10 shadow-xs ring-2 ring-rose-500/40'
                          : isLight
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? `bg-gradient-to-br ${t.accentColor} text-white border-transparent shadow-sm`
                              : t.previewBg
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate">{t.name}</span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold shrink-0 ${
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
                          <p className={`text-xs truncate ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
                            {t.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
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

            {/* 2. Chế độ màu Sáng / Tối */}
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <div>
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Chế Độ Màu (Theme Mode)</span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Lựa chọn tông màu sáng hoặc tối theo sở thích.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLight) onToggleThemeMode();
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isLight
                      ? 'border-amber-500 bg-amber-500/10 text-amber-900 ring-2 ring-amber-400/40 shadow-xs'
                      : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs sm:text-sm">Giao diện Sáng (Light)</div>
                    </div>
                  </div>
                  {isLight && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isLight) onToggleThemeMode();
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    !isLight
                      ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs sm:text-sm">Giao diện Tối (Dark)</div>
                    </div>
                  </div>
                  {!isLight && <Check className="w-4 h-4 text-purple-400 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* 3. Dọn dẹp bộ nhớ đệm */}
            <div
              className={`p-6 rounded-2xl border space-y-3 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#141418] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-rose-500" />
                    <span>Bộ Nhớ Đệm Trình Duyệt</span>
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Xóa sạch tiến trình xem phim tạm thời trên trình duyệt máy này.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn xóa sạch tiến trình xem tạm thời trên máy này?')) {
                      try {
                        const toRemove: string[] = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const k = localStorage.key(i);
                          if (k && (k.startsWith('film_progress_') || k.startsWith('partystream_progress_'))) {
                            toRemove.push(k);
                          }
                        }
                        toRemove.forEach((k) => localStorage.removeItem(k));
                        toast.success('Đã xóa sạch tiến trình xem!');
                      } catch {}
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dọn dẹp</span>
                </button>
              </div>
            </div>

            {/* 4. Thông tin hệ thống */}
            <div
              className={`p-6 rounded-2xl border space-y-2 transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#141418] border-white/10 text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Info className="w-4 h-4 text-blue-500" />
                <span>Thông Tin Nền Tảng</span>
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

        {/* TAB 2: QUẢN TRỊ DEV PORTAL */}
        {activeSubTab === 'admin' && (
          <div className="w-full">
            <AdminDevPortal
              themeMode={themeMode}
              videos={videos}
              customTopics={customTopics}
              isLoading={isLoading}
              hideHeader={true}
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
