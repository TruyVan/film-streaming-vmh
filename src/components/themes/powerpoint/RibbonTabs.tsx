import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { RibbonTabId } from './types';
import { OfficeTooltip } from './OfficeTooltip';
import { ThemeMode } from '../../../types/video';

interface RibbonTabsProps {
  theme: ThemeMode;
  activeTab: RibbonTabId;
  onSelectTab: (tab: RibbonTabId) => void;
  ribbonCollapsed: boolean;
  onToggleCollapse: () => void;
  onGoHome?: () => void;
}

interface TabDef {
  id: RibbonTabId;
  label: string;
  tooltipTitle: string;
  tooltipDesc: string;
  shortcut?: string;
  isContextual?: boolean;
}

const TABS: TabDef[] = [
  {
    id: 'file',
    label: 'File',
    tooltipTitle: 'Thực đơn Tệp (File)',
    tooltipDesc: 'Mở trang quản lý tệp: Về trang chủ rạp phim, Danh mục phim và Cài đặt.',
    shortcut: 'Alt+F',
  },
  {
    id: 'home',
    label: 'Home',
    tooltipTitle: 'Thẻ Trang đầu (Home)',
    tooltipDesc: 'Chứa các công cụ điều khiển phim: Chuyển tập, Yêu thích, Chia sẻ và Tùy chỉnh.',
    shortcut: 'Alt+H',
  },
  {
    id: 'insert',
    label: 'Insert',
    tooltipTitle: 'Thẻ Chèn (Insert)',
    tooltipDesc: 'Chèn bảng, ảnh bìa, hình vẽ Shapes, ghi chú bài giảng.',
    shortcut: 'Alt+N',
  },
  {
    id: 'draw',
    label: 'Draw',
    tooltipTitle: 'Thẻ Vẽ (Draw)',
    tooltipDesc: 'Công cụ vẽ tự do và đánh dấu trên slide.',
    shortcut: 'Alt+J+I',
  },
  {
    id: 'design',
    label: 'Design',
    tooltipTitle: 'Thẻ Thiết kế (Design)',
    tooltipDesc: 'Chọn chủ đề slide và màu nền.',
    shortcut: 'Alt+G',
  },
  {
    id: 'transitions',
    label: 'Transitions',
    tooltipTitle: 'Thẻ Chuyển cảnh (Transitions)',
    tooltipDesc: 'Tạo hiệu ứng chuyển tiếp giữa các tập phim.',
    shortcut: 'Alt+K',
  },
  {
    id: 'animations',
    label: 'Animations',
    tooltipTitle: 'Thẻ Hiệu ứng (Animations)',
    tooltipDesc: 'Hiệu ứng hoạt ảnh trên trang slide.',
    shortcut: 'Alt+A',
  },
  {
    id: 'slideshow',
    label: 'Slide Show',
    tooltipTitle: 'Thẻ Trình chiếu (Slide Show)',
    tooltipDesc: 'Trình chiếu toàn màn hình bài giảng điện ảnh (F5).',
    shortcut: 'Alt+S',
  },
  {
    id: 'record',
    label: 'Record',
    tooltipTitle: 'Thẻ Ghi hình (Record)',
    tooltipDesc: 'Ghi lại bài giảng cùng webcam và micro.',
    shortcut: 'Alt+C',
  },
  {
    id: 'review',
    label: 'Review',
    tooltipTitle: 'Thẻ Soát lỗi (Review)',
    tooltipDesc: 'Kiểm tra chính tả, dịch thuật và bình luận.',
    shortcut: 'Alt+R',
  },
  {
    id: 'view',
    label: 'View',
    tooltipTitle: 'Thẻ Chế độ xem (View)',
    tooltipDesc: 'Tùy chỉnh thu phóng thước kẻ và ghi chú.',
    shortcut: 'Alt+W',
  },
  {
    id: 'help',
    label: 'Help',
    tooltipTitle: 'Thẻ Trợ giúp (Help)',
    tooltipDesc: 'Tài liệu hướng dẫn rạp chiếu phim.',
    shortcut: 'Alt+Y',
  },
];

export const RibbonTabs: React.FC<RibbonTabsProps> = ({
  theme,
  activeTab,
  onSelectTab,
  ribbonCollapsed,
  onToggleCollapse,
  onGoHome,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`h-9 w-full flex items-center justify-between px-2 text-xs select-none transition-colors border-b shrink-0 ${
        isDark
          ? 'bg-[#202020] text-[#D1D1D1] border-[#2E2E2E]'
          : 'bg-[#F3F2F1] text-[#323130] border-[#EDEBE9]'
      }`}
    >
      {/* TABS ROW */}
      <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar h-full pt-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isFile = tab.id === 'file';

          return (
            <OfficeTooltip
              key={tab.id}
              title={tab.tooltipTitle}
              shortcut={tab.shortcut}
              description={tab.tooltipDesc}
            >
              <button
                type="button"
                onClick={() => {
                  if (isFile && onGoHome) {
                    onGoHome();
                  } else {
                    onSelectTab(tab.id);
                  }
                }}
                className={`relative px-3.5 h-8 flex items-center justify-center font-medium transition-all text-[12px] rounded-t-[3px] outline-none cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-[#2B2B2B] text-white font-semibold'
                      : 'bg-[#FFFFFF] text-[#1E1E1E] font-semibold shadow-xs'
                    : isFile
                    ? 'bg-[#D83B01] text-white font-bold hover:brightness-110 mr-1'
                    : isDark
                    ? 'hover:bg-[#2F2E2D] text-[#CCCCCC]'
                    : 'hover:bg-[#E5E5E5] text-[#484644]'
                }`}
              >
                <span>{tab.label}</span>

                {/* Active Underline Indicator */}
                {isActive && !isFile && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#D83B01] rounded-t-sm" />
                )}
              </button>
            </OfficeTooltip>
          );
        })}
      </div>

      {/* RIGHT SIDE: COLLAPSE RIBBON BUTTON */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <OfficeTooltip
          title={ribbonCollapsed ? 'Mở rộng dải băng Ribbon' : 'Thu gọn dải băng Ribbon'}
          shortcut="Ctrl+F1"
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-[3px] transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#2F2E2D] text-[#CCCCCC]' : 'hover:bg-[#E5E5E5] text-[#605E5C]'
            }`}
          >
            {ribbonCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </OfficeTooltip>
      </div>
    </div>
  );
};
export default RibbonTabs;
