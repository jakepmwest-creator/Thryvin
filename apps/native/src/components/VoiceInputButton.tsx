import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { COLORS } from '../constants/colors';

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function VoiceInputButton({ 
  onTranscription, 
  onError,
  size = 'small',
  style 
}: VoiceInputButtonProps) {
  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onTranscription,
    onError,
  });

  const sizeStyles = {
    small: { paddingHorizontal: 12, paddingVertical: 6, iconSize: 18, fontSize: 12 },
    medium: { paddingHorizontal: 16, paddingVertical: 10, iconSize: 22, fontSize: 14 },
    large: { paddingHorizontal: 20, paddingVertical: 14, iconSize: 26, fontSize: 16 },
  };

  const currentSize = sizeStyles[size];

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording) return 'Stop';
    return 'Voice';
  };

  const getIcon = () => {
    if (isProcessing) return null;
    if (isRecording) return 'stop';
    return 'mic';
  };

  const getGradientColors = (): [string, string] => {
    if (isRecording) return ['#FF3B30', '#FF6B6B'];
    return [COLORS.gradientStart, COLORS.gradientEnd];
  };

  return (
    <TouchableOpacity
      style={[styles.wrapper, style]}
      onPress={toggleRecording}
      disabled={isProcessing}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={[
          styles.button,
          {
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons 
            name={getIcon() as any} 
            size={currentSize.iconSize} 
            color={COLORS.white} 
          />
        )}
        <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
          {getButtonText()}
        </Text>
        {isRecording && (
          <View style={styles.recordingDot} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 6,
  },
  text: {
    color: COLORS.white,
    fontWeight: '600',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginLeft: 4,
  },
});
