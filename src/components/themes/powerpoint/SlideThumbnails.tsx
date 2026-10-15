import React from 'react';
import { Film, Play } from 'lucide-react';
import { ThemeMode, Video } from '../../../types/video';

interface SlideThumbnailsProps {
  theme: ThemeMode;
  seriesVideos: Video[];
  activeVideoId: string;
  onSelectVideo: (video: Video) => void;
}

export const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  theme,
  seriesVideos,
  activeVideoId,
  onSelectVideo,
}) => {
  const isDark = theme === 'dark';

  return (
    <aside
      className={`w-60 h-full flex flex-col border-r select-none overflow-y-auto no-scrollbar py-3 px-2 transition-colors shrink-0 ${
        isDark ? 'bg-[#202020] border-[#2E2E2E]' : 'bg-[#F3F2F1] border-[#EDEBE9]'
      }`}
    >
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D83B01]">
          Trang chiếu ({seriesVideos.length})
        </span>
        <span className="text-[10px] opacity-60 font-mono">Tập 1 → {seriesVideos.length}</span>
      </div>

      <div className="space-y-2.5">
        {seriesVideos.map((item, index) => {
          const isActive = item.id === activeVideoId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectVideo(item)}
              className="flex items-start gap-1.5 group cursor-pointer"
            >
              {/* Slide Number */}
              <div
                className={`text-[11px] font-bold font-mono w-4 text-right pt-1 shrink-0 ${
                  isActive ? 'text-[#D83B01]' : 'opacity-60'
                }`}
              >
                {index + 1}
              </div>

              {/* Slide Miniature Thumbnail */}
              <div
                className={`relative w-full aspect-video rounded-[3px] overflow-hidden transition-all shadow-xs ${
                  isActive
                    ? 'ring-2 ring-[#D83B01] shadow-md scale-[1.02]'
                    : isDark
                    ? 'border border-[#383838] hover:border-[#666666]'
                    : 'border border-[#D1D1D1] hover:border-[#999999]'
                }`}
              >
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#16161c] flex flex-col items-center justify-center p-1 text-center">
                    <Film className="w-4 h-4 text-orange-500 mb-0.5" />
                    <span className="text-[7px] text-zinc-300 line-clamp-1 truncate w-full">
                      {item.title}
                    </span>
                  </div>
                )}

                <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/80 text-white font-mono text-[8px] font-bold">
                  Tập {index + 1}
                </div>

                {item.duration && (
                  <span className="absolute bottom-0.5 right-1 px-1 rounded bg-black/80 text-[7px] font-mono text-white">
                    {item.duration}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
export default SlideThumbnails;
