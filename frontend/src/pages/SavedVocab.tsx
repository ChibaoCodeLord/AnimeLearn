import { MOCK_SAVED_WORDS } from "../lib/mockData";

export default function SavedVocab() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Sổ tay từ vựng</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SAVED_WORDS.map((vocab) => (
          <div key={vocab.id} className="bg-white p-5 rounded-xl shadow-md border border-slate-100 relative group">
            <button className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
              Xóa
            </button>
            <h3 className="text-2xl font-bold text-blue-600 mb-1">{vocab.word}</h3>
            <p className="text-sm text-slate-500 mb-3">{vocab.reading}</p>
            <p className="font-medium text-slate-800 mb-4">{vocab.meaning}</p>
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 italic">
              "{vocab.context}"
            </div>
            <button className="mt-4 w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition">
              Học bằng Flashcard
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}