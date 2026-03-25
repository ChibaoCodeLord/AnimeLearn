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

  const segments = (currentLine.japanese || '').split(/(\s+)/);

  return (
    <div className="text-center py-4 px-6">
      <div className="mb-2">
        <span className="text-xl md:text-2xl font-medium text-white leading-relaxed">
          {/* 4. Khai báo kiểu cho seg và i trong vòng lặp map */}
          {segments.map((seg: string, i: number) => {
            if (seg.trim() === '') return <span key={i}>{seg}</span>;
            return (
              <span
                key={i}
                className="cursor-pointer hover:text-[#ff6b9d] hover:underline decoration-[#ff6b9d] underline-offset-4 transition-colors"
                onClick={(e) => handleWordClick(e, seg)}
              >
                {seg}
              </span>
            );
          })}
        </span>
      </div>
      <p className="text-[#ff6b9d] text-base md:text-lg">{currentLine.vietnamese}</p>
    </div>
  );
}