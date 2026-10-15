import React, { useState } from 'react';
import {
  Scissors,
  Copy,
  Paintbrush,
  SquarePlus,
  LayoutTemplate,
  RotateCcw,
  Layers,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  ChevronDown,
  List,
  ListOrdered,
  Indent,
  Outdent,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  PaintBucket,
  PenTool,
  Boxes,
  Sparkles,
  Search,
  ChevronUp,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  Check,
  ChevronLeft,
  Bookmark,
  Share2,
} from 'lucide-react';
import { FontState, ParagraphState, DrawingState } from './types';
import { OfficeTooltip } from './OfficeTooltip';
import { ThemeMode } from '../../../types/video';

interface RibbonHomeTabProps {
  theme: ThemeMode;
  fontState: FontState;
  onChangeFontState: (updates: Partial<FontState>) => void;
  paragraphState: ParagraphState;
  onChangeParagraphState: (updates: Partial<ParagraphState>) => void;
  drawingState: DrawingState;
  onChangeDrawingState: (updates: Partial<DrawingState>) => void;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  isCopied?: boolean;
}

const FONTS_LIST = [
  'Aptos Display (Headings)',
  'Aptos (Body)',
  'Arial',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Segoe UI',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66,
  72, 80, 96,
];

export const RibbonHomeTab: React.FC<RibbonHomeTabProps> = ({
  theme,
  fontState,
  onChangeFontState,
  paragraphState,
  onChangeParagraphState,
  drawingState,
  onChangeDrawingState,
  onPrevEpisode,
  onNextEpisode,
  hasPrev,
  hasNext,
  isFavorite,
  onToggleFavorite,
  onShare,
  isCopied,
}) => {
  const isDark = theme === 'dark';

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const btnHover = isDark
    ? 'hover:bg-[#3B3A39] active:bg-[#484644] text-[#E1DFDD]'
    : 'hover:bg-[#E1DFDD] active:bg-[#C8C6C4] text-[#323130]';
  const groupBorder = isDark ? 'border-[#383838]' : 'border-[#EDEBE9]';
  const labelColor = isDark ? 'text-[#8A8886]' : 'text-[#605E5C]';

  return (
    <div
      className={`h-[92px] w-full flex items-center px-2 overflow-x-auto no-scrollbar select-none text-xs transition-colors shrink-0 ${
        isDark ? 'bg-[#2B2B2B]' : 'bg-[#FFFFFF]'
      }`}
    >
      {/* 1. EPISODE NAVIGATION GROUP (Tập trước / Tập kế tiếp) */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex items-center gap-1.5 h-[62px]">
          <OfficeTooltip title="Tập trước đó" vietnameseDesc="Chuyển sang tập trước">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrevEpisode}
              className={`flex flex-col items-center justify-center px-2 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover} ${
                !hasPrev ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-5 h-5 text-[#D83B01]" />
              <span className="text-[10px] font-bold mt-0.5">Tập trước</span>
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Tập kế tiếp" vietnameseDesc="Chuyển sang tập tiếp theo">
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNextEpisode}
              className={`flex flex-col items-center justify-center px-2 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover} ${
                !hasNext ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ArrowRight className="w-5 h-5 text-[#D83B01]" />
              <span className="text-[10px] font-bold mt-0.5">Tập tiếp</span>
            </button>
          </OfficeTooltip>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Tập Phim
        </div>
      </div>

      {/* 2. ACTIONS GROUP (Yêu thích & Chia sẻ) */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex items-center gap-1 h-[62px]">
          <OfficeTooltip
            title="Lưu yêu thích"
            vietnameseDesc="Đánh dấu phim vào danh sách yêu thích"
          >
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`flex flex-col items-center justify-center px-2.5 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover} ${
                isFavorite ? 'text-rose-500 font-bold' : ''
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${isFavorite ? 'fill-current text-rose-500' : ''}`}
              />
              <span className="text-[10px] mt-0.5 leading-none">
                {isFavorite ? 'Đã lưu' : 'Yêu thích'}
              </span>
            </button>
          </OfficeTooltip>

          {onShare && (
            <OfficeTooltip title="Chia sẻ" vietnameseDesc="Sao chép liên kết xem phim">
              <button
                type="button"
                onClick={onShare}
                className={`flex flex-col items-center justify-center px-2.5 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
              >
                {isCopied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Share2 className="w-5 h-5 text-[#D83B01]" />
                )}
                <span className="text-[10px] mt-0.5 leading-none">
                  {isCopied ? 'Đã chép' : 'Chia sẻ'}
                </span>
              </button>
            </OfficeTooltip>
          )}
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Hành Động
        </div>
      </div>

      {/* 3. CLIPBOARD GROUP */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex items-center gap-1 h-[62px]">
          <OfficeTooltip title="Paste" shortcut="Ctrl+V">
            <button
              type="button"
              className={`flex flex-col items-center justify-center w-11 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
            >
              <SquarePlus className="w-5 h-5 text-[#D83B01]" />
              <div className="flex items-center gap-0.5 text-[10.5px] mt-0.5 leading-none">
                <span>Paste</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </div>
            </button>
          </OfficeTooltip>

          <div className="flex flex-col justify-center gap-1">
            <button
              type="button"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] ${btnHover}`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cut</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] ${btnHover}`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Clipboard
        </div>
      </div>

      {/* 4. FONT GROUP */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex flex-col justify-center gap-1 h-[62px]">
          {/* Top Row: Font Family & Font Size */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('fontFamily')}
                className={`h-[22px] px-2 rounded-[2px] flex items-center justify-between border text-[11px] font-medium w-36 ${
                  isDark
                    ? 'bg-[#1F1F1F] border-[#3D3D3D] text-[#E1DFDD]'
                    : 'bg-white border-[#D2D0CE] text-[#323130]'
                }`}
              >
                <span className="truncate">{fontState.family}</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-1 shrink-0" />
              </button>

              {openDropdown === 'fontFamily' && (
                <div
                  className={`absolute top-full left-0 mt-0.5 w-48 max-h-48 overflow-y-auto rounded-[3px] shadow-xl border z-50 py-1 ${
                    isDark
                      ? 'bg-[#2B2B2B] border-[#444444] text-white'
                      : 'bg-white border-[#D2D0CE] text-black'
                  }`}
                >
                  {FONTS_LIST.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        onChangeFontState({ family: f });
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-2.5 py-1 text-xs hover:bg-[#D83B01] hover:text-white"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('fontSize')}
                className={`h-[22px] px-1.5 rounded-[2px] flex items-center justify-between border text-[11px] font-medium w-14 tabular-nums ${
                  isDark
                    ? 'bg-[#1F1F1F] border-[#3D3D3D] text-[#E1DFDD]'
                    : 'bg-white border-[#D2D0CE] text-[#323130]'
                }`}
              >
                <span>{fontState.size}</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
              </button>

              {openDropdown === 'fontSize' && (
                <div
                  className={`absolute top-full left-0 mt-0.5 w-16 max-h-44 overflow-y-auto rounded-[3px] shadow-xl border z-50 py-1 ${
                    isDark
                      ? 'bg-[#2B2B2B] border-[#444444] text-white'
                      : 'bg-white border-[#D2D0CE] text-black'
                  }`}
                >
                  {FONT_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        onChangeFontState({ size: sz });
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-2 py-0.5 text-xs hover:bg-[#D83B01] hover:text-white"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Formatting Icons (B, I, U, S...) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onChangeFontState({ bold: !fontState.bold })}
              className={`p-1 rounded-[2px] ${fontState.bold ? 'bg-[#D83B01]/20 text-[#D83B01] font-bold' : btnHover}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeFontState({ italic: !fontState.italic })}
              className={`p-1 rounded-[2px] ${fontState.italic ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeFontState({ underline: !fontState.underline })}
              className={`p-1 rounded-[2px] ${fontState.underline ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeFontState({ strikethrough: !fontState.strikethrough })}
              className={`p-1 rounded-[2px] ${fontState.strikethrough ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Font
        </div>
      </div>

      {/* 5. PARAGRAPH GROUP */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex flex-col justify-center gap-1 h-[62px]">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onChangeParagraphState({ bullets: !paragraphState.bullets })}
              className={`p-1 rounded-[2px] ${paragraphState.bullets ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Bullets"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeParagraphState({ numbering: !paragraphState.numbering })}
              className={`p-1 rounded-[2px] ${paragraphState.numbering ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Numbering"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onChangeParagraphState({ align: 'left' })}
              className={`p-1 rounded-[2px] ${paragraphState.align === 'left' ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeParagraphState({ align: 'center' })}
              className={`p-1 rounded-[2px] ${paragraphState.align === 'center' ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeParagraphState({ align: 'right' })}
              className={`p-1 rounded-[2px] ${paragraphState.align === 'right' ? 'bg-[#D83B01]/20 text-[#D83B01]' : btnHover}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Paragraph
        </div>
      </div>

      {/* 6. DRAWING GROUP */}
      <div
        className={`flex flex-col justify-between h-full py-1 px-2 border-r ${groupBorder} shrink-0`}
      >
        <div className="flex items-center gap-1.5 h-[62px]">
          <div className="grid grid-cols-3 gap-0.5 p-1 rounded border border-current/10">
            <button
              type="button"
              onClick={() => onChangeDrawingState({ selectedShape: 'Square' })}
              className={`p-1 rounded ${drawingState.selectedShape === 'Square' ? 'bg-[#D83B01] text-white' : btnHover}`}
              title="Hộp chữ nhật"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDrawingState({ selectedShape: 'Circle' })}
              className={`p-1 rounded ${drawingState.selectedShape === 'Circle' ? 'bg-[#D83B01] text-white' : btnHover}`}
              title="Hình tròn"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDrawingState({ selectedShape: 'Star' })}
              className={`p-1 rounded ${drawingState.selectedShape === 'Star' ? 'bg-[#D83B01] text-white' : btnHover}`}
              title="Ngôi sao"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col justify-center gap-1">
            <button
              type="button"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] ${btnHover}`}
            >
              <PaintBucket className="w-3.5 h-3.5 text-blue-500" />
              <span>Fill</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] ${btnHover}`}
            >
              <PenTool className="w-3.5 h-3.5 text-orange-500" />
              <span>Outline</span>
            </button>
          </div>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Drawing
        </div>
      </div>

      {/* 7. DESIGNER GROUP */}
      <div className="flex flex-col justify-between h-full py-1 px-2 shrink-0">
        <div className="flex items-center justify-center h-[62px]">
          <OfficeTooltip title="Designer" vietnameseDesc="Tự động bố cục slide chuyên nghiệp">
            <button
              type="button"
              className={`flex flex-col items-center justify-center px-3 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-bold mt-0.5 text-[#D83B01]">
                Designer
              </span>
            </button>
          </OfficeTooltip>
        </div>
        <div className={`text-[10px] text-center leading-none ${labelColor}`}>
          Voice & Design
        </div>
      </div>
    </div>
  );
};
export default RibbonHomeTab;
