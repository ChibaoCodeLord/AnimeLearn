import type { MouseEvent } from 'react';

export interface SubtitleLine {
  japanese?: string;
  vietnamese?: string;
}

export interface PopupAnchorPosition {
  x: number;
  y: number;
  anchorTop?: number;
  anchorBottom?: number;
  anchorLeft?: number;
  anchorRight?: number;
}

interface SubtitleOverlayProps {
  currentLine: SubtitleLine | null;
  onWordSelect: (word: string, position: PopupAnchorPosition) => void;
}

export default function SubtitleOverlay({
  currentLine,
  onWordSelect,
}: SubtitleOverlayProps) {
  if (!currentLine) return null;

  const handleWordClick = (e: MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();

    if (!word.trim()) return;

    const rect = e.currentTarget.getBoundingClientRect();

    onWordSelect(word, {
      x: rect.left + rect.width / 2,
      y: rect.bottom,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
      anchorLeft: rect.left,
      anchorRight: rect.right,
    });
  };

  const wordClassName = `
    inline-block
    px-1 py-0.5
    rounded-md
    cursor-pointer
    text-slate-100
    underline decoration-emerald-400 decoration-2 underline-offset-[5px]
    transition-colors duration-150
    hover:bg-emerald-400/20
    hover:text-emerald-200
    hover:decoration-emerald-300
  `;

  const renderSegments = () => {
    const text = currentLine.japanese || '';
    if (!text) return null;

    try {
      const segmenter = new Intl.Segmenter('ja', {
        granularity: 'word',
      });

      const segments = Array.from(segmenter.segment(text));

      return segments.map((seg, i) => {
        if (seg.segment.trim() === '') {
          return <span key={i}>{seg.segment}</span>;
        }

        return (
          <span
            key={i}
            className={wordClassName}
            onClick={(e) => handleWordClick(e, seg.segment)}
          >
            {seg.segment}
          </span>
        );
      });
    } catch {
      const segments = text.split(/(\s+)/);

      return segments.map((seg, i) => {
        if (seg.trim() === '') {
          return <span key={i}>{seg}</span>;
        }

        return (
          <span
            key={i}
            className={wordClassName}
            onClick={(e) => handleWordClick(e, seg)}
          >
            {seg}
          </span>
        );
      });
    }
  };

  return (
    <div className="w-full h-full flex">
      <div
        className="
          w-full h-full
          border border-white/10
          bg-slate-800
          px-4 py-4 md:px-6 md:py-3
          text-center
          shadow-sm
          flex flex-col items-center justify-center
        "
      >
        <div
          className="
            max-w-5xl
            text-lg md:text-xl
            font-semibold
            leading-relaxed
            tracking-wide
            text-slate-100
            break-words
          "
        >
          {renderSegments()}
        </div>

        {currentLine.vietnamese && (
          <p
            className="
              max-w-5xl
              mt-2
              text-sm md:text-lg
              font-medium
              leading-relaxed
              text-slate-300
              wrap-anywhere
            "
          >
            {currentLine.vietnamese}
          </p>
        )}
      </div>
    </div>
  );
}