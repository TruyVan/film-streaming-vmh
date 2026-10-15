import React from 'react';
import {
  Table,
  Image as ImageIcon,
  Shapes,
  BarChart3,
  Video,
  Camera,
  Play,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  Tv2,
  Grid,
  Ruler,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { RibbonTabId } from './types';
import { OfficeTooltip } from './OfficeTooltip';
import { ThemeMode } from '../../../types/video';

interface RibbonOtherTabsProps {
  theme: ThemeMode;
  activeTab: RibbonTabId;
  onStartSlideShow?: () => void;
}

export const RibbonOtherTabs: React.FC<RibbonOtherTabsProps> = ({
  theme,
  activeTab,
  onStartSlideShow,
}) => {
  const isDark = theme === 'dark';
  const btnHover = isDark
    ? 'hover:bg-[#3B3A39] active:bg-[#484644] text-[#E1DFDD]'
    : 'hover:bg-[#E1DFDD] active:bg-[#C8C6C4] text-[#323130]';
  const groupBorder = isDark ? 'border-[#383838]' : 'border-[#EDEBE9]';
  const labelColor = isDark ? 'text-[#8A8886]' : 'text-[#605E5C]';

  if (activeTab === 'insert') {
    return (
      <div
        className={`h-[92px] w-full flex items-center px-2 overflow-x-auto no-scrollbar select-none text-xs transition-colors shrink-0 ${
          isDark ? 'bg-[#2B2B2B]' : 'bg-[#FFFFFF]'
        }`}
      >
        {/* Tables */}
        <div className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}>
          <div className="flex items-center justify-center h-[62px]">
            <button className={`flex flex-col items-center justify-center w-12 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <Table className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] mt-0.5">Table</span>
            </button>
          </div>
          <div className={`text-[10px] text-center leading-none ${labelColor}`}>Tables</div>
        </div>

        {/* Media */}
        <div className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}>
          <div className="flex items-center gap-1 h-[62px]">
            <button className={`flex flex-col items-center justify-center px-2.5 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] mt-0.5">Pictures</span>
            </button>
            <button className={`flex flex-col items-center justify-center px-2.5 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <Video className="w-5 h-5 text-rose-500" />
              <span className="text-[10px] mt-0.5">Video</span>
            </button>
          </div>
          <div className={`text-[10px] text-center leading-none ${labelColor}`}>Media</div>
        </div>
      </div>
    );
  }

  if (activeTab === 'slideshow') {
    return (
      <div
        className={`h-[92px] w-full flex items-center px-2 overflow-x-auto no-scrollbar select-none text-xs transition-colors shrink-0 ${
          isDark ? 'bg-[#2B2B2B]' : 'bg-[#FFFFFF]'
        }`}
      >
        <div className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}>
          <div className="flex items-center gap-1.5 h-[62px]">
            <button
              type="button"
              onClick={onStartSlideShow}
              className={`flex flex-col items-center justify-center px-3 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
            >
              <Tv2 className="w-5 h-5 text-[#D83B01]" />
              <span className="text-[10.5px] font-bold mt-0.5 text-[#D83B01]">Từ đầu (F5)</span>
            </button>
            <button
              type="button"
              onClick={onStartSlideShow}
              className={`flex flex-col items-center justify-center px-3 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
            >
              <Play className="w-5 h-5 text-amber-500" />
              <span className="text-[10.5px] mt-0.5">Từ tập hiện tại</span>
            </button>
          </div>
          <div className={`text-[10px] text-center leading-none ${labelColor}`}>Bắt đầu trình chiếu</div>
        </div>
      </div>
    );
  }

  // Default fallback for other tabs (Transitions, Animations, View...)
  return (
    <div
      className={`h-[92px] w-full flex items-center px-3 select-none text-xs transition-colors shrink-0 gap-3 ${
        isDark ? 'bg-[#2B2B2B]' : 'bg-[#FFFFFF]'
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <span className="font-semibold text-xs">
          Thẻ {activeTab.toUpperCase()} đã sẵn sàng hoạt động cùng rạp chiếu phim PowerPoint.
        </span>
      </div>
    </div>
  );
};
export default RibbonOtherTabs;
