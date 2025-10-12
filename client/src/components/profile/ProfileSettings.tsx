import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ProfileSettingsProps {
  onBack: () => void;
  onSave: (profileData: ProfileData) => void;
  initialData?: Partial<ProfileData>;
}

export interface ProfileData {
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other' | '';
  birthdate: string;
  height: string;
  weight: string;
  profilePicture: string | null;
  notifications: {
    workoutReminders: boolean;
    achievementAlerts: boolean;
    coachMessages: boolean;
    weeklyRecaps: boolean;
  };
  preferences: {
    units: 'metric' | 'imperial';
    darkMode: boolean;
    language: string;
  };
}

export default function ProfileSettings({
  onBack,
  onSave,
  initialData = {}
}: ProfileSettingsProps) {
  const { isSupported, isRegistered, isAuthenticating, register } = useBiometricAuth();
  const defaultData: ProfileData = {
    name: '',
    email: '',
    gender: '',
    birthdate: '',
    height: '',
    weight: '',
    profilePicture: null,
    notifications: {
      workoutReminders: true,
      achievementAlerts: true,
      coachMessages: true,
      weeklyRecaps: true
    },
    preferences: {
      units: 'metric',
      darkMode: false,
      language: 'en'
    }
  };
  
  const [profileData, setProfileData] = useState<ProfileData>({
    ...defaultData,
    ...initialData
  });

  const queryClient = useQueryClient();

  // Load user data from API
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  // Save user data mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      const response = await apiRequest('/api/user/personal-info', {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          age: data.birthdate ? calculateAgeFromBirthdate(data.birthdate) : undefined,
          height: data.height,
          weight: data.weight,
          gender: data.gender,
        }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      alert('Profile updated successfully!');
    },
    onError: () => {
      alert('Failed to update profile. Please try again.');
    },
  });

  // Calculate age from birthdate
  const calculateAgeFromBirthdate = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Load user data when available
  useEffect(() => {
    if (user && !isLoading) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        gender: user.gender || '',
        birthdate: user.birthdate || '',
        height: user.height || '',
        weight: user.weight || '',
      }));
    }
  }, [user, isLoading]);
  
  const [activeTab, setActiveTab] = useState<'general' | 'preferences' | 'notifications' | 'biometrics'>('general');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sample profile pictures for easy selection
  const sampleProfilePictures = [
    '/avatars/profile-1.png',
    '/avatars/profile-2.png',
    '/avatars/profile-3.png',
    '/avatars/profile-4.png',
    '/avatars/profile-5.png',
    '/avatars/profile-6.png'
  ];
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (name.startsWith('notifications.')) {
      const notificationName = name.replace('notifications.', '') as keyof typeof profileData.notifications;
      setProfileData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationName]: checked
        }
      }));
    } else if (name.startsWith('preferences.')) {
      const preferenceName = name.replace('preferences.', '') as keyof typeof profileData.preferences;
      if (preferenceName === 'darkMode') {
        setProfileData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [preferenceName]: checked
          }
        }));
      }
    }
  };
  
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('preferences.')) {
      const preferenceName = name.replace('preferences.', '') as keyof typeof profileData.preferences;
      setProfileData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [preferenceName]: value
        }
      }));
    }
  };
  
  const handleProfilePictureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Simulate file upload with a FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileData(prev => ({
          ...prev,
          profilePicture: event.target?.result as string
        }));
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleSamplePictureSelect = (picturePath: string) => {
    setProfileData(prev => ({
      ...prev,
      profilePicture: picturePath
    }));
  };
  
  const handleSave = () => {
    saveProfileMutation.mutate(profileData);
    onSave(profileData);
  };
  
  const renderGeneralTab = () => {
    return (
      <div className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-user text-2xl text-gray-400"></i>
                )}
                
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <button 
                className="absolute bottom-0 right-0 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-camera text-xs"></i>
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePictureUpload}
              />
            </div>
            
            <div>
              <button 
                className="text-sm text-primary hover:text-primary-dark"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload New
              </button>
            </div>
          </div>
          
          {/* Sample Avatar Options */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Or choose from our avatars:</p>
            <div className="flex flex-wrap gap-2">
              {sampleProfilePictures.map((pic, index) => (
                <button 
                  key={index}
                  className={`w-12 h-12 rounded-full overflow-hidden ${
                    profileData.profilePicture === pic ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200'
                  }`}
                  onClick={() => handleSamplePictureSelect(pic)}
                >
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={profileData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                value={profileData.birthdate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        
        {/* Body Metrics */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Body Metrics</h3>
          
          {/* Age Display */}
          {profileData.birthdate && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Age:</strong> {calculateAgeFromBirthdate(profileData.birthdate)} years old
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height ({profileData.preferences.units === 'metric' ? 'cm' : 'ft/in'})
              </label>
              <input
                id="height"
                name="height"
                type="text"
                value={profileData.height}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={profileData.preferences.units === 'metric' ? '175cm' : '5\'10"'}
              />
              <p className="text-xs text-gray-500 mt-1">
                From your onboarding data
              </p>
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight ({profileData.preferences.units === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                id="weight"
                name="weight"
                type="text"
                value={profileData.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={profileData.preferences.units === 'metric' ? '70kg' : '154lbs'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Update anytime to keep AI recommendations accurate
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderPreferencesTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">App Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="preferences.units" className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Units
              </label>
              <select
                id="preferences.units"
                name="preferences.units"
                value={profileData.preferences.units}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, ft/in)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="preferences.language" className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                id="preferences.language"
                name="preferences.language"
                value={profileData.preferences.language}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label htmlFor="preferences.darkMode" className="text-sm font-medium text-gray-700">
                Dark Mode
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="preferences.darkMode"
                  name="preferences.darkMode"
                  type="checkbox"
                  checked={profileData.preferences.darkMode}
                  onChange={handleCheckboxChange}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="preferences.darkMode" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
          
          <div className="space-y-4">
            {isSupported && (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Biometric Authentication</h4>
                  <p className="text-xs text-gray-500">
                    {isRegistered 
                      ? 'Use fingerprint or Face ID to sign in quickly and securely' 
                      : 'Enable fingerprint or Face ID for quick access'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isRegistered ? (
                    <span className="text-xs text-green-600 font-medium">✓ Enabled</span>
                  ) : (
                    <button
                      onClick={async () => {
                        const result = await register(profileData.email || 'user@thryvin.com');
                        if (result.success) {
                          // Success - no alert needed, the UI will update automatically
                        } else {
                          console.error('Biometric setup failed:', result.error);
                          // Could add a toast notification here if needed
                        }
                      }}
                      disabled={isAuthenticating}
                      className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {isAuthenticating ? 'Setting Up...' : 'Set Up'}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Share Activity Data</h4>
                <p className="text-xs text-gray-500">Allow app to collect anonymized data to improve recommendations</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="privacy.shareActivity"
                  name="privacy.shareActivity"
                  type="checkbox"
                  checked={true}
                  onChange={() => {}}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="privacy.shareActivity" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Third-Party Data Sharing</h4>
                <p className="text-xs text-gray-500">Allow sharing of data with fitness partners</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="privacy.thirdParty"
                  name="privacy.thirdParty"
                  type="checkbox"
                  checked={false}
                  onChange={() => {}}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="privacy.thirdParty" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBiometricsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Biometric Authentication</h3>
          <p className="text-sm text-gray-600 mb-6">
            Secure your account with fingerprint or Face ID authentication for quick and secure access.
          </p>
          
          <div className="space-y-4">
            {isSupported ? (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-fingerprint text-purple-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Biometric Login</h4>
                      <p className="text-sm text-gray-500">
                        {isRegistered ? 'Enabled and ready to use' : 'Set up biometric authentication'}
                      </p>
                    </div>
                  </div>
                  {isRegistered ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                      ✓ Active
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        const result = await register(profileData.email || 'user@thryvin.com');
                        if (result.success) {
                          alert('Biometric authentication has been set up! You can now use fingerprint or Face ID to sign in.');
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      Enable Now
                    </button>
                  )}
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-shield-alt text-purple-500"></i>
                    <span>Your biometric data never leaves your device</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-bolt text-purple-500"></i>
                    <span>Sign in instantly without typing passwords</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-lock text-purple-500"></i>
                    <span>Bank-level security encryption</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-gray-400 text-3xl mb-3"></i>
                  <h4 className="font-medium text-gray-700 mb-2">Biometric Authentication Not Available</h4>
                  <p className="text-sm text-gray-500">
                    Your device doesn't support biometric authentication or it's not enabled in your browser.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderNotificationsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Workout Reminders</h4>
                <p className="text-xs text-gray-500">Receive reminders for scheduled workouts</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="notifications.workoutReminders"
                  name="notifications.workoutReminders"
                  type="checkbox"
                  checked={profileData.notifications.workoutReminders}
                  onChange={handleCheckboxChange}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="notifications.workoutReminders" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Achievement Alerts</h4>
                <p className="text-xs text-gray-500">Get notified when you earn new achievements</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="notifications.achievementAlerts"
                  name="notifications.achievementAlerts"
                  type="checkbox"
                  checked={profileData.notifications.achievementAlerts}
                  onChange={handleCheckboxChange}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="notifications.achievementAlerts" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Coach Messages</h4>
                <p className="text-xs text-gray-500">Receive notifications for new coach messages</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="notifications.coachMessages"
                  name="notifications.coachMessages"
                  type="checkbox"
                  checked={profileData.notifications.coachMessages}
                  onChange={handleCheckboxChange}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="notifications.coachMessages" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Weekly Recaps</h4>
                <p className="text-xs text-gray-500">Get weekly summaries of your progress</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="notifications.weeklyRecaps"
                  name="notifications.weeklyRecaps"
                  type="checkbox"
                  checked={profileData.notifications.weeklyRecaps}
                  onChange={handleCheckboxChange}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="notifications.weeklyRecaps" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Channels</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Push Notifications</h4>
                <p className="text-xs text-gray-500">Receive notifications on your device</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="channels.push"
                  name="channels.push"
                  type="checkbox"
                  checked={true}
                  onChange={() => {}}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="channels.push" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive notifications via email</p>
              </div>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  id="channels.email"
                  name="channels.email"
                  type="checkbox"
                  checked={true}
                  onChange={() => {}}
                  className="absolute block w-6 h-6 rounded-full bg-white border-2 border-gray-300 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-300 peer"
                />
                <label 
                  htmlFor="channels.email" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/70 transition-all duration-300"
                ></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="mr-3"
              onClick={onBack}
            >
              <i className="fas fa-arrow-left text-gray-600"></i>
            </button>
            <h2 className="font-bold text-lg">Profile Settings</h2>
          </div>
          <button 
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'preferences' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'biometrics' ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('biometrics')}
          >
            <div className="flex items-center justify-center gap-1">
              <i className="fas fa-fingerprint text-xs"></i>
              Biometrics
            </div>
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'biometrics' && renderBiometricsTab()}
      </div>
    </div>
  );
}