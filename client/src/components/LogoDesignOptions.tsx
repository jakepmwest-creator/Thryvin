import React from 'react';

const LogoDesignOptions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Our Official Logo</h1>
        <p className="text-white/80 text-lg">The professional brand identity for Thryvin' AI Coaching</p>
      </div>

      {/* Main Logo Display */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 shadow-xl border border-white/20">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img 
              src="/thryvin-logo-new.png" 
              alt="Thryvin' AI Coaching" 
              className="w-80 h-24 object-contain" 
            />
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">THRYVIN' AI COACHING</h2>
          <p className="text-white/80">Your personal AI fitness companion</p>
        </div>
      </div>

      {/* Logo Usage Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Light Background</h3>
          <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
            <img 
              src="/thryvin-logo-new.png" 
              alt="Thryvin' Logo" 
              className="w-32 h-12 object-contain" 
            />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Dark Background</h3>
          <div className="bg-gray-800 rounded-lg p-6 flex justify-center">
            <img 
              src="/thryvin-logo-new.png" 
              alt="Thryvin' Logo" 
              className="w-32 h-12 object-contain" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 shadow-sm border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-6">Brand Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-medium text-white">Modern Design</h3>
            <p className="text-sm text-white/70">Purple gradient with futuristic arrow</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-medium text-white">AI Coaching</h3>
            <p className="text-sm text-white/70">Intelligent fitness guidance</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-3">💪</div>
            <h3 className="font-medium text-white">Fitness Focus</h3>
            <p className="text-sm text-white/70">Health and wellness platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoDesignOptions;