export type RibbonTabId =
  | 'file'
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'transitions'
  | 'animations'
  | 'slideshow'
  | 'record'
  | 'review'
  | 'view'
  | 'help'
  | 'ispring'
  | 'shapeformat';

export interface FontState {
  family: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  shadow: boolean;
  charSpacing: string;
  caseType: string;
  highlightColor: string;
  fontColor: string;
}

export interface ParagraphState {
  align: 'left' | 'center' | 'right' | 'justify';
  bullets: boolean;
  numbering: boolean;
  indent: number;
  lineSpacing: number;
  textDirection: string;
  alignText: string;
}

export interface DrawingState {
  selectedShape: string;
  shapeFill: string;
  shapeOutline: string;
  shapeEffects: string;
}
