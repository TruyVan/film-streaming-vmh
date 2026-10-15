import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Film, Plus } from 'lucide-react';
import { ThemeMode, Video } from '../../../types/video';

interface CanvaFilmstripProps {
  theme: ThemeMode;
  seriesVideos: Video[];
  activeVideoId: string;
  onSelectVideo: (video: Video) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CanvaFilmstrip: React.FC<CanvaFilmstripProps> = ({
  theme,
  seriesVideos,
  activeVideoId,
  onSelectVideo,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  const triggerFeedback = (id: string, cb?: () => void) => {
    setPressedBtn(id);
    setTimeout(() => setPressedBtn(null), 160);
    if (cb) cb();
  };

  const isDark = theme === 'dark';

  if (isCollapsed) {
    return (
      <div
        className={`h-2 border-t flex justify-end px-4 z-10 shrink-0 ${
          isDark ? 'bg-[#18191b] border-[#2d3139]' : 'bg-[#f4f5f7] border-[#e3e6eb]'
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`-translate-y-4 px-2.5 py-0.5 rounded shadow-md text-xs flex items-center gap-1 font-semibold cursor-pointer ${
            isDark ? 'bg-[#22252a] text-white' : 'bg-white text-neutral-800'
          }`}
          title="Mở rộng filmstrip tập phim"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span className="text-[10px]">Tập phim ({seriesVideos.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`h-[84px] px-3 flex items-center gap-2 border-t overflow-x-auto no-scrollbar select-none z-10 transition-colors duration-150 shrink-0 ${
        isDark ? 'bg-[#18191b] border-[#2d3139]' : 'bg-[#f4f5f7] border-[#e3e6eb]'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`px-1 py-3 rounded-md text-xs transition-colors shrink-0 cursor-pointer ${
          isDark
            ? 'text-neutral-500 hover:text-white'
            : 'text-neutral-400 hover:text-neutral-800'
        }`}
        title="Thu gọn filmstrip"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {seriesVideos.map((item, idx) => {
        const isActive = item.id === activeVideoId;
        const isPressed = pressedBtn === `slide-${item.id}`;

        return (
          <div
            key={item.id}
            onClick={() =>
              triggerFeedback(`slide-${item.id}`, () => onSelectVideo(item))
            }
            className={`group relative shrink-0 w-[114px] h-[64px] rounded-lg overflow-hidden cursor-pointer transition-all duration-150 flex flex-col justify-between p-1 border shadow-xs ${
              isActive
                ? 'ring-2 ring-purple-600 border-transparent bg-purple-500/20 shadow-md scale-[1.02]'
                : isDark
                ? 'bg-[#22252a] border-[#363b44] hover:border-neutral-500'
                : 'bg-white border-neutral-300 hover:border-neutral-400'
            } ${isPressed ? 'scale-90' : 'active:scale-95'}`}
          >
            <div className="w-full h-full relative overflow-hidden rounded bg-black">
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#10141f] via-[#1a112c] to-[#250d1e] flex flex-col items-center justify-center text-[10px] text-zinc-400 p-1">
                  <Film className="w-4 h-4 text-purple-400 mb-0.5" />
                  <span className="text-[7px] text-zinc-200 line-clamp-1 truncate w-full text-center">
                    {item.title}
                  </span>
                </div>
              )}

              <span className="absolute bottom-0.5 right-1 px-1 rounded text-[8px] font-mono bg-black/80 text-white">
                {item.duration || '00:00'}
              </span>
            </div>

            <div className="absolute top-1 left-1.5 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[8px] font-bold">
              Tập {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default CanvaFilmstrip;
