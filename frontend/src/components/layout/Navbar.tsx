import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";


interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch("http://localhost:5000/api/home/user-profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
};

export default function Navbar() {
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-400">My Anime</Link>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-blue-300">Khám phá</Link>
          <Link to="/my-videos" className="hover:text-blue-300">Video của tôi</Link>
          <Link to="/saved-vocab" className="hover:text-blue-300">Từ vựng đã lưu</Link>
        </div>
        <div className="user-profile">
          {isLoading ? (
            <span>Loading...</span>
          ) : error ? (
            <span>Guest</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="bg-teal-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}