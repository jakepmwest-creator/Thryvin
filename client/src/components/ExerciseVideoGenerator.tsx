import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Video, Loader2, Download, Share, X } from 'lucide-react';
import { apiRequest } from "../lib/queryClient";

interface ExerciseVideoGeneratorProps {
  exerciseName: string;
  exerciseDescription: string;
  onClose?: () => void;
}

interface VideoGenerationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  videoUrl?: string;
  error?: string;
  progress?: number;
}

export const ExerciseVideoGenerator: React.FC<ExerciseVideoGeneratorProps> = ({
  exerciseName,
  exerciseDescription,
  onClose
}) => {
  const [videoState, setVideoState] = useState<VideoGenerationState>({ status: 'idle' });
  const [customPrompt, setCustomPrompt] = useState('');

  const generateVideo = async () => {
    setVideoState({ status: 'generating', progress: 0 });

    try {
      const prompt = customPrompt || `Create a professional fitness demonstration video showing proper form for ${exerciseName}. ${exerciseDescription}. Show the exercise from multiple angles with clear movements, proper posture, and breathing technique. The video should be educational and suitable for fitness instruction. High quality, well-lit gym environment.`;

      const response = await apiRequest('POST', '/api/generate-exercise-video', {
        exerciseName,
        prompt,
        duration: 30
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      
      let attempts = 0;
      const maxAttempts = 60;
      
      const pollVideo = async () => {
        try {
          const statusResponse = await apiRequest('GET', `/api/video-status/${data.videoId}`);
          const statusData = await statusResponse.json();
          
          setVideoState(prev => ({ 
            ...prev, 
            progress: Math.min(90, (attempts / maxAttempts) * 100) 
          }));

          if (statusData.status === 'completed' && statusData.videoUrl) {
            setVideoState({
              status: 'completed',
              videoUrl: statusData.videoUrl,
              progress: 100
            });
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Video generation failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollVideo, 5000);
          } else {
            throw new Error('Video generation timed out');
          }
        } catch (error) {
          console.error('Polling error:', error);
          setVideoState({
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to check video status'
          });
        }
      };

      setTimeout(pollVideo, 2000);

    } catch (error) {
      console.error('Video generation error:', error);
      setVideoState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate video'
      });
    }
  };

  const downloadVideo = () => {
    if (videoState.videoUrl) {
      const link = document.createElement('a');
      link.href = videoState.videoUrl;
      link.download = `${exerciseName.replace(/\s+/g, '_')}_demonstration.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareVideo = async () => {
    if (videoState.videoUrl && navigator.share) {
      try {
        await navigator.share({
          title: `${exerciseName} Exercise Demonstration`,
          text: `Check out this exercise demonstration for ${exerciseName}`,
          url: videoState.videoUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Generate Exercise Video</h3>
                <p className="text-sm text-purple-100">{exerciseName}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2">{exerciseName}</h4>
            <p className="text-sm text-gray-600">{exerciseDescription}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific details for the video demonstration..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={videoState.status === 'generating'}
            />
          </div>

          <AnimatePresence mode="wait">
            {videoState.status === 'idle' && (
              <motion.button
                onClick={generateVideo}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Video className="w-5 h-5" />
                <span>Generate Video</span>
              </motion.button>
            )}

            {videoState.status === 'generating' && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-center space-x-3 text-purple-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-medium">Generating your video...</span>
                </div>
                
                {videoState.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{Math.round(videoState.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${videoState.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center">
                  This may take a few minutes. AI is creating your custom exercise video.
                </p>
              </motion.div>
            )}

            {videoState.status === 'completed' && videoState.videoUrl && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-green-800 mb-2">
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Video Ready!</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your exercise demonstration video has been generated successfully.
                  </p>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    src={videoState.videoUrl}
                    controls
                    className="w-full h-48 object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={downloadVideo}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  
                  {navigator.share && (
                    <button
                      onClick={shareVideo}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Share className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {videoState.status === 'error' && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-red-800 mb-2">
                    <X className="w-5 h-5" />
                    <span className="font-medium">Generation Failed</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {videoState.error || 'Failed to generate video. Please try again.'}
                  </p>
                </div>

                <button
                  onClick={() => setVideoState({ status: 'idle' })}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-xl font-medium transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};