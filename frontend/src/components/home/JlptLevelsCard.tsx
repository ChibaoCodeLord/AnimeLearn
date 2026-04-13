import React from 'react';
import { Link } from 'react-router-dom';

const levels = [
  { level: 'N5', label: 'Beginner', color: 'from-green-500 to-emerald-600', desc: 'Cơ bản nhất', count: '800+ từ' },
  { level: 'N4', label: 'Elementary', color: 'from-blue-500 to-cyan-600', desc: 'Sơ cấp', count: '1500+ từ' },
  { level: 'N3', label: 'Intermediate', color: 'from-purple-500 to-violet-600', desc: 'Trung cấp', count: '3750+ từ' },
  { level: 'N2', label: 'Upper-Int', color: 'from-orange-500 to-amber-600', desc: 'Trung cao', count: '6000+ từ' },
  { level: 'N1', label: 'Advanced', color: 'from-red-500 to-rose-600', desc: 'Nâng cao', count: '10000+ từ' },
];

export default function JlptLevelCards() {
  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Theo trình độ JLPT</h2>
        <p className="text-slate-600 mb-8">Chọn trình độ phù hợp với bạn</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {levels.map(l => (
            <Link key={l.level} to={`/home?jlpt=${l.level}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${l.color} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`} />
                <div className={`text-3xl font-black bg-gradient-to-r ${l.color} bg-clip-text text-transparent mb-2`}>
                  {l.level}
                </div>
                <div className="text-sm text-slate-700 font-medium">{l.label}</div>
                <div className="text-xs text-slate-600 mt-1">{l.desc}</div>
                <div className="text-xs text-slate-500 mt-2">{l.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}