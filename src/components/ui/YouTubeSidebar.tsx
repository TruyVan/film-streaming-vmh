import React, { useEffect } from 'react';
import {
  Home,
  Bookmark,
  History,
  X,
  Key,
  SlidersHorizontal,
  FolderHeart,
} from 'lucide-react';
import { PlaylistTab, ThemeMode } from '../../types/video';
import { ThemeSwitch } from './ThemeSwitch';

interface YouTubeSidebarProps {
  isOpen: boolean;
  currentPage: 'home' | 'watch' | 'admin';
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
  playlistTab: PlaylistTab;
  activeCategory: string;
  favoritesCount: number;
  historyCount: number;
  customTopics?: string[];
  onOpenTopicManager?: () => void;
  onSelectHomeTab: (tab: PlaylistTab, category?: string) => void;
  onCloseMobile: () => void;
  onOpenDevManage: () => void;
}

export const YouTubeSidebar: React.FC<YouTubeSidebarProps> = ({
  isOpen,
  currentPage,
  themeMode,
  onToggleThemeMode,
  playlistTab,
  activeCategory,
  favoritesCount,
  historyCount,
  customTopics = [],
  onOpenTopicManager,
  onSelectHomeTab,
  onCloseMobile,
  onOpenDevManage,
}) => {
  const isLight = themeMode === 'light';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCloseMobile]);

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer select-none ${
      isActive
        ? isLight
          ? 'bg-[#F2BBC9]/45 text-slate-950 font-bold'
          : 'bg-white/10 text-white font-bold'
        : isLight
        ? 'text-slate-700 hover:bg-slate-200/70 font-medium'
        : 'text-zinc-300 hover:bg-white/[0.06] font-medium'
    }`;

  const renderNavLinks = (onItemClick?: () => void) => (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1">
          {/* TRANG CHỦ */}
          <button
            type="button"
            onClick={() => {
              onSelectHomeTab('all', 'ALL');
              onItemClick?.();
            }}
            className={navItemClass(
              currentPage === 'home' && playlistTab === 'all' && activeCategory === 'ALL'
            )}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="truncate">Trang chủ</span>
          </button>

          {/* VIDEO YÊU THÍCH (/favorites) */}
          <button
            type="button"
            onClick={() => {
              onSelectHomeTab('favorites');
              onItemClick?.();
            }}
            className={navItemClass(currentPage === 'home' && playlistTab === 'favorites')}
          >
            <Bookmark className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left truncate">Video yêu thích</span>
            {favoritesCount > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-bold">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* LỊCH SỬ XEM (/history) */}
          <button
            type="button"
            onClick={() => {
              onSelectHomeTab('history');
              onItemClick?.();
            }}
            className={navItemClass(currentPage === 'home' && playlistTab === 'history')}
          >
            <History className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left truncate">Lịch sử xem</span>
            {historyCount > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 font-bold">
                {historyCount}
              </span>
            )}
          </button>
        </div>

        <hr className={`my-3.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`} />

        <div className="px-3 py-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-60">
          <span>Khám phá chủ đề</span>
        </div>

        {/* DANH SÁCH CHỦ ĐỀ (/tags/:slug) */}
        <div className="space-y-1 mt-1">
          {customTopics.map((topic) => {
            const isActive =
              currentPage === 'home' &&
              playlistTab === 'all' &&
              activeCategory.toLowerCase() === topic.toLowerCase();

            return (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  onSelectHomeTab('all', topic);
                  onItemClick?.();
                }}
                className={navItemClass(isActive)}
              >
                <FolderHeart className="w-4 h-4 shrink-0 opacity-75" />
                <span className="truncate text-xs sm:text-sm">{topic}</span>
              </button>
            );
          })}

          {onOpenTopicManager && (
            <button
              type="button"
              onClick={() => {
                onOpenTopicManager();
                onItemClick?.();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 mt-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span>Cấu hình chủ đề...</span>
            </button>
          )}
        </div>
      </div>

      {/* FOOTER: Theme Switch & Nút Admin Dev Portal (/admin) */}
      <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10 space-y-2">
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${isLight ? 'bg-slate-100/90' : 'bg-white/5'}`}>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">Giao diện</span>
            <span className="text-[11px] opacity-65">{isLight ? 'Đang bật Sáng' : 'Đang bật Tối'}</span>
          </div>

          <ThemeSwitch
            id={onItemClick ? 'themeToggleMobile' : 'themeToggleDesktop'}
            checked={isLight}
            onChange={() => onToggleThemeMode()}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenDevManage();
            onItemClick?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            currentPage === 'admin'
              ? 'bg-rose-600 text-white shadow-md'
              : isLight
              ? 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 border border-amber-500/20'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20'
          }`}
          title="Khu vực quản trị phim & máy chủ VPS"
        >
          <Key className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1 text-left">
            <div>Quản Trị Rạp Phim (Dev)</div>
            <div className="text-[10px] font-normal opacity-75">Tải phim, Xóa tạm & Cấu hình</div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. MOBILE DRAWER */}
      <div className={`md:hidden fixed inset-0 z-[9999] flex sidebar-drawer-overlay ${isOpen ? 'drawer-open' : ''}`}>
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer" onClick={onCloseMobile} aria-hidden="true" />
        <aside
          className={`relative z-[10000] w-72 max-w-[85vw] h-full flex flex-col p-4 shadow-2xl overflow-y-auto sidebar-drawer-panel ${
            isOpen ? 'drawer-open' : ''
          } ${isLight ? 'bg-white border-r border-slate-200 text-slate-900' : 'bg-[#0f0f0f] border-r border-white/10 text-zinc-100'}`}
        >
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-7 h-5 rounded-md bg-[#ff0033] text-white flex items-center justify-center">
                <span className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-white ml-0.5" />
              </span>
              <span className="font-display text-base font-extrabold tracking-tight">PartyStream</span>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {renderNavLinks(onCloseMobile)}
        </aside>
      </div>

      {/* 2. DESKTOP NON-HOME DRAWER */}
      {currentPage !== 'home' && (
        <div className={`hidden md:flex fixed inset-0 z-[9999] sidebar-drawer-overlay ${isOpen ? 'drawer-open' : ''}`}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer" onClick={onCloseMobile} aria-hidden="true" />
          <aside
            className={`relative z-[10000] w-72 h-full flex flex-col p-4 shadow-2xl overflow-y-auto sidebar-drawer-panel ${
              isOpen ? 'drawer-open' : ''
            } ${isLight ? 'bg-white border-r border-slate-200 text-slate-900' : 'bg-[#0f0f0f] border-r border-white/10 text-zinc-100'}`}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-7 h-5 rounded-md bg-[#ff0033] text-white flex items-center justify-center">
                  <span className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-white ml-0.5" />
                </span>
                <span className="font-display text-base font-extrabold tracking-tight">PartyStream</span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isLight ? 'hover:bg-slate-200' : 'hover:bg-white/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderNavLinks(onCloseMobile)}
          </aside>
        </div>
      )}

      {/* 3. DESKTOP HOME SIDEBAR */}
      {currentPage === 'home' && (
        <aside
          className={`hidden md:flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto select-none transition-all duration-150 ${
            isOpen ? 'w-64 px-3.5 py-3' : 'w-[72px] px-1.5 py-2'
          } ${isLight ? 'bg-[#FAF7F9] text-slate-900 border-r border-slate-200/70' : 'bg-[#0f0f0f] text-zinc-100 border-r border-white/[0.04]'}`}
        >
          {isOpen ? (
            renderNavLinks()
          ) : (
            <div className="flex-1 flex flex-col justify-between items-center py-1">
              <div className="flex flex-col items-center space-y-1 w-full">
                <button
                  type="button"
                  onClick={() => onSelectHomeTab('all', 'ALL')}
                  className={`w-full py-3 px-1 rounded-xl flex flex-col items-center gap-1.5 text-[10px] cursor-pointer transition-colors ${
                    playlistTab === 'all' && activeCategory === 'ALL'
                      ? isLight
                        ? 'bg-[#F2BBC9]/45 font-semibold'
                        : 'bg-white/10 font-semibold'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Trang chủ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectHomeTab('favorites')}
                  className={`w-full py-3 px-1 rounded-xl flex flex-col items-center gap-1.5 text-[10px] cursor-pointer transition-colors ${
                    playlistTab === 'favorites'
                      ? isLight
                        ? 'bg-[#F2BBC9]/45 font-semibold'
                        : 'bg-white/10 font-semibold'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                  <span>Yêu thích</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectHomeTab('history')}
                  className={`w-full py-3 px-1 rounded-xl flex flex-col items-center gap-1.5 text-[10px] cursor-pointer transition-colors ${
                    playlistTab === 'history'
                      ? isLight
                        ? 'bg-[#F2BBC9]/45 font-semibold'
                        : 'bg-white/10 font-semibold'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <History className="w-5 h-5" />
                  <span>Lịch sử</span>
                </button>
              </div>

              <div className="flex flex-col items-center space-y-2 pt-2 border-t border-black/10 dark:border-white/10 w-full">
                <div title="Đổi giao diện Sáng / Tối">
                  <ThemeSwitch id="themeToggleMiniRail" checked={isLight} onChange={() => onToggleThemeMode()} />
                </div>

                <button
                  type="button"
                  onClick={onOpenDevManage}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-500 hover:bg-amber-500/15 transition-colors cursor-pointer"
                  title="Kỹ thuật & Cấu hình (Dev)"
                >
                  <Key className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </aside>
      )}
    </>
  );
};
