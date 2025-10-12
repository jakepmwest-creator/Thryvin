// Mock biometric auth for development - replace with actual Expo modules when running in Expo
interface MockLocalAuthentication {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  supportedAuthenticationTypesAsync: () => Promise<number[]>;
  authenticateAsync: (options: any) => Promise<{ success: boolean; error?: string }>;
  AuthenticationType: {
    FACIAL_RECOGNITION: number;
    FINGERPRINT: number;
    IRIS: number;
  };
}

interface MockSecureStore {
  setItemAsync: (key: string, value: string) => Promise<void>;
  getItemAsync: (key: string) => Promise<string | null>;
  deleteItemAsync: (key: string) => Promise<void>;
}

// Mock implementations
const LocalAuthentication: MockLocalAuthentication = {
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  supportedAuthenticationTypesAsync: async () => [1, 2],
  authenticateAsync: async (options) => ({ success: true }),
  AuthenticationType: {
    FACIAL_RECOGNITION: 1,
    FINGERPRINT: 2,
    IRIS: 3,
  },
};

const SecureStore: MockSecureStore = {
  setItemAsync: async (key, value) => console.log('Mock secure store set:', key),
  getItemAsync: async (key) => null,
  deleteItemAsync: async (key) => console.log('Mock secure store delete:', key),
};

interface BiometricAuthState {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

interface AuthResult {
  success: boolean;
  error?: string;
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
  });

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setState({
        isAvailable: isAvailable && isEnrolled,
        isEnrolled,
        supportedTypes,
      });
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const authenticate = async (
    promptMessage = 'Authenticate to access your account'
  ): Promise<AuthResult> => {
    try {
      if (!state.isAvailable) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error === 'user_cancel' ? 'Authentication cancelled' : 'Authentication failed'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication error'
      };
    }
  };

  const saveBiometricCredentials = async (email: string, hashedToken: string) => {
    try {
      await SecureStore.setItemAsync('biometric_email', email);
      await SecureStore.setItemAsync('biometric_token', hashedToken);
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      return false;
    }
  };

  const getBiometricCredentials = async () => {
    try {
      const email = await SecureStore.getItemAsync('biometric_email');
      const token = await SecureStore.getItemAsync('biometric_token');
      return { email, token };
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return { email: null, token: null };
    }
  };

  const clearBiometricCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_email');
      await SecureStore.deleteItemAsync('biometric_token');
      return true;
    } catch (error) {
      console.error('Error clearing biometric credentials:', error);
      return false;
    }
  };

  const getBiometricType = (): string => {
    if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    } else if (state.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    } else {
      return 'Biometric';
    }
  };

  return {
    ...state,
    authenticate,
    saveBiometricCredentials,
    getBiometricCredentials,
    clearBiometricCredentials,
    getBiometricType,
    refresh: checkBiometricAvailability,
  };
};