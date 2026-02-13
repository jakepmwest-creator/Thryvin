import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAwardsStore } from '../stores/awards-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  darkOverlay: 'rgba(0, 0, 0, 0.7)',
};

// Maximum number of loops before requiring user to click again
const MAX_LOOPS = 3;

/**
 * Validates if a video URL is a real video (not a placeholder)
 * Use this function across all components to ensure consistent video detection
 */
export const isValidVideoUrl = (videoUrl: string | undefined | null): boolean => {
  if (!videoUrl) return false;
  const url = videoUrl.toLowerCase();
  // Only Cloudinary URLs are real videos
  if (url.includes('cloudinary')) return true;
  // thryvin.com URLs are placeholders that don't exist
  if (url.includes('thryvin.com')) return false;
  // Reject empty or placeholder patterns
  if (url === 'placeholder' || url === '' || url === 'undefined') return false;
  return false;
};

/**
 * Gets a valid video URL or returns null
 * Useful for conditional rendering
 */
export const getValidVideoUrl = (videoUrl: string | undefined | null): string | null => {
  return isValidVideoUrl(videoUrl) ? videoUrl! : null;
};

interface ExerciseVideoPlayerProps {
  videoUrl: string;
  exerciseName?: string;
  onClose?: () => void;
  autoPlay?: boolean; // For workout hub - auto-plays but stops after loops
  showThumbnailFirst?: boolean; // For explore/preview - shows thumbnail, click to play
}

export function ExerciseVideoPlayer({
  videoUrl,
  exerciseName = 'Exercise',
  onClose,
  autoPlay = false,
  showThumbnailFirst = true, // Default to thumbnail mode for cost savings
}: ExerciseVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(false);
  
  // Loop tracking for cost optimization
  const [loopCount, setLoopCount] = useState(0);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(showThumbnailFirst);
  const lastPositionRef = useRef(0);

  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Generate thumbnail URL from Cloudinary video URL
  const getThumbnailUrl = useCallback(() => {
    if (videoUrl.includes('cloudinary')) {
      // Transform video URL to get first frame as image
      return videoUrl
        .replace('/video/upload/', '/video/upload/so_0,f_jpg,w_640/')
        .replace('.mp4', '.jpg');
    }
    return null;
  }, [videoUrl]);

  // Start playback based on mode
  useEffect(() => {
    if (autoPlay && !showThumbnailFirst && videoRef.current) {
      // Auto-play mode for workout hub
      setShowThumbnail(false);
      setHasStartedPlaying(true);
      setIsLoading(true);
      videoRef.current.playAsync();
    }
  }, [autoPlay, showThumbnailFirst]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && isPlaying) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [showControls, isPlaying]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsMuted(status.isMuted);
      
      // Detect loop completion (position reset to start)
      if (status.didJustFinish || (lastPositionRef.current > status.positionMillis + 1000 && status.positionMillis < 500)) {
        const newLoopCount = loopCount + 1;
        setLoopCount(newLoopCount);
        
        // Stop after MAX_LOOPS
        if (newLoopCount >= MAX_LOOPS) {
          videoRef.current?.pauseAsync();
          setShowThumbnail(true);
          setLoopCount(0);
          setHasStartedPlaying(false);
        }
      }
      
      lastPositionRef.current = status.positionMillis;
    }
  };

  const handlePlayPress = async () => {
    if (showThumbnail) {
      // User clicked to start playing
      setShowThumbnail(false);
      setHasStartedPlaying(true);
      setLoopCount(0);
      setIsLoading(true);
      
      // Track video watched for badge progress
      try { useAwardsStore.getState().trackVideoWatched(); } catch {}
      
      if (videoRef.current) {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
      }
    } else {
      // Toggle play/pause
      if (videoRef.current) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          // Reset loop count when manually playing
          setLoopCount(0);
          await videoRef.current.playAsync();
        }
      }
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackSpeed = async (speed: number) => {
    if (videoRef.current) {
      await videoRef.current.setRateAsync(speed, true);
      setPlaybackSpeed(speed);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleControlsVisibility = () => {
    if (!showThumbnail) {
      setShowControls(!showControls);
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    }
  };

  const thumbnailUrl = getThumbnailUrl();

  const renderPlayer = () => (
    <View style={[styles.playerContainer, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity
        style={styles.videoTouchArea}
        activeOpacity={1}
        onPress={showThumbnail ? handlePlayPress : toggleControlsVisibility}
      >
        {/* Thumbnail overlay when not playing */}
        {showThumbnail && (
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <Image 
                source={{ uri: thumbnailUrl }} 
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Ionicons name="videocam" size={48} color={COLORS.mediumGray} />
              </View>
            )}
            {/* Play button overlay */}
            <View style={styles.thumbnailOverlay}>
              <TouchableOpacity onPress={handlePlayPress}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playButtonLarge}
                >
                  <Ionicons name="play" size={36} color={COLORS.white} style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.tapToPlayText}>Tap to play</Text>
            </View>
          </View>
        )}

        {/* Video player - hidden when showing thumbnail */}
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={[styles.video, showThumbnail && styles.videoHidden]}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={true}
          isMuted={isMuted}
          shouldPlay={false}
          rate={playbackSpeed}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Loading indicator */}
        {isLoading && !showThumbnail && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        {/* Center play/pause button when controls visible */}
        {!showThumbnail && showControls && (
          <View style={styles.centerPlayButton}>
            <TouchableOpacity onPress={handlePlayPress}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.simplePlayButton}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color={COLORS.white}
                  style={!isPlaying ? { marginLeft: 4 } : {}}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Loop counter indicator */}
        {!showThumbnail && isPlaying && loopCount > 0 && (
          <View style={styles.loopIndicator}>
            <Ionicons name="repeat" size={12} color={COLORS.white} />
            <Text style={styles.loopText}>{loopCount}/{MAX_LOOPS}</Text>
          </View>
        )}

        {/* Bottom controls bar */}
        {!showThumbnail && showControls && (
          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={toggleMute} style={styles.smallButton}>
              <Ionicons 
                name={isMuted ? 'volume-mute' : 'volume-high'} 
                size={18} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
            <Text style={styles.timeText}>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
            <TouchableOpacity onPress={toggleFullscreen} style={styles.smallButton}>
              <Ionicons 
                name={isFullscreen ? 'contract' : 'expand'} 
                size={18} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setIsFullscreen(false)}
      >
        {renderPlayer()}
      </Modal>
    );
  }

  return renderPlayer();
}

// Wrapper component for Workout Hub with auto-play behavior
export function WorkoutVideoPlayer({
  videoUrl,
  exerciseName,
  isVisible = true,
}: {
  videoUrl: string;
  exerciseName?: string;
  isVisible?: boolean;
}) {
  return (
    <ExerciseVideoPlayer
      videoUrl={videoUrl}
      exerciseName={exerciseName}
      autoPlay={isVisible}
      showThumbnailFirst={false}
    />
  );
}

// Wrapper component for Explore/Preview with thumbnail behavior
export function PreviewVideoPlayer({
  videoUrl,
  exerciseName,
}: {
  videoUrl: string;
  exerciseName?: string;
}) {
  return (
    <ExerciseVideoPlayer
      videoUrl={videoUrl}
      exerciseName={exerciseName}
      autoPlay={false}
      showThumbnailFirst={true}
    />
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullscreenContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    aspectRatio: undefined,
    borderRadius: 0,
  },
  videoTouchArea: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoHidden: {
    opacity: 0,
    position: 'absolute',
  },
  thumbnailContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tapToPlayText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    opacity: 0.9,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  simplePlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loopIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  loopText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  smallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
});
