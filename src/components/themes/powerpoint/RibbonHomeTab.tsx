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
  Columns2,
  PaintBucket,
  PenTool,
  Boxes,
  Sparkles,
  Search,
  Replace,
  MousePointer,
  Mic,
  ShieldAlert,
  AppWindow,
  ExternalLink,
  ChevronUp,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  Check,
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
  onAddNewSlide?: () => void;
  onOpenDesigner?: () => void;
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

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 54, 60, 66, 72, 80, 96];

const THEME_COLORS = [
  '#FFFFFF', '#000000', '#EEECE1', '#1F497D', '#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646',
  '#F2F2F2', '#7F7F7F', '#DDD9C3', '#C6D9F0', '#DBE5F1', '#F2DCDB', '#EBF1DD', '#E5E0EC', '#DBEEF3', '#FDEADA',
  '#D8D8D8', '#595959', '#C4BD97', '#8DB3E2', '#B8CCE4', '#E5B9B7', '#D7E3BC', '#CCC1DA', '#B7DDE8', '#FBD5B5',
  '#BFBFBF', '#3F3F3F', '#938953', '#548DD4', '#95B3D7', '#D99694', '#C3D69B', '#B2A2C7', '#92CDDC', '#FAC08F',
  '#A5A5A5', '#262626', '#494429', '#17365D', '#366092', '#953734', '#76933C', '#5F497A', '#31859B', '#E36C09',
  '#7F7F7F', '#0C0C0C', '#1D1B10', '#0F243E', '#244061', '#632423', '#4F6128', '#3F3151', '#205867', '#974806',
];

const STANDARD_COLORS = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0'
];

