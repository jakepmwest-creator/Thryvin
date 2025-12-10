import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-app.preview.emergentagent.com';

interface UseVoiceInputOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  toggleRecording: () => Promise<void>;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onTranscription, onError, maxDuration = 60 } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to use voice input.',
          [{ text: 'OK' }]
        );
        onError?.('Microphone permission denied');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      console.log('🎤 Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);

      // Auto-stop after max duration
      timeoutRef.current = setTimeout(async () => {
        if (recordingRef.current) {
          console.log('⏱️ Max duration reached, stopping...');
          await stopRecording();
        }
      }, maxDuration * 1000);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      onError?.('Failed to start recording');
      setIsRecording(false);
    }
  }, [maxDuration, onError]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) {
      return null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      console.log('🎤 Stopping recording...');
      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('📤 Sending audio for transcription...');
      
      // Create form data with the audio file
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Send to backend for transcription
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transcription failed');
      }

      const result = await response.json();
      const transcription = result.text || '';
      
      console.log('✅ Transcription:', transcription);
      
      if (transcription) {
        onTranscription?.(transcription);
      }

      setIsProcessing(false);
      return transcription;

    } catch (error: any) {
      console.error('❌ Transcription error:', error);
      onError?.(error.message || 'Failed to transcribe audio');
      setIsProcessing(false);
      return null;
    }
  }, [onTranscription, onError]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
