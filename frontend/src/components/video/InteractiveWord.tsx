import { useState } from "react";
import type { WordToken } from "../../types/index.js";

export default function InteractiveWord({ token }: { token: WordToken }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!token.isKeyWord) {
    return <span className="text-slate-200 text-lg">{token.text}</span>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(token.text);
    alert(`Đã copy: ${token.text}`);
  };

  const handleSave = () => {
    alert(`Đã lưu từ: ${token.text} vào sổ tay!`);
  };

  return (
    <div className="relative inline-block" onMouseLeave={() => setShowTooltip(false)}>
      <span 
        className="text-white text-lg font-medium underline decoration-dashed decoration-slate-400 underline-offset-4 cursor-pointer hover:bg-slate-700 hover:text-blue-300 transition-colors px-1 rounded"
        onMouseEnter={() => setShowTooltip(true)}
      >
        {token.text}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xl font-bold">{token.text}</p>
              {token.reading && <p className="text-sm text-slate-500">{token.reading}</p>}
            </div>
            {token.jlptLevel && (
              <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {token.jlptLevel}
              </span>
            )}
          </div>
          <p className="text-sm font-medium mb-3">{token.meaning}</p>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 transition">
              ⭐ Lưu từ
            </button>
            <button onClick={handleCopy} className="flex-1 bg-slate-200 text-slate-800 text-xs py-1.5 rounded hover:bg-slate-300 transition">
              📋 Copy
            </button>
          </div>
          {/* Mũi tên tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white"></div>
        </div>
      )}
    </div>
  );
}