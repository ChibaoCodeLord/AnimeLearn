import React, { useState } from 'react';
import { BookOpen, BookmarkPlus, Loader2, Volume2, X, ArrowLeft, SpellCheck2, LayoutList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Bảng màu JLPT
const jlptBadgeColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-rose-100 text-rose-700 border-rose-200',
  Unknown: 'bg-slate-100 text-slate-600 border-slate-200'
};

interface VocabularyTabProps {
  vocabList: any[];
}

export default function VocabularyTab({ vocabList }: VocabularyTabProps) {
  const [selectedVocab, setSelectedVocab] = useState<any | null>(null);
  const [selectedKanji, setSelectedKanji] = useState<any | null>(null);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  // 1. Logic lọc từ không phải tiếng Nhật (Chỉ lấy Hiragana, Katakana, Kanji)
  const isJapaneseWord = (word: string) => {
    // Regex kiểm tra xem chuỗi có chứa ít nhất 1 ký tự tiếng Nhật không
    return /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(word);
  };

  const filteredVocabList = vocabList.filter(v => isJapaneseWord(v.word));

  // 2. Logic Lưu từ vựng
  const handleSave = async (vocab: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingMap(prev => ({ ...prev, [vocab.word]: true }));
    
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        word: vocab.word,
        reading: vocab.reading || '',
        meaning_vi: vocab.meaning || '',
        part_of_speech: vocab.pos || '',
        jlpt_level: vocab.jlpt_level || 'Unknown',
        kanji_info: vocab.kanji_info || []
      };

      const res = await fetch('http://localhost:5000/api/video/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) toast.success(`Đã lưu "${vocab.word}" vào sổ tay!`);
      else toast.info(data.message || 'Lỗi khi lưu.');
    } catch (error) {
      toast.error('Lỗi kết nối khi lưu!');
    } finally {
      setSavingMap(prev => ({ ...prev, [vocab.word]: false }));
    }
  };

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Đóng modal
  const closeModal = () => {
    setSelectedVocab(null);
    setSelectedKanji(null);
  };

  // Tách và định dạng nghĩa Kanji
  const formatKanjiDetail = (detailStr: string) => {
    if (!detailStr) return [];
    // Cắt theo dấu phẩy hoặc chấm phẩy
    return detailStr.split(/[,;]/).map(d => d.trim()).filter(Boolean);
  };

  return (
    <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 shadow-sm h-full p-4 md:p-6 overflow-y-auto custom-scrollbar min-h-[500px]">
      
      {/* ======================================================== */}
      {/* 1. DANH SÁCH CARD TỪ VỰNG */}
      {/* ======================================================== */}
      {filteredVocabList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
          <BookOpen className="w-16 h-16 mb-4 text-slate-300" />
          <p className="font-medium">Chưa có từ vựng tiếng Nhật nào được tìm thấy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocabList.map((vocab, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedVocab(vocab)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-violet-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-0.5 uppercase tracking-widest">{vocab.reading || '---'}</p>
                    <h3 className="text-3xl font-black text-slate-800">{vocab.word}</h3>
                  </div>
                  {vocab.pos && (
                    <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                      {vocab.pos}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 font-medium line-clamp-2">{vocab.meaning}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-1 text-slate-400">
                  {vocab.kanji_info && vocab.kanji_info.map((k: any, i: number) => (
                    <span key={i} className="text-base font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded">{k.kanji}</span>
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  onClick={(e) => handleSave(vocab, e)}
                  disabled={savingMap[vocab.word]}
                  className="bg-violet-100 hover:bg-violet-600 text-violet-700 hover:text-white rounded-xl font-bold border-0 transition-colors"
                >
                  {savingMap[vocab.word] ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-1.5" />}
                  Lưu
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MODAL CHI TIẾT (VOCAB & KANJI) */}
      {/* ======================================================== */}
      {selectedVocab && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 transition-all"
          onClick={closeModal}
        >
          <div 
            className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[85vh] md:h-[70vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            
            {/* --- CỘT TRÁI: NỘI DUNG CHÍNH (Từ vựng hoặc Kanji chi tiết) --- */}
            <div className="flex-1 flex flex-col relative bg-[#fcfcfd]">
              {/* Nút tắt góc trái (Mobile) hoặc không gian trống */}
              <button onClick={closeModal} className="md:hidden absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10">
                <X className="w-5 h-5 text-slate-500" />
              </button>

              {selectedKanji ? (
                // VIEW 2: CHI TIẾT KANJI
                <div className="flex-1 flex flex-col h-full overflow-hidden overscroll-contain animate-in slide-in-from-right-4 duration-300">
                  <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-b border-rose-100 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedKanji(null)} className="mb-4 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 -ml-2">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại từ vựng
                    </Button>
                    <div className="flex items-end gap-6">
                      <div className="text-8xl md:text-[120px] font-black text-rose-600 leading-none drop-shadow-sm select-none">
                        {selectedKanji.kanji}
                      </div>
                      <div className="pb-2">
                        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{selectedKanji.mean}</h2>
                        <div className="flex gap-2">
                          <Badge className="bg-rose-100 text-rose-700 border-none font-bold">N{selectedKanji.level}</Badge>
                          <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 font-bold">{selectedKanji.stroke_count} nét</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    {/* Kun/On */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3 flex items-center"><Volume2 className="w-3.5 h-3.5 mr-1.5"/> Âm KUN (Âm Nhật)</p>
                        <p className="text-lg font-medium text-slate-700">{selectedKanji.kun || 'Không có'}</p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-3 flex items-center"><Volume2 className="w-3.5 h-3.5 mr-1.5"/> Âm ON (Âm Hán)</p>
                        <p className="text-lg font-medium text-slate-700">{selectedKanji.on || 'Không có'}</p>
                      </div>
                    </div>

                    {/* Ý nghĩa chi tiết (Cách dòng đẹp) */}
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                        <SpellCheck2 className="w-4 h-4 mr-2"/> Ý nghĩa chi tiết
                      </p>
                      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        {formatKanjiDetail(selectedKanji.detail).length > 0 ? (
                          <ul className="space-y-4">
                            {formatKanjiDetail(selectedKanji.detail).map((meaning, idx) => (
                              <li key={idx} className="flex gap-3 text-slate-700 text-lg">
                                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">{idx + 1}</span>
                                <span className="font-medium leading-relaxed">{meaning}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic">Không có giải nghĩa chi tiết.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              ) : (
                // VIEW 1: CHI TIẾT TỪ VỰNG
                <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-left-4 duration-300">
                  <div className="p-8 bg-violet-50/50 border-b border-violet-100 shrink-0">
                    <p className="text-violet-500 font-bold tracking-widest mb-2 flex items-center gap-2">
                      {selectedVocab.reading || '---'}
                      <button onClick={() => playAudio(selectedVocab.word)} className="text-violet-400 hover:text-violet-700 bg-violet-100 hover:bg-violet-200 p-1.5 rounded-full transition-colors"><Volume2 className="w-4 h-4"/></button>
                    </p>
                    <h2 className="text-6xl font-black text-slate-800 tracking-tight mb-4">{selectedVocab.word}</h2>
                    <div className="flex gap-2">
                      {selectedVocab.pos && <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-200 border-none font-bold text-sm px-3">{selectedVocab.pos}</Badge>}
                      {selectedVocab.jlpt_level && selectedVocab.jlpt_level !== 'Unknown' && (
                        <Badge className={`${jlptBadgeColors[selectedVocab.jlpt_level]} border font-bold px-3`}>{selectedVocab.jlpt_level}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-8 overflow-y-auto overscroll-contain custom-scrollbar">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                      <LayoutList className="w-4 h-4 mr-2"/> Định nghĩa
                    </p>
                    {selectedVocab.meaning ? (
                      <ul className="space-y-4">
                        {selectedVocab.meaning.split('\n').filter(Boolean).map((line: string, idx: number) => {
                          const match = line.match(/^([0-9]+\.)(.*)/);
                          if (match) return (
                            <li key={idx} className="flex gap-3 text-lg text-slate-700">
                              <span className="font-black text-violet-500">{match[1]}</span>
                              <span className="font-medium">{match[2]}</span>
                            </li>
                          );
                          return (
                            <li key={idx} className="text-lg font-medium text-slate-700 relative pl-6 before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:bg-violet-300 before:rounded-full">
                              {line}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">Đang cập nhật...</p>
                    )}
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <Button onClick={(e) => handleSave(selectedVocab, e)} disabled={savingMap[selectedVocab.word]} className="w-full h-12 text-base font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                      {savingMap[selectedVocab.word] ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <BookmarkPlus className="w-5 h-5 mr-2" />}
                      Lưu từ vựng này
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* --- CỘT PHẢI: SIDEBAR KANJI --- */}
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-400"/> Thành phần Hán tự
                </h3>
                <button onClick={closeModal} className="hidden md:block p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {selectedVocab.kanji_info && selectedVocab.kanji_info.length > 0 ? (
                  selectedVocab.kanji_info.map((kanji: any, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedKanji(kanji)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex gap-4 items-center ${
                        selectedKanji?.kanji === kanji.kanji 
                          ? 'bg-rose-500 border-rose-600 text-white shadow-md scale-[1.02]' 
                          : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-md text-slate-700'
                      }`}
                    >
                      <div className={`text-4xl font-black shrink-0 ${selectedKanji?.kanji === kanji.kanji ? 'text-white' : 'text-rose-500'}`}>
                        {kanji.kanji}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{kanji.mean}</p>
                        <p className={`text-xs mt-1 ${selectedKanji?.kanji === kanji.kanji ? 'text-rose-100' : 'text-slate-500'}`}>
                          N{kanji.level} • {kanji.stroke_count} nét
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-slate-400 italic text-sm">
                    Từ vựng này không chứa Hán tự.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}