import { useQuery } from '@tanstack/react-query';

export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

const fetchVideos = async (): Promise<VideoItem[]> => {
  const response = await fetch('http://localhost:5000/api/videos', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }

  return response.json();
};

export const useHomeData = () => {
  return useQuery<VideoItem[]>({
    queryKey: ['community-videos'],
    queryFn: fetchVideos,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};