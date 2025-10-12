import { useState, useEffect, useCallback } from 'react';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credential?: any;
}

interface UseBiometricAuthReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isAuthenticating: boolean;
  authenticate: () => Promise<BiometricAuthResult>;
  register: (userId: string) => Promise<BiometricAuthResult>;
  autoAuthenticate: () => Promise<BiometricAuthResult>;
  disable: () => Promise<void>;
}

// Web biometric utilities using WebAuthn API
const isWebAuthnSupported = () => {
  return !!(navigator.credentials && window.PublicKeyCredential);
};

const isBiometricAvailable = async () => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    // Check if biometric authenticators are available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
};

const generateChallenge = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return array;
};

const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToBuffer = (base64: string) => {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
};

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if Web biometric authentication is supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isBiometricAvailable();
      setIsSupported(supported);
          
      // Check if user has registered biometric credentials
      const credentialId = localStorage.getItem('thryvin-biometric-credential-id');
      setIsRegistered(!!credentialId);
    };

    checkSupport();
  }, []);

  // Register biometric authentication using WebAuthn
  const register = useCallback(async (userId: string): Promise<BiometricAuthResult> => {
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication not supported on this device' };
    }

    try {
      setIsAuthenticating(true);

      const challenge = generateChallenge();
      const publicKeyCredentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: "Thryvin'",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: "Thryvin' User",
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: "direct"
        },
      };

      const credential = await navigator.credentials.create(publicKeyCredentialCreationOptions) as PublicKeyCredential;
      
      if (credential) {
        // Store credential ID and user association
        const credentialId = bufferToBase64(credential.rawId);
        localStorage.setItem('thryvin-biometric-credential-id', credentialId);
        localStorage.setItem('thryvin-biometric-user-id', userId);
        setIsRegistered(true);
        
        return { success: true, credential };
      } else {
        return { success: false, error: 'Registration was cancelled' };
      }
    } catch (error: any) {
      console.error('Biometric registration failed:', error);
      let errorMessage = 'Setup failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric setup was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication not supported';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during biometric setup';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported]);

  // Authenticate using biometrics via WebAuthn
  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isSupported || !isRegistered) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    try {
      setIsAuthenticating(true);

      const credentialId = localStorage.getItem('thryvin-biometric-credential-id');
      if (!credentialId) {
        return { success: false, error: 'No biometric credentials found. Please set up biometrics in Settings.' };
      }

      const challenge = generateChallenge();
      const publicKeyCredentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [{
            id: base64ToBuffer(credentialId),
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      };

      const credential = await navigator.credentials.get(publicKeyCredentialRequestOptions) as PublicKeyCredential;
      
      if (credential) {
        return { success: true, credential };
      } else {
        return { success: false, error: 'Authentication was cancelled' };
      }
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during authentication';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported, isRegistered]);

  // Auto-authenticate when called (like phone unlock)
  const autoAuthenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication not supported' };
    }

    // If not registered, return false but don't show error
    if (!isRegistered) {
      return { success: false, error: 'Not registered' };
    }

    // Trigger authentication automatically
    return authenticate();
  }, [isSupported, isRegistered, authenticate]);

  // Disable/remove biometric authentication
  const disable = useCallback(async (): Promise<void> => {
    localStorage.removeItem('thryvin-biometric-credential-id');
    localStorage.removeItem('thryvin-biometric-user-id');
    setIsRegistered(false);
  }, []);

  return {
    isSupported,
    isRegistered,
    isAuthenticating,
    authenticate,
    register,
    autoAuthenticate,
    disable,
  };
}