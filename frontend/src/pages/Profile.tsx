import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Flame, Star, Award, BookOpen, Trophy, Lock, Play, Clock, Upload, X, Edit2, Save, MoreVertical, Globe } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  jlptLevel: string;
  profilePicture: string | null;
  bio: string;
  phone: string;
  location: string;
  role: string;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

const updateUserProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await fetch('http://localhost:5000/api/auth/update-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return response.json();
};

const fetchLearningProgress = async (period: string = 'week') => {
  const response = await fetch(`http://localhost:5000/api/auth/learning-progress?period=${period}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch learning progress');
  }

  return response.json();
};

const fetchUserVideos = async (page: number = 1) => {
  const response = await fetch(`http://localhost:5000/api/video/user/my-videos?page=${page}&limit=5`, {
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

const fetchAchievements = async () => {
  const response = await fetch('http://localhost:5000/api/auth/achievements', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch achievements');
  }

  return response.json();
};

const fetchProfileStats = async () => {
  const response = await fetch('http://localhost:5000/api/auth/profile-stats', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile stats');
  }

  return response.json();
};

const deleteVideo = async (videoId: string) => {
  const response = await fetch(`http://localhost:5000/api/video/delete/${videoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete video');
  }

  return response.json();
};

const updateVideo = async (videoId: string, data: { title: string; visibility?: 'public' | 'private' }) => {
  const response = await fetch(`http://localhost:5000/api/video/update/${videoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update video');
  }

  return response.json();
};

// Mock data fallback for videos display
const mockVideos = [
  {
    _id: '1',
    title: 'Kanji Mastery: N3 Essentials',
    jlpt_level: 'N3',
    views_count: 234,
    status: 'approved',
    thumbnail_url: '',
  },
  {
    _id: '2',
    title: 'Street Japanese: Casual Talk',
    jlpt_level: 'N4',
    views_count: 156,
    status: 'pending',
    thumbnail_url: '',
  },
];

const renderAchievementIcon = (iconType: string, locked: boolean) => {
  const iconProps = {
    className: `w-8 h-8 ${locked ? 'text-gray-400' : 'text-yellow-500'}`,
  };

  switch (iconType) {
    case 'sun':
      return <Award {...iconProps} />;
    case 'bookOpen':
      return <BookOpen {...iconProps} />;
    case 'trophy':
      return <Star {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'zap':
      return <Star {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

export default function Profile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>('public');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [progressTab, setProgressTab] = useState<'week' | 'month'>('week');

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: fetchUserProfile,
  });

  const { data: learningProgress } = useQuery({
    queryKey: ['learningProgress', progressTab],
    queryFn: () => fetchLearningProgress(progressTab),
    enabled: !!user,
  });

  const { data: videosResponse } = useQuery({
    queryKey: ['videos', currentPage],
    queryFn: () => fetchUserVideos(currentPage),
    enabled: !!user,
  });

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    enabled: !!user,
  });

  const { data: profileStats } = useQuery({
    queryKey: ['profileStats'],
    queryFn: fetchProfileStats,
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      setIsEditing(false);
      setAvatarPreview(null);
      toast.success('Cập nhật profile thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Cập nhật profile thất bại');
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setDeleteConfirm(null);
      toast.success('Video đã được xóa');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Xóa video thất bại');
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: ({ videoId, data }: { videoId: string; data: { title: string; visibility?: 'public' | 'private' } }) =>
      updateVideo(videoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setEditingVideo(null);
      setEditTitle('');
      setEditVisibility('public');
      toast.success('Video đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Cập nhật video thất bại');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData(user);
    }
    setIsEditing(false);
    setAvatarPreview(null);
  };

  const handleEditClick = () => {
    if (user) {
      setFormData(user);
      setIsEditing(true);
    }
  };

  const maxBarHeight = 100;
  const maxHours = Math.max(
    ...(learningProgress?.weeklyData?.map((d: any) => d.hours) || [1])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Lỗi tải profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Profile */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between">
            {/* Left Side - Avatar & Info */}
            <div className="flex gap-6 items-center flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-4 border-white">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: '#A5F3C7' }}
                  ></div>
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {user?.fullName}
                </h1>
                <div className="flex gap-3 flex-wrap items-center">
                  <span 
                    className="px-3 py-1.5 text-white rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#005537' }}
                  >
                    LEVEL 42
                  </span>
                  <div className="flex items-center gap-1 bg-gray-200 px-3 py-1.5 rounded text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    {user?.location || 'Tokyo, JP'}
                  </div>
                  <div className="bg-gray-200 px-3 py-1.5 rounded text-sm font-medium text-gray-700">
                    ✓ Joined March 2023
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Mastery Goal & Edit Button */}
            <div className="flex flex-col items-end gap-4 flex-shrink-0">
              <button
                onClick={handleEditClick}
                disabled={isEditing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Edit2 className="w-4 h-4" />
                Chỉnh sửa
              </button>
              
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Mastery Goal
                </div>
                <div className="text-2xl font-bold text-gray-900 leading-tight">
                  JLPT {user?.jlptLevel || 'Beginner'} <br /> Certification
                </div>
                <div 
                  className="h-1 w-16 mt-3 ml-auto"
                  style={{ backgroundColor: '#005537' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal Popup */}
        {isEditing && (
          <>
            {/* Backdrop Overlay - Transparent */}
            <div 
              className="fixed inset-0 bg-transparent z-40"
              onClick={handleCancel}
            ></div>

            {/* Modal Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto"
                style={{ maxWidth: "500px" }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #999;
                  }
                `}</style>
                {/* Modal Header */}
                <div className="sticky top-0 flex justify-between items-center px-6 py-6 bg-white border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                  <button
                    onClick={handleCancel}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-8">
                  {/* Avatar Section - Centered */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer mb-3">
                      <div 
                        className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                      >
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-28 h-28 rounded-full object-cover" />
                        ) : (
                          formData.fullName?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 rounded-full p-1.5 hover:opacity-80 transition shadow-lg"
                        style={{ backgroundColor: '#005537' }}
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p 
                      className="text-sm font-semibold cursor-pointer hover:opacity-80" 
                      style={{ color: '#005537' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Profile Photo
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3">
                    {/* Row 1: Full Name & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Full Name</label>
                        <Input
                          type="text"
                          name="fullName"
                          value={formData.fullName || ''}
                          onChange={handleChange}
                          placeholder=""
                          className="bg-gray-100 border-0 text-gray-800 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Phone Number</label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleChange}
                          placeholder=""
                          className="bg-gray-100 border-0 text-gray-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Row 2: Location & JLPT Level */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Location</label>
                        <Input
                          type="text"
                          name="location"
                          value={formData.location || ''}
                          onChange={handleChange}
                          placeholder=""
                          className="bg-gray-100 border-0 text-gray-800 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">JLPT Level</label>
                        <select
                          name="jlptLevel"
                          value={formData.jlptLevel || 'Beginner'}
                          onChange={handleChange}
                          className="w-full border-0 rounded px-2 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="N5">N5</option>
                          <option value="N4">N4</option>
                          <option value="N3">N3</option>
                          <option value="N2">N2 - Pre-Advanced</option>
                          <option value="N1">N1</option>
                        </select>
                      </div>
                    </div>

                    {/* Bio - Full Width */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleChange}
                        rows={3}
                        placeholder=""
                        className="w-full border-0 rounded px-2 py-1.5 bg-gray-100 text-gray-800 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition disabled:opacity-50 font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold text-sm"
                    style={{ backgroundColor: '#005537' }}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Learning Progress Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Learning Progress</h2>
              <p className="text-gray-600 text-sm">Your weekly activity is up 12% compared to last week.</p>
            </div>
            {/* Tab Buttons */}
            <div className="flex gap-6">
              <button
                onClick={() => setProgressTab('week')}
                className={`px-0 py-2 font-medium transition border-b-2 ${
                  progressTab === 'week'
                    ? 'text-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                style={progressTab === 'week' ? { borderBottomColor: '#005537' } : {}}
              >
                Tuần này
              </button>
              <button
                onClick={() => setProgressTab('month')}
                className={`px-0 py-2 font-medium transition border-b-2 ${
                  progressTab === 'month'
                    ? 'text-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                style={progressTab === 'month' ? { borderBottomColor: '#005537' } : {}}
              >
                Tháng này
              </button>
            </div>
          </div>

          <div className="flex gap-12">
            {/* Chart Section */}
            <div className="flex-1">
              {progressTab === 'week' ? (
                // Week view - Bar Chart
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={learningProgress?.weeklyData || []} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" domain={[0, 'dataMax + 0.5']} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => [`${Number(value).toFixed(3)}h`, 'Hours']}
                      />
                      <Bar dataKey="hours" fill="#216E39" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                // Monthly view - Line Chart
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningProgress?.monthlyData || []} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value) => [`${Number(value).toFixed(3)}h`, 'Hours']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#216E39" 
                        strokeWidth={3}
                        dot={{ fill: '#216E39', r: 5 }}
                        activeDot={{ r: 7 }}
                        fill="#9BE9A8"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Stats Cards Vertical */}
            <div className="flex flex-col gap-3 w-80">
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A5F3C7' }}>
                    <Flame className="w-8 h-8" style={{ color: '#005537' }} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{profileStats?.dayStreak || 0}</div>
                    <div className="text-sm text-gray-600 font-semibold">DAY STREAK</div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A5F3C7' }}>
                    <Award className="w-8 h-8" style={{ color: '#005537' }} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">#{profileStats?.userRank || 42}</div>
                    <div className="text-sm text-gray-600 font-semibold">RANK RANKING</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Video Learns & Achievements */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Current Video Learns */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Current Video Learn</h2>
              <a href="/VideoWorkspace" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                Create New
              </a>
            </div>

            <div className="space-y-4">
              {(videosResponse?.videos && videosResponse.videos.length > 0 ? videosResponse.videos : mockVideos).map((video: any) => (
                <div key={video._id || video.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0">
                  <div 
                    className="w-16 h-16 rounded flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden"
                    style={{ 
                      backgroundImage: video.thumbnail_url ? `url(${video.thumbnail_url})` : 'none',
                      backgroundColor: video.color || '#6B5B4D',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    {!video.thumbnail_url && <BookOpen className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{video.title}</h3>
                    <p className="text-sm text-gray-600">
                      JLPT: {video.jlpt_level || 'Unknown'} • Views: {video.views_count || 0}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${
                        video.status === 'approved' ? 'bg-green-100 text-green-700' :
                        video.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {video.status === 'approved' ? '✓ Approved' : 
                         video.status === 'rejected' ? '✗ Rejected' : 
                         '⏳ Pending'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
                        (video.visibility || 'public') === 'public'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {(video.visibility || 'public') === 'public' ? (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Private
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 relative">
                    <button 
                      onClick={() => window.location.href = `/VideoWorkspace?id=${video._id}`}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:opacity-90 transition"
                      style={{ backgroundColor: '#005537' }}
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === video._id ? null : video._id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === video._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <button
                            onClick={() => {
                              setEditingVideo(video);
                              setEditTitle(video.title);
                              setEditVisibility(video.visibility || 'public');
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
                          >
                            <Edit2 className="w-4 h-4" />
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm(video._id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {videosResponse?.pagination && videosResponse.pagination.total > 5 && (
              <div className="mt-8 flex items-center justify-center gap-3 px-4 py-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!videosResponse.pagination.hasPrevPage}
                  className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-green-700"
                >
                  ←<span>Trước</span>
                </button>
                
                <div className="flex gap-2 mx-2">
                  {Array.from({ length: videosResponse.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                        currentPage === page
                          ? 'bg-green-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(videosResponse.pagination.totalPages, currentPage + 1))}
                  disabled={!videosResponse.pagination.hasNextPage}
                  className="flex items-center gap-1 px-4 py-2 rounded-full hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-green-700"
                >
                  <span>Tiếp</span>→
                </button>
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>

            <div className="space-y-3">
              {(achievementsData || []).map((achievement: any) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg text-center transition-all ${
                    !achievement.unlocked
                      ? 'bg-gray-100 opacity-60'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {renderAchievementIcon(achievement.icon, !achievement.unlocked)}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{achievement.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Hours Card */}
        <div 
          className="rounded-xl shadow-sm p-6 text-white"
          style={{ backgroundColor: '#005537' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold uppercase" style={{ color: '#A5F3C7' }}>Learning Hours</span>
              </div>
              <div className="text-5xl font-bold mb-2">{profileStats?.totalLearningHours || 0}</div>
              <p className="text-sm font-medium opacity-90">total hours</p>
              <p className="text-xs opacity-80 mt-4">
                You're in the {profileStats?.ranking || 'top 5%'} of learners. Keep up the great work!
              </p>
            </div>
            <Trophy className="w-24 h-24 opacity-30" />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Xóa video?</h3>
              <p className="text-gray-600 text-center mb-6">
                Video này sẽ bị xóa vĩnh viễn khỏi danh sách của bạn.
              </p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-semibold"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => deleteVideoMutation.mutate(deleteConfirm)}
                  disabled={deleteVideoMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition font-semibold"
                >
                  {deleteVideoMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Video details</h3>
                <p className="text-gray-600 text-sm mt-1">Update your project information and accessibility preferences.</p>
              </div>
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setEditTitle('');
                  setEditVisibility('public');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Title Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-green-700 mb-3 uppercase tracking-wider">
                Video Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-full bg-gray-100 border border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nhập tiêu đề video"
              />
            </div>

            {/* Privacy Settings Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-green-700 mb-3 uppercase tracking-wider">
                Privacy Settings
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditVisibility('public')}
                  className={`flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 font-semibold transition ${
                    editVisibility === 'public'
                      ? 'bg-green-100 border-2 border-green-700 text-green-700'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  Public
                </button>
                <button
                  onClick={() => setEditVisibility('private')}
                  className={`flex-1 py-3 px-4 rounded-full flex items-center justify-center gap-2 font-semibold transition ${
                    editVisibility === 'private'
                      ? 'bg-green-100 border-2 border-green-700 text-green-700'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  Private
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setEditTitle('');
                  setEditVisibility('public');
                }}
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editTitle.trim()) {
                    updateVideoMutation.mutate({
                      videoId: editingVideo._id,
                      data: { title: editTitle, visibility: editVisibility },
                    });
                  }
                }}
                disabled={updateVideoMutation.isPending || !editTitle.trim()}
                className="flex-1 px-4 py-3 rounded-full bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 transition font-semibold"
              >
                {updateVideoMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
