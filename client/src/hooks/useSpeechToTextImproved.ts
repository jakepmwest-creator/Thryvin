import { useState, useRef, useCallback } from 'react';

interface SpeechToTextOptions {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: string;
  continuous?: boolean;
}

interface SpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  transcript: string;
}

export const useSpeechToTextImproved = ({
  onResult,
  onError,
  onStart,
  onEnd,
  language = 'en-US',
  continuous = false,
}: SpeechToTextOptions): SpeechToTextReturn => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check if Web Speech API is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (isListening) return;

    setError(null);
    setTranscript('');
    finalTranscriptRef.current = '';

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      onStart?.();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      // Process only new results to avoid duplicates
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      const currentTranscript = finalTranscript + interimTranscript;
      setTranscript(currentTranscript);

      // Only send final results to callback to avoid duplicates
      if (finalTranscript.trim() !== finalTranscriptRef.current.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Please check your microphone settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Send final result on end if we have any
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        onResult(finalText);
      }
      onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, continuous, language, onResult, onError, onStart, onEnd]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
    transcript,
  };
};