import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Flame, Star, Award, BookOpen, Trophy, Lock, Play, Clock, Upload, X, Edit2, Save } from 'lucide-react';
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

// Mock data for demonstration
const mockWeeklyData = [
  { day: 'MON', hours: 2 },
  { day: 'TUE', hours: 3 },
  { day: 'WED', hours: 1 },
  { day: 'THU', hours: 4 },
  { day: 'FRI', hours: 2 },
  { day: 'SAT', hours: 0 },
  { day: 'SUN', hours: 1 },
];

const mockCourses = [
  {
    id: 1,
    title: 'Kanji Mastery: N3 Essentials',
    unit: 'Unit 4: Environment & Nature',
    progress: 87,
    color: '#6B5B4D',
  },
  {
    id: 2,
    title: 'Street Japanese: Casual Talk',
    unit: 'Unit 1: Meeting Friends',
    progress: 35,
    color: '#6B7B8F',
  },
];

const mockAchievements = [
  { id: 1, name: 'Early Bird Learner', icon: 'award' },
  { id: 2, name: 'Vocab Virtuoso', icon: 'book' },
  { id: 3, name: 'Weekly Champion', icon: 'star' },
  { id: 4, name: 'JLPT N2 Finisher', icon: 'lock', locked: true },
];

const renderAchievementIcon = (iconType: string, locked: boolean) => {
  const iconProps = {
    className: `w-8 h-8 ${locked ? 'text-gray-400' : 'text-yellow-500'}`,
  };

  switch (iconType) {
    case 'award':
      return <Award {...iconProps} />;
    case 'book':
      return <BookOpen {...iconProps} />;
    case 'star':
      return <Star {...iconProps} />;
    case 'lock':
      return <Lock {...iconProps} />;
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

  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: fetchUserProfile,
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
  const maxHours = Math.max(...mockWeeklyData.map(d => d.hours));

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
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Learning Progress</h2>
          <p className="text-gray-600 mb-4 text-sm">Your weekly activity is up 12% compared to last week.</p>

          <div className="mb-6">
            <div className="flex items-end justify-around gap-3 h-40 px-4">
              {mockWeeklyData.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-gray-200 rounded-lg relative" style={{
                    height: `${Math.max((data.hours / maxHours) * maxBarHeight, 10)}px`,
                  }}>
                    <div 
                      className="w-full h-full rounded-lg transition-colors"
                      style={{
                        backgroundColor: data.day === 'THU' ? '#005537' : '#A5F3C7',
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-3 font-semibold">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gray-50 border-0 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A5F3C7' }}>
                  <Flame className="w-8 h-8" style={{ color: '#005537' }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24</div>
                  <div className="text-sm text-gray-600 font-semibold">DAY STREAK</div>
                  <div className="text-xs text-gray-500 mt-1">Keep it up! 5 days to go for a badge</div>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-50 border-0 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#A5F3C7' }}>
                  <Star className="w-8 h-8" style={{ color: '#005537' }} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">12,450</div>
                  <div className="text-sm text-gray-600 font-semibold">TOP 5% IN YOUR REGION</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Current Courses & Achievements */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Current Courses */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Current Courses</h2>
              <a href="#" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                View All
              </a>
            </div>

            <div className="space-y-4">
              {mockCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0">
                  <div 
                    className="w-16 h-16 rounded flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: course.color, opacity: 0.8 }}
                  >
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.unit}</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${course.progress}%`,
                          backgroundColor: '#005537',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-600">{course.progress}%</span>
                    <button 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:opacity-90 transition"
                      style={{ backgroundColor: '#005537' }}
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>

            <div className="space-y-3">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg text-center transition-all ${
                    achievement.locked
                      ? 'bg-gray-100 opacity-60'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {renderAchievementIcon(achievement.icon, achievement.locked || false)}
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
              <div className="text-5xl font-bold mb-2">128</div>
              <p className="text-sm font-medium opacity-90">total hours</p>
              <p className="text-xs opacity-80 mt-4">
                You're in the top 2% of learners this month. Your <br />
                most productive time is 8:00 AM
              </p>
            </div>
            <Trophy className="w-24 h-24 opacity-30" />
          </div>
        </div>
      </div>
    </div>
  );
}
