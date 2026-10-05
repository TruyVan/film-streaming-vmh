import React from 'react';
import { Home, Bookmark, History } from 'lucide-react';
import { PlaylistTab, ThemeMode } from '../../types/video';

interface MobileBottomNavProps {
  currentPage: 'home' | 'watch' | 'admin';
  themeMode: ThemeMode;
  playlistTab: PlaylistTab;
  favoritesCount: number;
  historyCount: number;
  onSelectTab: (tab: PlaylistTab) => void;
  onToggleTheme: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  themeMode,
  playlistTab,
  favoritesCount,
  historyCount,
  onSelectTab,
}) => {
  const isLight = themeMode === 'light';

  const isHomeActive = currentPage === 'home' && playlistTab === 'all';
  const isFavActive = playlistTab === 'favorites';
  const isHistActive = playlistTab === 'history';

  const itemClass = (active: boolean) =>
    `flex-1 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer select-none ${
      active
        ? isLight
          ? 'text-rose-600 font-bold'
          : 'text-[#F2A7CA] font-bold'
        : isLight
        ? 'text-slate-600 hover:text-slate-900'
        : 'text-zinc-400 hover:text-zinc-100'
    }`;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 border-t backdrop-blur-md flex items-center justify-around px-4 transition-colors ${
        isLight
          ? 'bg-[#FAF7F9]/95 border-slate-200/90'
          : 'bg-[#0f0f0f]/95 border-white/[0.08]'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelectTab('all')}
        className={itemClass(isHomeActive)}
      >
        <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.4]' : ''}`} />
        <span>Trang chủ</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('favorites')}
        className={itemClass(isFavActive)}
      >
        <div className="relative">
          <Bookmark className={`w-5 h-5 ${isFavActive ? 'fill-current' : ''}`} />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-rose-500 text-white min-w-[14px] text-center">
              {favoritesCount}
            </span>
          )}
        </div>
        <span>Yêu thích</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('history')}
        className={itemClass(isHistActive)}
      >
        <div className="relative">
          <History className={`w-5 h-5 ${isHistActive ? 'stroke-[2.4]' : ''}`} />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-blue-500 text-white min-w-[14px] text-center">
              {historyCount}
            </span>
          )}
        </div>
        <span>Lịch sử</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
