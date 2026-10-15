import React, { useState } from 'react';

interface OfficeTooltipProps {
  title: string;
  shortcut?: string;
  description?: string;
  vietnameseDesc?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'right';
  className?: string;
}

export const OfficeTooltip: React.FC<OfficeTooltipProps> = ({
  title,
  shortcut,
  description,
  vietnameseDesc,
  children,
  position = 'bottom',
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setVisible(true);
    }, 450);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setVisible(false);
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none transition-opacity duration-150 shadow-xl rounded-[3px] border px-2.5 py-1.5 text-xs text-left max-w-[260px] whitespace-normal bg-[#252526] text-[#cccccc] border-[#454545] dark:bg-[#1f1f1f] dark:text-[#f3f2f1] dark:border-[#3c3c3c] ${
            position === 'bottom'
              ? 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2'
              : position === 'top'
              ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2'
              : 'left-[calc(100%+6px)] top-1/2 -translate-y-1/2'
          }`}
          style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}
        >
          <div className="font-semibold text-slate-100 flex items-center gap-1.5 leading-snug">
            <span>{title}</span>
            {shortcut && (
              <span className="text-[11px] font-normal text-slate-400">({shortcut})</span>
            )}
          </div>
          {(description || vietnameseDesc) && (
            <div className="mt-1 text-[11px] text-slate-300 leading-tight">
              {description}
              {vietnameseDesc && (
                <div className="text-[10px] text-amber-300/90 mt-0.5 font-medium">
                  💡 {vietnameseDesc}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default OfficeTooltip;
