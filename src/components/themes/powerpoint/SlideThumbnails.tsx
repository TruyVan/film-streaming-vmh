import React from 'react';
import { Film, Plus } from 'lucide-react';
import { ThemeMode, Video } from '../../../types/video';

interface SlideThumbnailsProps {
  theme: ThemeMode;
  seriesVideos: Video[];
  activeVideoId: string;
  onSelectVideo: (video: Video) => void;
  onAddNewSlide?: () => void;
}

export const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  theme,
  seriesVideos,
  activeVideoId,
  onSelectVideo,
  onAddNewSlide,
}) => {
  const isDark = theme === 'dark';

  return (
    <aside
      className={`w-60 h-full flex flex-col border-r select-none overflow-y-auto no-scrollbar py-3 px-2.5 transition-colors shrink-0 ${
        isDark ? 'bg-[#202020] border-[#2E2E2E]' : 'bg-[#F3F2F1] border-[#EDEBE9]'
      }`}
    >
      {/* Header exactly matching Screenshot 1: Trang chiếu (Slides) + button */}
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[12px] font-bold text-[#E1DFDD] dark:text-[#E1DFDD] text-slate-800">
          Trang chiếu (Slides)
        </span>
        <button
          type="button"
          onClick={onAddNewSlide}
          className={`p-1 rounded-[2px] transition-colors cursor-pointer ${
            isDark ? 'hover:bg-[#2F2E2D] text-[#CCCCCC]' : 'hover:bg-[#E5E5E5] text-[#605E5C]'
          }`}
          title="Thêm trang chiếu mới"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {seriesVideos.map((item, index) => {
          const isActive = item.id === activeVideoId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectVideo(item)}
              className="flex items-start gap-2 group cursor-pointer"
            >
              {/* Slide Number */}
              <div
                className={`text-[11px] font-bold font-mono w-3.5 text-right pt-1 shrink-0 ${
                  isActive ? 'text-[#D83B01]' : 'opacity-60'
                }`}
              >
                {index + 1}
              </div>

              {/* Slide Miniature Thumbnail */}
              <div
                className={`relative w-full aspect-video rounded-[2px] overflow-hidden transition-all shadow-xs bg-white ${
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
                  /* Miniature slide placeholder matching Screenshot 1 */
                  <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-white text-black">
                    <div className="w-4/5 h-2.5 border border-dashed border-slate-400 rounded-xs mb-1 flex items-center justify-center">
                      <span className="text-[6px] text-slate-500 font-semibold truncate px-0.5">
                        {item.title}
                      </span>
                    </div>
                    <div className="w-3/5 h-1.5 border border-dashed border-slate-300 rounded-xs" />
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
