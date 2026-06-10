import type { WordData } from './types';

export default function ExampleSentence({ word }: { word: WordData }) {
  void word;
  // Tùy thuộc vào Database của bạn có chứa ví dụ hay không. 
  // Dưới đây là UI chuẩn để hiển thị ví dụ nếu có data.
  return (
    <div className="mt-8 pt-8 border-t border-slate-100">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ví dụ (Examples)</h3>
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
         <p className="text-slate-500 italic text-sm font-medium text-center">
            (Tính năng ví dụ câu đang được cập nhật...)
         </p>
      </div>
    </div>
  );
}
