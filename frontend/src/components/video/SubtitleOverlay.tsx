import type { MouseEvent } from 'react';

// 1. Định nghĩa cấu trúc của dòng phụ đề hiện tại
export interface SubtitleLine {
  japanese?: string;
  vietnamese?: string;
}

// 2. Định nghĩa Props cho Component
interface SubtitleOverlayProps {
  currentLine: SubtitleLine | null;
  onWordSelect: (word: string, position: { x: number; y: number }) => void;
}

export default function SubtitleOverlay({ currentLine, onWordSelect }: SubtitleOverlayProps) {
  if (!currentLine) return null;

  // 3. Khai báo kiểu cho event (e) và tham số (word)
  const handleWordClick = (e: MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    const target = e.target as HTMLSpanElement; // Ép kiểu an toàn
    const rect = target.getBoundingClientRect();
    onWordSelect(word, { x: rect.left, y: rect.bottom });
  };

  const renderSegments = () => {
    const text = currentLine.japanese || '';
    if (!text) return null;
    
    try {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));
      return (
        <span className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
          {segments.map((seg, i) => {
            if (seg.segment.trim() === '') return <span key={i}>{seg.segment}</span>;
            return (
              <span
                key={i}
                className="cursor-pointer hover:text-[#ff6b9d] hover:underline decoration-[#ff6b9d] underline-offset-4 transition-colors px-0.5 rounded"
                onClick={(e) => handleWordClick(e, seg.segment)}
              >
                {seg.segment}
              </span>
            );
          })}
        </span>
      );
    } catch (e) {
      // Fallback
      const segments = text.split(/(\s+)/);
      return (
        <span className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
          {segments.map((seg, i) => (
             <span key={i} onClick={(e) => handleWordClick(e, seg)} className="cursor-pointer hover:text-[#ff6b9d]">{seg}</span>
          ))}
        </span>
      );
    }
  };

  return (
    <div className="text-center py-4 px-6">
      <div className="mb-2">
        {renderSegments()}
      </div>
      <p className="text-[#ff6b9d] text-base md:text-lg">{currentLine.vietnamese}</p>
    </div>
  );
}