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
  currentFurigana: string;
  onWordSelect: (word: string, position: PopupAnchorPosition) => void;
}

export default function SubtitleOverlay({
  currentLine,
  currentFurigana,
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

  // 🚀 HÀM PHỤ: Bóc chữ Kanji ra khỏi thẻ HTML để gọi hàm tra từ điển
  const extractKanjiFromRuby = (htmlString: string) => {
    return htmlString
      .replace(/<r[pt]>[\s\S]*?<\/r[pt]>/g, '') // Xóa phần chữ nhỏ Furigana
      .replace(/<[^>]+>/g, '') // Xóa thẻ <ruby>
      .trim();
  };

  const renderSegments = () => {
    // ==========================================
    // NẾU CÓ FURIGANA: Băm nhỏ chuỗi HTML ra để bọc thẻ Span
    // ==========================================
    if (currentFurigana) {
      // Dùng Regex tách các cụm Kanji (<ruby>) ra khỏi chữ Hiragana bình thường
      const parts = currentFurigana.split(/(<ruby>[\s\S]*?<\/ruby>)/);

      return parts.map((part, index) => {
        if (!part) return null;

        // Nếu là cụm Kanji có Furigana -> Bọc vào Span mang class hover gốc
        if (part.startsWith('<ruby>')) {
          const word = extractKanjiFromRuby(part);
          return (
            <span
              key={`ruby-${index}`}
              className={`
                ${wordClassName}
                [&_ruby]:mx-[1px]
                [&_rt]:text-[0.65em]
                [&_rt]:font-bold
                [&_rt]:text-emerald-500
                [&_rt]:pb-[4px]
                [&_rt]:tracking-normal
                [&_rt]:pointer-events-none 
              `}
              onClick={(e) => handleWordClick(e, word)}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }

        // Nếu là chữ Hiragana/Trợ từ bình thường -> Cho đi qua máy chém Segmenter gốc của ông
        try {
          const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
          const segments = Array.from(segmenter.segment(part));

          return segments.map((seg, i) => {
            if (seg.segment.trim() === '') {
              return <span key={`text-${index}-${i}`}>{seg.segment}</span>;
            }
            return (
              <span
                key={`text-${index}-${i}`}
                className={wordClassName}
                onClick={(e) => handleWordClick(e, seg.segment)}
              >
                {seg.segment}
              </span>
            );
          });
        } catch {
          const segments = part.split(/(\s+)/);
          return segments.map((seg, i) => {
            if (seg.trim() === '') {
              return <span key={`text-${index}-${i}`}>{seg}</span>;
            }
            return (
              <span
                key={`text-${index}-${i}`}
                className={wordClassName}
                onClick={(e) => handleWordClick(e, seg)}
              >
                {seg}
              </span>
            );
          });
        }
      });
    }

    // ==========================================
    // LOGIC GỐC CỦA ÔNG (Khi chưa load xong Furigana)
    // ==========================================
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
          {/* TRẢ LẠI GỌI HÀM GỐC */}
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