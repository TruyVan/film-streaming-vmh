import React, { useState } from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  Crown,
  CloudUpload,
  PenTool,
  FolderOpen,
  LayoutGrid,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';

export type CanvaToolType =
  | 'templates'
  | 'elements'
  | 'text'
  | 'brand'
  | 'uploads'
  | 'draw'
  | 'projects'
  | 'apps';

interface CanvaSidebarProps {
  theme: ThemeMode;
  activeTab?: CanvaToolType | null;
  onTabSelect?: (tab: CanvaToolType) => void;
}

export const CanvaSidebar: React.FC<CanvaSidebarProps> = ({
  theme,
  activeTab: externalActiveTab,
  onTabSelect,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<CanvaToolType>('templates');
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const navItems = [
    {
      id: 'templates' as CanvaToolType,
      label: 'Mẫu',
      icon: LayoutTemplate,
    },
    {
      id: 'elements' as CanvaToolType,
      label: 'Thành phần',
      icon: Shapes,
    },
    {
      id: 'text' as CanvaToolType,
      label: 'Văn bản',
      icon: Type,
    },
    {
      id: 'brand' as CanvaToolType,
      label: 'Thương hiệu',
      icon: Crown,
      hasCrownBadge: true,
    },
    {
      id: 'uploads' as CanvaToolType,
      label: 'Tải lên',
      icon: CloudUpload,
    },
    {
      id: 'draw' as CanvaToolType,
      label: 'Công cụ',
      icon: PenTool,
    },
    {
      id: 'projects' as CanvaToolType,
      label: 'Dự án',
      icon: FolderOpen,
    },
    {
      id: 'apps' as CanvaToolType,
      label: 'Ứng dụng',
      icon: LayoutGrid,
    },
  ];

  const handleItemClick = (id: CanvaToolType) => {
    setInternalActiveTab(id);
    setClickedTab(id);
    onTabSelect?.(id);
    setTimeout(() => {
      setClickedTab(null);
    }, 180);
  };

  const isDark = theme === 'dark';

  return (
    <aside
      className={`w-[72px] shrink-0 flex flex-col items-center py-2 z-20 border-r select-none transition-colors duration-150 ${
        isDark
          ? 'bg-[#18191b] border-[#2d3139]'
          : 'bg-[#0e1318] border-[#22252a]'
      }`}
    >
      <div className="flex flex-col items-center w-full gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isPressed = clickedTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              className={`w-[64px] h-[58px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer relative ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              } ${isPressed ? 'scale-90 bg-white/20' : 'active:scale-95'}`}
            >
              {/* Crown indicator for Brand Hub */}
              {item.hasCrownBadge && (
                <span className="absolute top-1.5 right-2 w-3.5 h-3.5 rounded-full bg-amber-400 text-[#18191b] flex items-center justify-center shadow-xs">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                </span>
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                }`}
              />

              <span
                className={`text-[10px] tracking-tight leading-none text-center ${
                  isActive ? 'font-semibold text-white' : 'font-normal'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
export default CanvaSidebar;