export const RibbonHomeTab: React.FC<RibbonHomeTabProps> = ({
  theme,
  fontState,
  onChangeFontState,
  paragraphState,
  onChangeParagraphState,
  drawingState,
  onChangeDrawingState,
  onAddNewSlide = () => {},
  onOpenDesigner,
}) => {
  const isDark = theme === 'dark';

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [copiedFlash, setCopiedFlash] = useState(false);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeDropdown = () => setOpenDropdown(null);

  // Common button styling matching Office 365
  const btnHover = isDark
    ? 'hover:bg-[#3B3A39] active:bg-[#484644] text-[#E1DFDD]'
    : 'hover:bg-[#E1DFDD] active:bg-[#C8C6C4] text-[#323130]';
  const btnActive = isDark
    ? 'bg-[#484644] text-white ring-1 ring-[#D83B01]'
    : 'bg-[#C8C6C4] text-black ring-1 ring-[#D83B01]';
  const groupBorder = isDark ? 'border-[#383838]' : 'border-[#EDEBE9]';
  const labelColor = isDark ? 'text-[#8A8886]' : 'text-[#605E5C]';

  return (
    <div
      className={`h-[92px] w-full flex items-center px-1.5 overflow-x-auto no-scrollbar select-none text-xs transition-colors ${
        isDark ? 'bg-[#2B2B2B]' : 'bg-[#FFFFFF]'
      }`}
      onClick={(e) => {
        // Close dropdown when clicking outside
        if (!(e.target as HTMLElement).closest('.office-dropdown-container')) {
          closeDropdown();
        }
      }}
    >
      {/* ================================================================ */}
      {/* 1. CLIPBOARD GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center gap-1.5 h-[62px]">
          {/* Big Paste Split Button */}
          <div className="flex flex-col items-center">
            <OfficeTooltip
              title="Paste (Dán)"
              shortcut="Ctrl+V"
              description="Dán nội dung từ khay nhớ tạm vào trang chiếu."
              vietnameseDesc="Dán văn bản hoặc hình ảnh"
            >
              <button
                type="button"
                onClick={() => {
                  setCopiedFlash(true);
                  setTimeout(() => setCopiedFlash(false), 900);
                }}
                className={`flex flex-col items-center justify-center w-11 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover} ${
                  copiedFlash ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center text-[#D83B01]">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-0.5 text-[10.5px] mt-0.5 font-medium leading-none">
                  <span>Paste</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                </div>
              </button>
            </OfficeTooltip>
          </div>

          {/* Stacked Cut, Copy, Format Painter */}
          <div className="flex flex-col gap-0.5 justify-center">
            <OfficeTooltip title="Cut (Cắt)" shortcut="Ctrl+X" vietnameseDesc="Cắt phần chọn và lưu vào khay nhớ">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>Cut</span>
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Copy (Sao chép)" shortcut="Ctrl+C" vietnameseDesc="Sao chép phần chọn">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </button>
            </OfficeTooltip>

            <OfficeTooltip
              title="Format Painter (Sao chép định dạng)"
              shortcut="Ctrl+Shift+C"
              vietnameseDesc="Sao chép kiểu dáng chữ/khối hình rồi quét vào chỗ khác"
            >
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <Paintbrush className="w-3.5 h-3.5 text-amber-500" />
                <span>Format Painter</span>
              </button>
            </OfficeTooltip>
          </div>
        </div>

        {/* Group bottom label + launcher */}
        <div className="flex items-center justify-between text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Clipboard</span>
          <ExternalLink className={`w-2.5 h-2.5 opacity-40 hover:opacity-100 cursor-pointer ${labelColor}`} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. SLIDES GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center gap-1.5 h-[62px]">
          {/* Big New Slide Button */}
          <div className="relative office-dropdown-container">
            <OfficeTooltip
              title="New Slide (Thêm trang chiếu)"
              shortcut="Ctrl+M"
              description="Thêm một trang chiếu mới vào bài thuyết trình."
              vietnameseDesc="Tạo trang slide mới (Ctrl+M)"
            >
              <button
                type="button"
                onClick={onAddNewSlide}
                className={`flex flex-col items-center justify-center px-2 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
              >
                <div className="relative flex items-center justify-center text-emerald-600">
                  <SquarePlus className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-0.5 text-[10.5px] mt-0.5 font-medium leading-none">
                  <span>New Slide</span>
                  <ChevronDown
                    className="w-2.5 h-2.5 opacity-70 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('newSlide');
                    }}
                  />
                </div>
              </button>
            </OfficeTooltip>

            {/* New Slide Templates dropdown */}
            {openDropdown === 'newSlide' && (
              <div
                className={`absolute top-full left-0 mt-1 w-64 rounded-[4px] shadow-2xl border p-2 z-50 text-xs ${
                  isDark ? 'bg-[#252525] border-[#404040] text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <div className="text-[11px] font-semibold mb-2 text-[#D83B01]">Chọn mẫu bố cục Slide:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Title Slide', desc: 'Trang bìa tiêu đề' },
                    { name: 'Title and Content', desc: 'Tiêu đề & nội dung' },
                    { name: 'Section Header', desc: 'Đầu mục phần' },
                    { name: 'Two Content', desc: '2 cột nội dung' },
                    { name: 'Comparison', desc: 'So sánh 2 nội dung' },
                    { name: 'Blank', desc: 'Trang trắng trống' },
                  ].map((tpl) => (
                    <div
                      key={tpl.name}
                      onClick={() => {
                        onAddNewSlide();
                        closeDropdown();
                      }}
                      className="p-1.5 rounded border border-transparent hover:border-[#D83B01] hover:bg-[#D83B01]/10 cursor-pointer text-center"
                    >
                      <div className="w-full h-8 bg-current/10 rounded mb-1 flex items-center justify-center text-[9px] opacity-60">
                        ■
                      </div>
                      <div className="font-medium text-[11px] truncate">{tpl.name}</div>
                      <div className="text-[9px] opacity-60 truncate">{tpl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stacked Layout, Reset, Section */}
          <div className="flex flex-col gap-0.5 justify-center">
            <OfficeTooltip title="Layout (Bố cục slide)" vietnameseDesc="Thay đổi mẫu bố cục của slide hiện tại">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
                <span>Layout</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Reset (Đặt lại)" vietnameseDesc="Khôi phục kích thước, vị trí các khung về mặc định">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Section (Phần)" vietnameseDesc="Nhóm các slide thành từng phân đoạn">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Section</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </OfficeTooltip>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Slides</span>
          <ExternalLink className={`w-2.5 h-2.5 opacity-40 hover:opacity-100 cursor-pointer ${labelColor}`} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. FONT GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex flex-col justify-center gap-1 h-[62px]">
          {/* Row 1: Font Family + Font Size + Increase/Decrease + Clear formatting */}
          <div className="flex items-center gap-1">
            {/* Font Family Picker */}
            <div className="relative office-dropdown-container">
              <OfficeTooltip title="Phông chữ (Font)" shortcut="Ctrl+Shift+F" vietnameseDesc="Chọn họ phông chữ">
                <button
                  type="button"
                  onClick={() => toggleDropdown('fontFamily')}
                  className={`flex items-center justify-between w-40 h-6 px-2 rounded-[2px] border text-[11.5px] transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1F1F1F] border-[#404040] hover:border-[#606060]'
                      : 'bg-white border-[#D1D1D1] hover:border-[#999999]'
                  }`}
                >
                  <span className="truncate">{fontState.family}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 ml-1 shrink-0" />
                </button>
              </OfficeTooltip>

              {/* Font Family Dropdown */}
              {openDropdown === 'fontFamily' && (
                <div
                  className={`absolute top-full left-0 mt-0.5 w-52 max-h-60 overflow-y-auto rounded-[3px] shadow-2xl border py-1 z-50 text-xs ${
                    isDark ? 'bg-[#252525] border-[#404040] text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {FONTS_LIST.map((font) => (
                    <div
                      key={font}
                      onClick={() => {
                        onChangeFontState({ family: font });
                        closeDropdown();
                      }}
                      className={`px-3 py-1.5 cursor-pointer flex items-center justify-between hover:bg-[#D83B01]/20 ${
                        fontState.family === font ? 'font-bold text-[#D83B01]' : ''
                      }`}
                      style={{ fontFamily: font.split(' ')[0] }}
                    >
                      <span className="truncate">{font}</span>
                      {fontState.family === font && <Check className="w-3.5 h-3.5" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Picker */}
            <div className="relative office-dropdown-container">
              <OfficeTooltip title="Cỡ chữ (Font Size)" shortcut="Ctrl+Shift+P" vietnameseDesc="Đặt kích thước chữ">
                <button
                  type="button"
                  onClick={() => toggleDropdown('fontSize')}
                  className={`flex items-center justify-between w-13 h-6 px-1.5 rounded-[2px] border text-[11.5px] transition-colors tabular-nums cursor-pointer ${
                    isDark
                      ? 'bg-[#1F1F1F] border-[#404040] hover:border-[#606060]'
                      : 'bg-white border-[#D1D1D1] hover:border-[#999999]'
                  }`}
                >
                  <span>{fontState.size}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                </button>
              </OfficeTooltip>

              {/* Font Size Dropdown */}
              {openDropdown === 'fontSize' && (
                <div
                  className={`absolute top-full left-0 mt-0.5 w-18 max-h-60 overflow-y-auto rounded-[3px] shadow-2xl border py-1 z-50 text-xs ${
                    isDark ? 'bg-[#252525] border-[#404040] text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {FONT_SIZES.map((size) => (
                    <div
                      key={size}
                      onClick={() => {
                        onChangeFontState({ size });
                        closeDropdown();
                      }}
                      className={`px-3 py-1 cursor-pointer hover:bg-[#D83B01]/20 tabular-nums ${
                        fontState.size === size ? 'font-bold text-[#D83B01]' : ''
                      }`}
                    >
                      {size}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Increase Font Size */}
            <OfficeTooltip title="Tăng cỡ chữ" shortcut="Ctrl+Shift+>" vietnameseDesc="Tăng kích thước văn bản">
              <button
                type="button"
                onClick={() => onChangeFontState({ size: Math.min(fontState.size + 4, 96) })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] font-bold text-[13px] transition-all cursor-pointer ${btnHover}`}
              >
                <span>A</span>
                <span className="text-[9px] -translate-y-1">▲</span>
              </button>
            </OfficeTooltip>

            {/* Decrease Font Size */}
            <OfficeTooltip title="Giảm cỡ chữ" shortcut="Ctrl+Shift+<" vietnameseDesc="Giảm kích thước văn bản">
              <button
                type="button"
                onClick={() => onChangeFontState({ size: Math.max(fontState.size - 4, 8) })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] font-bold text-[13px] transition-all cursor-pointer ${btnHover}`}
              >
                <span>A</span>
                <span className="text-[9px] translate-y-0.5">▼</span>
              </button>
            </OfficeTooltip>

            {/* Clear All Formatting */}
            <OfficeTooltip title="Clear All Formatting" vietnameseDesc="Xóa toàn bộ định dạng và đưa về mặc định">
              <button
                type="button"
                onClick={() =>
                  onChangeFontState({
                    bold: false,
                    italic: false,
                    underline: false,
                    strikethrough: false,
                    shadow: false,
                    size: 18,
                  })
                }
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${btnHover}`}
              >
                <div className="relative font-bold text-xs">
                  <span>A</span>
                  <div className="absolute -bottom-0.5 -right-1 text-[8px] text-pink-500 font-extrabold">✕</div>
                </div>
              </button>
            </OfficeTooltip>
          </div>

          {/* Row 2: Bold, Italic, Underline, Strikethrough, Shadow, AV, Aa, Highlight, Font Color */}
          <div className="flex items-center gap-0.5">
            {/* Bold */}
            <OfficeTooltip title="In đậm (Bold)" shortcut="Ctrl+B" vietnameseDesc="Làm chữ đậm nét">
              <button
                type="button"
                onClick={() => onChangeFontState({ bold: !fontState.bold })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] font-bold transition-all cursor-pointer ${
                  fontState.bold ? btnActive : btnHover
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
            </OfficeTooltip>

            {/* Italic */}
            <OfficeTooltip title="In nghiêng (Italic)" shortcut="Ctrl+I" vietnameseDesc="Làm chữ nghiêng">
              <button
                type="button"
                onClick={() => onChangeFontState({ italic: !fontState.italic })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] font-italic transition-all cursor-pointer ${
                  fontState.italic ? btnActive : btnHover
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </OfficeTooltip>

            {/* Underline */}
            <OfficeTooltip title="Gạch chân (Underline)" shortcut="Ctrl+U" vietnameseDesc="Gạch một nét dưới chữ">
              <button
                type="button"
                onClick={() => onChangeFontState({ underline: !fontState.underline })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                  fontState.underline ? btnActive : btnHover
                }`}
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </OfficeTooltip>

            {/* Strikethrough */}
            <OfficeTooltip title="Gạch ngang chữ (Strikethrough)" vietnameseDesc="Gạch ngang qua từ">
              <button
                type="button"
                onClick={() => onChangeFontState({ strikethrough: !fontState.strikethrough })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                  fontState.strikethrough ? btnActive : btnHover
                }`}
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </OfficeTooltip>

            {/* Text Shadow */}
            <OfficeTooltip title="Đổ bóng chữ (Text Shadow)" vietnameseDesc="Tạo hiệu ứng bóng mờ phía sau chữ">
              <button
                type="button"
                onClick={() => onChangeFontState({ shadow: !fontState.shadow })}
                className={`w-6 h-6 flex items-center justify-center rounded-[2px] font-bold text-xs transition-all cursor-pointer ${
                  fontState.shadow ? btnActive : btnHover
                }`}
              >
                <span className="drop-shadow-md">S</span>
              </button>
            </OfficeTooltip>

            {/* Character Spacing AV */}
            <OfficeTooltip title="Khoảng cách chữ (Character Spacing)" vietnameseDesc="Điều chỉnh khoảng cách giữa các chữ cái">
              <button type="button" className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] text-[10px] font-semibold transition-all cursor-pointer ${btnHover}`}>
                <span>AV</span>
                <span className="text-[7px]">↔</span>
              </button>
            </OfficeTooltip>

            {/* Change Case Aa */}
            <OfficeTooltip title="Đổi kiểu hoa thường (Change Case)" shortcut="Shift+F3" vietnameseDesc="Đổi chữ hoa, chữ thường">
              <button type="button" className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] text-[11px] font-semibold transition-all cursor-pointer ${btnHover}`}>
                <span>Aa</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </OfficeTooltip>

            {/* Text Highlight Color */}
            <div className="relative office-dropdown-container">
              <OfficeTooltip title="Màu bôi sáng (Highlight)" vietnameseDesc="Tô màu nền nổi bật như bút nhớ dòng">
                <button
                  type="button"
                  onClick={() => toggleDropdown('highlight')}
                  className={`w-7 h-6 flex flex-col items-center justify-center rounded-[2px] transition-all cursor-pointer ${btnHover}`}
                >
                  <Highlighter className="w-3 h-3 text-amber-500" />
                  <div className="w-4 h-1 bg-yellow-400 rounded-xs mt-0.5" />
                </button>
              </OfficeTooltip>
            </div>

            {/* Font Color */}
            <div className="relative office-dropdown-container">
              <OfficeTooltip title="Màu chữ (Font Color)" vietnameseDesc="Thay đổi màu sắc văn bản">
                <button
                  type="button"
                  onClick={() => toggleDropdown('fontColor')}
                  className={`w-7 h-6 flex flex-col items-center justify-center rounded-[2px] transition-all cursor-pointer ${btnHover}`}
                >
                  <span className="font-bold text-xs leading-none">A</span>
                  <div
                    className="w-4 h-1 rounded-xs mt-0.5"
                    style={{ backgroundColor: fontState.fontColor }}
                  />
                </button>
              </OfficeTooltip>

              {/* Color Palette Popover */}
              {openDropdown === 'fontColor' && (
                <div
                  className={`absolute top-full left-0 mt-1 p-2 rounded-[4px] shadow-2xl border z-50 w-56 ${
                    isDark ? 'bg-[#252525] border-[#404040] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-semibold mb-1 opacity-70">Theme Colors (Màu chủ đề)</div>
                  <div className="grid grid-cols-10 gap-1 mb-2">
                    {THEME_COLORS.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onChangeFontState({ fontColor: c });
                          closeDropdown();
                        }}
                        className="w-4 h-4 rounded-xs border border-black/20 hover:scale-125 cursor-pointer transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] font-semibold mb-1 opacity-70">Standard Colors (Màu chuẩn)</div>
                  <div className="grid grid-cols-10 gap-1">
                    {STANDARD_COLORS.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onChangeFontState({ fontColor: c });
                          closeDropdown();
                        }}
                        className="w-4 h-4 rounded-xs border border-black/20 hover:scale-125 cursor-pointer transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Font</span>
          <ExternalLink className={`w-2.5 h-2.5 opacity-40 hover:opacity-100 cursor-pointer ${labelColor}`} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. PARAGRAPH GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center gap-1.5 h-[62px]">
          {/* Sub-grid with alignment & bullets */}
          <div className="flex flex-col justify-center gap-1">
            {/* Row 1: Bullets, Numbering, Decrease/Increase Indent, Line Spacing */}
            <div className="flex items-center gap-0.5">
              <OfficeTooltip title="Gạch đầu dòng (Bullets)" vietnameseDesc="Tạo danh sách các ý với dấu chấm">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ bullets: !paragraphState.bullets })}
                  className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.bullets ? btnActive : btnHover
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2 h-2 opacity-60" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Đánh số thứ tự (Numbering)" vietnameseDesc="Tạo danh sách đánh số 1, 2, 3">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ numbering: !paragraphState.numbering })}
                  className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.numbering ? btnActive : btnHover
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2 h-2 opacity-60" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Giảm lùi dòng (Decrease Indent)" vietnameseDesc="Giảm khoảng cách lề">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ indent: Math.max(0, paragraphState.indent - 1) })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${btnHover}`}
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Tăng lùi dòng (Increase Indent)" vietnameseDesc="Tăng khoảng cách lề">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ indent: paragraphState.indent + 1 })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${btnHover}`}
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Giãn dòng (Line Spacing)" vietnameseDesc="Khoảng cách giữa các dòng chữ (1.0, 1.5, 2.0)">
                <button type="button" className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] transition-all cursor-pointer ${btnHover}`}>
                  <span className="text-[10px] font-bold">↕=</span>
                  <ChevronDown className="w-2 h-2 opacity-60" />
                </button>
              </OfficeTooltip>
            </div>

            {/* Row 2: Align Left, Center, Align Right, Justify, Columns */}
            <div className="flex items-center gap-0.5">
              <OfficeTooltip title="Căn lề trái (Align Left)" shortcut="Ctrl+L" vietnameseDesc="Căn thẳng văn bản về bên trái">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ align: 'left' })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.align === 'left' ? btnActive : btnHover
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Căn giữa (Center)" shortcut="Ctrl+E" vietnameseDesc="Căn văn bản vào chính giữa slide">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ align: 'center' })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.align === 'center' ? btnActive : btnHover
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Căn lề phải (Align Right)" shortcut="Ctrl+R" vietnameseDesc="Căn thẳng văn bản về bên phải">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ align: 'right' })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.align === 'right' ? btnActive : btnHover
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Căn đều hai bên (Justify)" shortcut="Ctrl+J" vietnameseDesc="Căn thẳng hai bên mép đoạn văn">
                <button
                  type="button"
                  onClick={() => onChangeParagraphState({ align: 'justify' })}
                  className={`w-6 h-6 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                    paragraphState.align === 'justify' ? btnActive : btnHover
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </OfficeTooltip>

              <OfficeTooltip title="Chia cột văn bản (Columns)" vietnameseDesc="Chia văn bản thành 2 hoặc 3 cột">
                <button type="button" className={`w-7 h-6 flex items-center justify-center gap-0.5 rounded-[2px] transition-all cursor-pointer ${btnHover}`}>
                  <Columns2 className="w-3.5 h-3.5" />
                  <ChevronDown className="w-2 h-2 opacity-60" />
                </button>
              </OfficeTooltip>
            </div>
          </div>

          {/* Stacked: Text Direction, Align Text, Convert to SmartArt */}
          <div className="flex flex-col gap-0.5 justify-center pl-1 border-l border-current/15">
            <OfficeTooltip title="Hướng chữ (Text Direction)" vietnameseDesc="Xoay hướng chữ ngang hoặc dọc">
              <button type="button" className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10.5px] transition-all cursor-pointer ${btnHover}`}>
                <span className="text-[10px] font-bold">↳A</span>
                <span>Text Direction</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Căn lề dọc (Align Text)" vietnameseDesc="Căn vị trí trên, giữa, dưới trong hộp chữ">
              <button type="button" className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10.5px] transition-all cursor-pointer ${btnHover}`}>
                <span className="text-[10px] font-bold">⬍</span>
                <span>Align Text</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Convert to SmartArt" vietnameseDesc="Chuyển văn bản thành sơ đồ khối thông minh">
              <button type="button" className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10.5px] text-emerald-500 font-medium transition-all cursor-pointer ${btnHover}`}>
                <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                <span>Convert to SmartArt</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
              </button>
            </OfficeTooltip>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Paragraph</span>
          <ExternalLink className={`w-2.5 h-2.5 opacity-40 hover:opacity-100 cursor-pointer ${labelColor}`} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 5. DRAWING GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center gap-2 h-[62px]">
          {/* Quick Shapes Palette */}
          <div className="flex items-center gap-0.5">
            <div className="grid grid-cols-6 grid-rows-2 gap-1 p-1 rounded-[3px] border border-current/15">
              {[
                { icon: <span className="font-bold text-[10px]">A</span>, name: 'Text Box' },
                { icon: <Minus className="w-3 h-3" />, name: 'Line' },
                { icon: <ArrowRight className="w-3 h-3" />, name: 'Arrow' },
                { icon: <Square className="w-3 h-3" />, name: 'Rectangle' },
                { icon: <div className="w-3 h-2.5 border border-current rounded-xs" />, name: 'Rounded Rect' },
                { icon: <Circle className="w-3 h-3" />, name: 'Oval' },
                { icon: <Triangle className="w-3 h-3" />, name: 'Triangle' },
                { icon: <div className="w-3 h-3 border-b-2 border-r-2" />, name: 'Right Triangle' },
                { icon: <div className="w-3 h-2.5 border border-current" />, name: 'Parallelogram' },
                { icon: <div className="w-3 h-3 border border-current rotate-45 scale-75" />, name: 'Diamond' },
                { icon: <Star className="w-3 h-3" />, name: '5-Point Star' },
                { icon: <span className="text-[10px]">♥</span>, name: 'Heart' },
              ].map((s, idx) => (
                <OfficeTooltip key={idx} title={s.name} vietnameseDesc="Nhấn để chọn và vẽ hình lên slide">
                  <button
                    type="button"
                    onClick={() => onChangeDrawingState({ selectedShape: s.name })}
                    className={`w-5 h-5 flex items-center justify-center rounded-[2px] transition-all cursor-pointer ${
                      drawingState.selectedShape === s.name ? btnActive : btnHover
                    }`}
                  >
                    {s.icon}
                  </button>
                </OfficeTooltip>
              ))}
            </div>

            {/* Quick Shape Scroll buttons */}
            <div className="flex flex-col justify-center gap-0.5">
              <button type="button" className={`p-0.5 rounded-[2px] transition-colors cursor-pointer ${btnHover}`}>
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
              <button type="button" className={`p-0.5 rounded-[2px] transition-colors cursor-pointer ${btnHover}`}>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Arrange & Quick Styles */}
          <div className="flex flex-col gap-1 justify-center">
            <OfficeTooltip title="Arrange (Sắp xếp lớp)" vietnameseDesc="Đưa lên trên, xuống dưới, căn thẳng hàng các đối tượng">
              <button type="button" className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-[11px] font-medium transition-all cursor-pointer ${btnHover}`}>
                <Boxes className="w-3.5 h-3.5 text-amber-500" />
                <span>Arrange</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </OfficeTooltip>

            <OfficeTooltip title="Quick Styles (Kiểu định dạng nhanh)" vietnameseDesc="Áp dụng mẫu màu và viền có sẵn cho hình khối">
              <button type="button" className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-[11px] font-medium transition-all cursor-pointer ${btnHover}`}>
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Quick Styles</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
            </OfficeTooltip>
          </div>

          {/* Shape Fill, Shape Outline, Shape Effects */}
          <div className="flex flex-col gap-0.5 justify-center">
            {/* Shape Fill */}
            <div className="relative office-dropdown-container">
              <OfficeTooltip title="Shape Fill (Tô màu hình)" vietnameseDesc="Đổ màu nền cho hình khối được chọn">
                <button
                  type="button"
                  onClick={() => toggleDropdown('shapeFill')}
                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[10.5px] transition-all cursor-pointer ${btnHover}`}
                >
                  <PaintBucket className="w-3.5 h-3.5 text-blue-500" />
                  <span>Shape Fill</span>
                  <div
                    className="w-2 h-2 rounded-xs border border-white/40 ml-auto"
                    style={{ backgroundColor: drawingState.shapeFill }}
                  />
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>
              </OfficeTooltip>

              {/* Shape Fill Color Dropdown */}
              {openDropdown === 'shapeFill' && (
                <div
                  className={`absolute top-full left-0 mt-1 p-2 rounded-[4px] shadow-2xl border z-50 w-56 ${
                    isDark ? 'bg-[#252525] border-[#404040] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-semibold mb-1 opacity-70">Theme Colors (Màu chủ đề)</div>
                  <div className="grid grid-cols-10 gap-1 mb-2">
                    {THEME_COLORS.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          onChangeDrawingState({ shapeFill: c });
                          closeDropdown();
                        }}
                        className="w-4 h-4 rounded-xs border border-black/20 hover:scale-125 cursor-pointer transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shape Outline */}
            <OfficeTooltip title="Shape Outline (Đường viền hình)" vietnameseDesc="Đổi màu sắc, độ dày của đường viền">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[10.5px] transition-all cursor-pointer ${btnHover}`}>
                <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                <span>Shape Outline</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
              </button>
            </OfficeTooltip>

            {/* Shape Effects */}
            <OfficeTooltip title="Shape Effects (Hiệu ứng hình khối)" vietnameseDesc="Tạo bóng đổ, phát sáng, viền mềm, hiệu ứng 3D">
              <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[10.5px] transition-all cursor-pointer ${btnHover}`}>
                <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shape Effects</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
              </button>
            </OfficeTooltip>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Drawing</span>
          <ExternalLink className={`w-2.5 h-2.5 opacity-40 hover:opacity-100 cursor-pointer ${labelColor}`} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* 6. EDITING GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex flex-col gap-0.5 justify-center h-[62px]">
          <OfficeTooltip title="Find and Replace" shortcut="Ctrl+F" vietnameseDesc="Tìm kiếm văn bản trong bài">
            <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>Find and Replace</span>
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Replace Fonts (Thay thế phông)" shortcut="Ctrl+H" vietnameseDesc="Thay thế toàn bộ một font chữ">
            <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
              <Replace className="w-3.5 h-3.5 text-emerald-500" />
              <span>Replace Fonts</span>
            </button>
          </OfficeTooltip>

          <OfficeTooltip title="Select (Chọn đối tượng)" vietnameseDesc="Chọn toàn bộ hoặc mở bảng Selection Pane">
            <button type="button" className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] text-[11px] transition-all cursor-pointer ${btnHover}`}>
              <MousePointer className="w-3.5 h-3.5 text-slate-400" />
              <span>Select</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-auto" />
            </button>
          </OfficeTooltip>
        </div>

        <div className="text-[10px] px-0.5 leading-none">
          <span className={`${labelColor}`}>Editing</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 7. VOICE (DICTATE) GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center justify-center h-[62px]">
          <OfficeTooltip
            title="Dictate (Nhập bằng giọng nói)"
            shortcut="Alt+`"
            description="Nói vào micro để PowerPoint tự động gõ văn bản."
            vietnameseDesc="Gõ chữ bằng giọng nói"
          >
            <button type="button" className={`flex flex-col items-center justify-center w-12 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <div className="relative text-blue-500">
                <Mic className="w-5 h-5" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full absolute -top-0.5 -right-0.5" />
              </div>
              <span className="text-[10.5px] mt-0.5 font-medium leading-none">Dictate</span>
            </button>
          </OfficeTooltip>
        </div>

        <div className="text-[10px] text-center leading-none">
          <span className={`${labelColor}`}>Voice</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 8. SENSITIVITY GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center justify-center h-[62px]">
          <OfficeTooltip
            title="Sensitivity (Bảo mật tài liệu)"
            description="Gắn nhãn bảo mật dữ liệu doanh nghiệp / trường học."
            vietnameseDesc="Đặt mức độ bảo mật nội dung"
          >
            <button type="button" className={`flex flex-col items-center justify-center w-14 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <div className="flex items-center gap-0.5 text-[10.5px] mt-0.5 font-medium leading-none">
                <span>Sensitivity</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </div>
            </button>
          </OfficeTooltip>
        </div>

        <div className="text-[10px] text-center leading-none">
          <span className={`${labelColor}`}>Sensitivity</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 9. ADD-INS GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 border-r ${groupBorder} shrink-0`}>
        <div className="flex items-center justify-center h-[62px]">
          <OfficeTooltip
            title="Add-ins (Tiện ích mở rộng)"
            description="Cài đặt thêm các công cụ bổ trợ cho PowerPoint từ Office Store."
            vietnameseDesc="Kho ứng dụng tiện ích bổ sung"
          >
            <button type="button" className={`flex flex-col items-center justify-center w-12 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}>
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 text-emerald-500">
                <div className="bg-blue-500 rounded-2xs" />
                <div className="bg-green-500 rounded-2xs" />
                <div className="bg-amber-500 rounded-2xs" />
                <div className="bg-purple-500 rounded-2xs" />
              </div>
              <span className="text-[10.5px] mt-1 font-medium leading-none">Add-ins</span>
            </button>
          </OfficeTooltip>
        </div>

        <div className="text-[10px] text-center leading-none">
          <span className={`${labelColor}`}>Add-ins</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 10. DESIGNER GROUP */}
      {/* ================================================================ */}
      <div className={`flex flex-col justify-between h-full py-1 px-1.5 shrink-0`}>
        <div className="flex items-center justify-center h-[62px]">
          <OfficeTooltip
            title="Designer (Thiết kế thông minh)"
            description="Tự động gợi ý bố cục slide đẹp mắt theo nội dung bài thuyết trình."
            vietnameseDesc="Gợi ý thiết kế slide tự động thông minh"
          >
            <button
              type="button"
              onClick={onOpenDesigner}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-[3px] transition-all cursor-pointer ${btnHover}`}
            >
              <div className="relative text-amber-500">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              </div>
              <span className="text-[10.5px] mt-0.5 font-medium leading-none">Designer</span>
            </button>
          </OfficeTooltip>
        </div>

        <div className="text-[10px] text-center leading-none">
          <span className={`${labelColor}`}>Designer</span>
        </div>
      </div>
    </div>
  );
};
export default RibbonHomeTab;
