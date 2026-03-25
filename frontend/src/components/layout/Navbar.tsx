import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-400">My Anime</Link>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-blue-300">Khám phá</Link>
          <Link to="/my-videos" className="hover:text-blue-300">Video của tôi</Link>
          <Link to="/saved-vocab" className="hover:text-blue-300">Từ vựng đã lưu</Link>
        </div>
      </div>
    </nav>
  );
}