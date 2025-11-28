import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface ExerciseVideoPlayerProps {
  videoUrl: string;
  exerciseName?: string;
  onClose?: () => void;
  autoPlay?: boolean;
}

export function ExerciseVideoPlayer({
  videoUrl,
  exerciseName = 'Exercise',
  onClose,
  autoPlay = true, // Changed to true by default
}: ExerciseVideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(false); // Hidden by default

  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Autoplay on mount
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, []);

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
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const toggleMute = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsLoopingAsync(!isLooping);
      setIsLooping(!isLooping);
    }
  };

  const changePlaybackSpeed = async (speed: number) => {
    if (videoRef.current) {
      await videoRef.current.setRateAsync(speed, true);
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSeek = async (value: number) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(value);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleControlsVisibility = () => {
    setShowControls(!showControls);
    // Reset auto-hide timer
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
  };

  const renderPlayer = () => (
    <View style={[styles.playerContainer, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity
        style={styles.videoTouchArea}
        activeOpacity={1}
        onPress={toggleControlsVisibility}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={isLooping}
          isMuted={isMuted}
          shouldPlay={isPlaying}
          rate={playbackSpeed}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        )}

        {showControls && (
          <>

            {/* Simple Center Play/Pause Button */}
            <View style={styles.centerPlayButton}>
              <TouchableOpacity
                style={styles.simplePlayButton}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
              style={styles.bottomControls}
            >
              {/* Seek Bar */}
              <View style={styles.seekBarContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <View style={styles.seekBarWrapper}>
                  <View style={styles.seekBar}>
                    <View
                      style={[
                        styles.seekBarProgress,
                        { width: `${(position / duration) * 100}%` },
                      ]}
                    />
                  </View>
                  {/* Invisible touch area for seeking */}
                  <View
                    style={styles.seekBarTouchArea}
                    onTouchMove={(e) => {
                      const locationX = e.nativeEvent.locationX;
                      const seekBarWidth = SCREEN_WIDTH - 120;
                      const seekPosition = (locationX / seekBarWidth) * duration;
                      handleSeek(seekPosition);
                    }}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={togglePlayPause}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleLoop}
                >
                  <Ionicons
                    name={isLooping ? 'repeat' : 'repeat-outline'}
                    size={24}
                    color={isLooping ? COLORS.accent : COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  <Text style={styles.speedText}>{playbackSpeed}x</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Speed Menu */}
            {showSpeedMenu && (
              <View style={styles.speedMenu}>
                {PLAYBACK_SPEEDS.map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.speedMenuItem,
                      speed === playbackSpeed && styles.speedMenuItemActive,
                    ]}
                    onPress={() => changePlaybackSpeed(speed)}
                  >
                    <Text
                      style={[
                        styles.speedMenuText,
                        speed === playbackSpeed && styles.speedMenuTextActive,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  topButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  centerPlayGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  seekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  seekBarWrapper: {
    flex: 1,
    marginHorizontal: 12,
    position: 'relative',
  },
  seekBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  seekBarProgress: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  seekBarTouchArea: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    height: 24,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  speedMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 8,
    minWidth: 80,
  },
  speedMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  speedMenuItemActive: {
    backgroundColor: COLORS.accent,
  },
  speedMenuText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
    textAlign: 'center',
  },
  speedMenuTextActive: {
    fontWeight: '700',
  },
});
