import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  Sparkles,
  Sliders,
  Move,
  Layers,
  Copy,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react';
import { ThemeMode } from '../../../types/video';

interface CanvaToolbarProps {
  theme: ThemeMode;
  documentTitle?: string;
  onDuplicateElement?: () => void;
  onDeleteElement?: () => void;
}

export const CanvaToolbar: React.FC<CanvaToolbarProps> = ({
  theme,
  documentTitle,
  onDuplicateElement,
  onDeleteElement,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState('Canva Sans');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [fontSize, setFontSize] = useState(36);
  const [activeAlign, setActiveAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isListActive, setIsListActive] = useState(false);
  const [textColor, setTextColor] = useState('#0d2137');
  const [isEffectsActive, setIsEffectsActive] = useState(false);
  const [isAnimateActive, setIsAnimateActive] = useState(false);
  const [transparency, setTransparency] = useState(100);
  const [showTransparencyMenu, setShowTransparencyMenu] = useState(false);

  const fonts = [
    'Canva Sans',
    'Montserrat',
    'Playfair Display',
    'Open Sans',
    'Roboto',
    'League Spartan',
  ];

  const triggerFeedback = (id: string, callback?: () => void) => {
    setActiveButton(id);
    setTimeout(() => setActiveButton(null), 160);
    if (callback) callback();
  };

  const isDark = theme === 'dark';

  const handleFontSizeChange = (delta: number) => {
    setFontSize((prev) => Math.max(12, Math.min(144, prev + delta)));
  };

  const cycleAlignment = () => {
    const alignments: ('left' | 'center' | 'right' | 'justify')[] = [
      'left',
      'center',
      'right',
      'justify',
    ];
    const nextIdx = (alignments.indexOf(activeAlign) + 1) % alignments.length;
    setActiveAlign(alignments[nextIdx]);
  };

  return (
    <div
      className={`h-[42px] px-3 flex items-center justify-between border-b text-xs select-none z-20 shrink-0 transition-colors duration-150 ${
        isDark
          ? 'bg-[#18191b] border-[#2d3139] text-[#e0e2e7]'
          : 'bg-white border-[#e3e6eb] text-[#0e1318]'
      }`}
    >
      {/* Left controls: Typography & Styles */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        {/* Font Family selector button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              triggerFeedback('font');
              setShowFontDropdown(!showFontDropdown);
            }}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-all duration-150 cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
            } ${activeButton === 'font' ? 'scale-95' : ''}`}
          >
            <span className="w-24 text-left truncate">{fontFamily}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showFontDropdown && (
            <div
              className={`absolute top-full left-0 mt-1 w-44 rounded-lg shadow-xl border py-1.5 z-50 ${
                isDark
                  ? 'bg-[#22252a] border-[#363b44] text-[#e0e2e7]'
                  : 'bg-white border-neutral-200 text-[#0e1318]'
              }`}
            >
              {fonts.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFontFamily(f);
                    setShowFontDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                    f === fontFamily
                      ? 'bg-purple-600/15 text-purple-600 font-semibold'
                      : isDark
                      ? 'hover:bg-[#2d3139]'
                      : 'hover:bg-neutral-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={`h-4 w-px mx-0.5 ${
            isDark ? 'bg-[#2d3139]' : 'bg-[#e3e6eb]'
          }`}
        />

        {/* Font Size controls */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => triggerFeedback('fs-minus', () => handleFontSizeChange(-1))}
            className={`w-6 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
            } ${activeButton === 'fs-minus' ? 'scale-90 bg-purple-500/20' : ''}`}
            aria-label="Giảm cỡ chữ"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span
            className={`w-9 text-center font-semibold text-xs tabular-nums px-1 py-0.5 rounded cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
            }`}
          >
            {fontSize}
          </span>

          <button
            type="button"
            onClick={() => triggerFeedback('fs-plus', () => handleFontSizeChange(1))}
            className={`w-6 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
            } ${activeButton === 'fs-plus' ? 'scale-90 bg-purple-500/20' : ''}`}
            aria-label="Tăng cỡ chữ"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        <div
          className={`h-4 w-px mx-0.5 ${
            isDark ? 'bg-[#2d3139]' : 'bg-[#e3e6eb]'
          }`}
        />

        {/* Text Color button */}
        <button
          type="button"
          onClick={() =>
            triggerFeedback('color', () =>
              setTextColor(textColor === '#0d2137' ? '#00c4cc' : '#0d2137')
            )
          }
          className={`h-7 px-2 rounded flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'color' ? 'scale-95 bg-purple-500/20' : ''}`}
          aria-label="Màu văn bản"
        >
          <span className="font-bold text-xs leading-none">A</span>
          <span
            className="w-3.5 h-1 rounded-sm mt-0.5"
            style={{ backgroundColor: textColor }}
          />
        </button>

        {/* Bold */}
        <button
          type="button"
          onClick={() => triggerFeedback('bold', () => setIsBold(!isBold))}
          className={`w-7 h-7 rounded flex items-center justify-center font-bold transition-all duration-150 cursor-pointer ${
            isBold
              ? isDark
                ? 'bg-purple-600/30 text-purple-400 font-extrabold ring-1 ring-purple-500/50'
                : 'bg-purple-100 text-purple-700 font-extrabold'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'bold' ? 'scale-90' : ''}`}
          aria-label="Đậm"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => triggerFeedback('italic', () => setIsItalic(!isItalic))}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isItalic
              ? isDark
                ? 'bg-purple-600/30 text-purple-400 font-semibold ring-1 ring-purple-500/50'
                : 'bg-purple-100 text-purple-700'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'italic' ? 'scale-90' : ''}`}
          aria-label="Nghiêng"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => triggerFeedback('underline', () => setIsUnderline(!isUnderline))}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isUnderline
              ? isDark
                ? 'bg-purple-600/30 text-purple-400 ring-1 ring-purple-500/50'
                : 'bg-purple-100 text-purple-700'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'underline' ? 'scale-90' : ''}`}
          aria-label="Gạch dưới"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => triggerFeedback('align', cycleAlignment)}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'align' ? 'scale-90 bg-purple-500/20' : ''}`}
          aria-label="Căn chỉnh"
        >
          {activeAlign === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
          {activeAlign === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
          {activeAlign === 'right' && <AlignRight className="w-3.5 h-3.5" />}
          {activeAlign === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => triggerFeedback('list', () => setIsListActive(!isListActive))}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isListActive
              ? isDark
                ? 'bg-purple-600/30 text-purple-400'
                : 'bg-purple-100 text-purple-700'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'list' ? 'scale-90' : ''}`}
          aria-label="Danh sách"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Spacing */}
        <button
          type="button"
          onClick={() => triggerFeedback('spacing')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'spacing' ? 'scale-90 bg-purple-500/20' : ''}`}
          aria-label="Giãn cách dòng và chữ"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        <div
          className={`h-4 w-px mx-0.5 ${
            isDark ? 'bg-[#2d3139]' : 'bg-[#e3e6eb]'
          }`}
        />

        {/* Hiệu ứng (Effects) */}
        <button
          type="button"
          onClick={() => triggerFeedback('effects', () => setIsEffectsActive(!isEffectsActive))}
          className={`h-7 px-2.5 rounded font-medium flex items-center gap-1 transition-all duration-150 cursor-pointer ${
            isEffectsActive
              ? isDark
                ? 'bg-purple-600/30 text-purple-400 ring-1 ring-purple-500/50'
                : 'bg-purple-100 text-purple-700'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'effects' ? 'scale-95' : ''}`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Hiệu ứng</span>
        </button>

        {/* Tạo hình động (Animate) */}
        <button
          type="button"
          onClick={() => triggerFeedback('animate', () => setIsAnimateActive(!isAnimateActive))}
          className={`h-7 px-2.5 rounded font-medium flex items-center gap-1 transition-all duration-150 cursor-pointer ${
            isAnimateActive
              ? isDark
                ? 'bg-purple-600/30 text-purple-400 ring-1 ring-purple-500/50'
                : 'bg-purple-100 text-purple-700'
              : isDark
              ? 'hover:bg-[#2d3139]'
              : 'hover:bg-neutral-100'
          } ${activeButton === 'animate' ? 'scale-95' : ''}`}
        >
          <Move className="w-3 h-3" />
          <span>Tạo hình động</span>
        </button>
      </div>

      {/* Right controls: Position, Transparency, Duplicate, Delete */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Vị trí (Position) */}
        <button
          type="button"
          onClick={() => triggerFeedback('position')}
          className={`h-7 px-2.5 rounded font-medium flex items-center gap-1 transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'position' ? 'scale-95 bg-purple-500/20' : ''}`}
        >
          <Layers className="w-3 h-3" />
          <span>Vị trí</span>
        </button>

        {/* Transparency */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              triggerFeedback('opacity');
              setShowTransparencyMenu(!showTransparencyMenu);
            }}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
              isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
            } ${activeButton === 'opacity' ? 'scale-90 bg-purple-500/20' : ''}`}
            aria-label="Độ trong suốt"
          >
            <div className="w-3.5 h-3.5 border border-current rounded-sm grid grid-cols-2 grid-rows-2">
              <div className="bg-current opacity-70" />
              <div />
              <div />
              <div className="bg-current opacity-70" />
            </div>
          </button>

          {showTransparencyMenu && (
            <div
              className={`absolute top-full right-0 mt-1 p-3 w-52 rounded-lg shadow-xl border z-50 ${
                isDark
                  ? 'bg-[#22252a] border-[#363b44] text-[#e0e2e7]'
                  : 'bg-white border-neutral-200 text-[#0e1318]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Độ trong suốt</span>
                <span className="text-xs font-mono tabular-nums">{transparency}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={transparency}
                onChange={(e) => setTransparency(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Duplicate */}
        <button
          type="button"
          onClick={() => triggerFeedback('duplicate', onDuplicateElement)}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'duplicate' ? 'scale-90 bg-purple-500/20' : ''}`}
          aria-label="Nhân bản phần tử"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => triggerFeedback('delete', onDeleteElement)}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 text-rose-500 cursor-pointer ${
            isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
          } ${activeButton === 'delete' ? 'scale-90' : ''}`}
          aria-label="Xóa phần tử"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* More */}
        <button
          type="button"
          onClick={() => triggerFeedback('more')}
          className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer ${
            isDark ? 'hover:bg-[#2d3139]' : 'hover:bg-neutral-100'
          } ${activeButton === 'more' ? 'scale-90 bg-purple-500/20' : ''}`}
          aria-label="Thêm tùy chọn"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
export default CanvaToolbar;
