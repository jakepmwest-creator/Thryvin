import React from 'react';

interface PremiumPreviewProps {
  coachName: string;
  coachIcon: string;
  coachColorClass: string;
  onContinueToPayment: () => void;
  onStartFreeTrial: () => void;
}

export default function PremiumPreview({
  coachName,
  coachIcon,
  coachColorClass,
  onContinueToPayment,
  onStartFreeTrial
}: PremiumPreviewProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-8 px-6">
        <h1 className="text-2xl font-bold mb-2">Upgrade to Premium</h1>
        <p className="text-white/80">Get the most out of your coaching experience</p>
      </div>
      
      {/* Coach match section */}
      <div className="px-6 py-8 bg-white shadow-sm border-b">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-full ${coachColorClass} flex items-center justify-center text-white`}>
            <i className={`fas ${coachIcon}`}></i>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">Meet {coachName}</h2>
            <p className="text-gray-600">Your Personalized Coach</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          You've been matched with the perfect coach for your unique fitness goals, preferences, and style.
        </p>
      </div>
      
      {/* Premium features */}
      <div className="flex-1 px-6 py-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Benefits Include:</h3>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4 flex-shrink-0">
              <i className="fas fa-dumbbell"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Personalized Workout Plans</h4>
              <p className="text-gray-600 text-sm">Custom workouts designed specifically for your goals, equipment, and fitness level</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4 flex-shrink-0">
              <i className="fas fa-comment-alt"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Unlimited Coach Chats</h4>
              <p className="text-gray-600 text-sm">Get answers, feedback, and motivation from your coach anytime</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4 flex-shrink-0">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Progress Tracking</h4>
              <p className="text-gray-600 text-sm">Detailed analytics on your workouts, calories, and fitness achievements</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4 flex-shrink-0">
              <i className="fas fa-apple-alt"></i>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Nutrition Guidance</h4>
              <p className="text-gray-600 text-sm">Meal plans and nutritional advice tailored to support your training</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="px-6 py-8 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={onContinueToPayment}
          className="w-full bg-primary text-white py-4 rounded-xl font-medium mb-4 shadow-md hover:bg-primary-dark transition-colors"
        >
          Continue to Payment Options
        </button>
        
        <button 
          onClick={onStartFreeTrial}
          className="w-full bg-white text-gray-700 py-4 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Start 7-Day Free Trial
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          You can cancel your subscription anytime.
        </p>
      </div>
    </div>
  );
}