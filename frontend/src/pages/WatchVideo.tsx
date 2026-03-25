import { useParams } from "react-router-dom";
import { useState } from "react";
import { MOCK_VIDEOS } from "../lib/mockData";
import InteractiveWord from "../components/video/InteractiveWord";

export default function WatchVideo() {
  const { id } = useParams();
  const video = MOCK_VIDEOS.find(v => v.id === id) || MOCK_VIDEOS[0];
  const [currentTime, setCurrentTime] = useState(0);

  // Giả lập tiến trình video chạy
  const handleSimulateTime = (time: number) => setCurrentTime(time);

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-80px)]">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Khu vực Video */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{video.title}</h1>
          <div className="flex gap-4">
            <button className="bg-slate-200 px-4 py-2 rounded font-medium hover:bg-slate-300">
              Chế độ Loop (Lặp câu)
            </button>
            <button className="bg-slate-200 px-4 py-2 rounded font-medium hover:bg-slate-300">
              Auto-Pause cuối câu
            </button>
          </div>
        </div>

        {/* Khu vực Script / Phụ đề bên phải */}
        <div className="w-full lg:w-1/3 bg-slate-800 rounded-xl flex flex-col shadow-lg overflow-hidden h-[600px] lg:h-full">
          <div className="p-4 bg-slate-900 text-white font-semibold flex justify-between items-center shadow-md">
            <span>Tương tác Phụ đề</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded">AI Script</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 script-scroll-container">
            {video.subtitles.map((line) => {
              const isActive = currentTime >= line.startTime && currentTime <= line.endTime;
              
              return (
                <div 
                  key={line.id} 
                  className={`p-4 rounded-lg transition-colors cursor-pointer border-l-4 ${
                    isActive ? "bg-slate-700 border-blue-500" : "bg-slate-800/50 border-transparent hover:bg-slate-700/50"
                  }`}
                  onClick={() => handleSimulateTime(line.startTime)}
                >
                  <div className="text-xs text-slate-400 mb-2 font-mono">
                    {line.startTime}s - {line.endTime}s
                  </div>
                  <div className="leading-loose mb-2">
                    {line.tokens.map((token, idx) => (
                      <InteractiveWord key={`${token.id}-${idx}`} token={token} />
                    ))}
                  </div>
                  <div className="text-sm text-slate-400 border-t border-slate-700 pt-2">
                    {line.translation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}